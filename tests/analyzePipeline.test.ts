import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/analyze/route";

const originalFetch = global.fetch;
const originalApiKey = process.env.PLANTNET_API_KEY;

beforeEach(() => {
  process.env.PLANTNET_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;

  if (originalApiKey === undefined) {
    delete process.env.PLANTNET_API_KEY;
  } else {
    process.env.PLANTNET_API_KEY = originalApiKey;
  }
});

function createRequest() {
  const formData = new FormData();
  formData.append(
    "image",
    new File(["plant"], "plant.jpg", { type: "image/jpeg" }),
  );

  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: formData,
  });
}

test("passes identified scientific names into toxicity lookup", async () => {
  const requestedUrls: string[] = [];

  global.fetch = async (input) => {
    const url = String(input);
    requestedUrls.push(url);

    if (url.includes("my-api.plantnet.org")) {
      return new Response(
        JSON.stringify({
          results: [
            {
              score: 0.91,
              species: {
                scientificNameWithoutAuthor: "Monstera deliciosa",
                commonNames: ["Swiss cheese plant"],
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.includes("plantsm.art/api/plants.json")) {
      return new Response(
        JSON.stringify([
          {
            pid: "monstera",
            name: "Monstera deliciosa",
            animals: ["cats", "dogs"],
            common: [],
            symptoms: [{ name: "Drooling", slug: "drooling" }],
            family: "Araceae",
          },
        ]),
        { status: 200 },
      );
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.identification.identified, true);
  assert.equal(
    body.identification.topResult.scientificName,
    "Monstera deliciosa",
  );
  assert.equal(body.identification.topResult.toxicity.catSafety, "toxic");
  assert.equal(body.identification.topResult.toxicity.dogSafety, "toxic");
  assert.equal(
    requestedUrls.some((url) => url.includes("plantsm.art/api/plants.json")),
    true,
  );
});

test("skips toxicity lookup when identification has no result", async () => {
  let toxicityCalled = false;

  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("my-api.plantnet.org")) {
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }

    if (url.includes("plantsm.art")) {
      toxicityCalled = true;
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.identification.identified, false);
  assert.equal(toxicityCalled, false);
});

test("represents a missing toxicity record as unknown", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("my-api.plantnet.org")) {
      return new Response(
        JSON.stringify({
          results: [
            {
              score: 0.8,
              species: {
                scientificNameWithoutAuthor: "Unregistered plant species",
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.includes("plantsm.art/api/plants.json")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(body.identification.topResult.toxicity.catSafety, "unknown");
  assert.equal(body.identification.topResult.toxicity.dogSafety, "unknown");
});

test("returns a controlled API error when PlantNet fails", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("my-api.plantnet.org")) {
      return new Response("upstream failure", { status: 503 });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error.code, "IDENTIFICATION_SERVICE_FAILED");
  assert.equal(
    body.error.message,
    "Plant identification is temporarily unavailable.",
  );
});

test("preserves identification when toxicity service fails", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("my-api.plantnet.org")) {
      return new Response(
        JSON.stringify({
          results: [
            {
              score: 0.91,
              species: {
                scientificNameWithoutAuthor: "Monstera deliciosa",
                commonNames: ["Swiss cheese plant"],
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.includes("plantsm.art")) {
      return new Response("service unavailable", {
        status: 503,
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.identification.identified, true);

  assert.equal(
    body.identification.topResult.scientificName,
    "Monstera deliciosa",
  );

  assert.equal(body.identification.topResult.toxicity.catSafety, "unknown");

  assert.equal(body.identification.topResult.toxicity.dogSafety, "unknown");

  assert.equal(body.identification.topResult.toxicityStatus, "service_error");
});

test("one failed alternative toxicity lookup does not fail analysis", async () => {
  let toxicityCall = 0;

  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("my-api.plantnet.org")) {
      return new Response(
        JSON.stringify({
          results: [
            {
              score: 0.9,
              species: {
                scientificNameWithoutAuthor: "Plant one",
              },
            },
            {
              score: 0.7,
              species: {
                scientificNameWithoutAuthor: "Plant two",
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url.includes("plantsm.art")) {
      toxicityCall += 1;

      if (toxicityCall === 1) {
        return new Response(
          JSON.stringify([
            {
              name: "Plant one",
              animals: ["cats"],
              symptoms: [],
            },
          ]),
          { status: 200 },
        );
      }

      return new Response("service unavailable", {
        status: 503,
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const response = await POST(createRequest());
  const body = await response.json();

  assert.equal(response.status, 200);

  assert.equal(body.identification.topResult.toxicity.catSafety, "toxic");

  assert.equal(
    body.identification.alternatives[0].toxicity.catSafety,
    "unknown",
  );

  assert.equal(
    body.identification.alternatives[0].toxicityStatus,
    "service_error",
  );
});
