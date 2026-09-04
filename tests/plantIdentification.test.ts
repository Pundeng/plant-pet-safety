import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { identifyPlant } from "../src/lib/plantIdentification";

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

function mockPlantNetResponse(body: unknown, status = 200) {
  global.fetch = async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
}

function createImage(type = "image/jpeg") {
  return new File(["plant"], "plant.jpg", { type });
}

test("extracts scientific name, common name, and confidence", async () => {
  mockPlantNetResponse({
    results: [
      {
        score: 0.91,
        species: {
          scientificNameWithoutAuthor: "Monstera deliciosa",
          commonNames: ["Swiss cheese plant"],
        },
      },
    ],
  });

  const result = await identifyPlant(createImage());

  assert.equal(result.identified, true);
  assert.equal(result.topResult?.scientificName, "Monstera deliciosa");
  assert.equal(result.topResult?.commonName, "Swiss cheese plant");
  assert.equal(result.topResult?.confidence, 0.91);
  assert.equal(result.topResult?.lowConfidence, false);
});

test("uses the configured low-confidence boundary", async () => {
  mockPlantNetResponse({
    results: [
      {
        score: 0.29,
        species: { scientificNameWithoutAuthor: "Plant A" },
      },
      {
        score: 0.3,
        species: { scientificNameWithoutAuthor: "Plant B" },
      },
    ],
  });

  const result = await identifyPlant(createImage());

  assert.equal(result.topResult?.lowConfidence, true);
  assert.equal(result.alternatives[0]?.lowConfidence, false);
});

test("handles a missing common name safely", async () => {
  mockPlantNetResponse({
    results: [
      {
        score: 0.8,
        species: { scientificNameWithoutAuthor: "Monstera deliciosa" },
      },
    ],
  });

  const result = await identifyPlant(createImage());

  assert.equal(result.topResult?.commonName, null);
});

test("handles a missing confidence value without crashing", async () => {
  mockPlantNetResponse({
    results: [
      {
        species: { scientificNameWithoutAuthor: "Monstera deliciosa" },
      },
    ],
  });

  const result = await identifyPlant(createImage());

  assert.equal(result.topResult?.confidence, 0);
  assert.equal(result.topResult?.lowConfidence, true);
});

test("returns a controlled no-result response", async () => {
  mockPlantNetResponse({ results: [] });

  const result = await identifyPlant(createImage());

  assert.deepEqual(result, {
    identified: false,
    topResult: null,
    alternatives: [],
  });
});

test("rejects unsupported image types before calling PlantNet", async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return new Response();
  };

  await assert.rejects(
    identifyPlant(createImage("image/webp")),
    /UNSUPPORTED_IMAGE_TYPE/,
  );

  assert.equal(fetchCalled, false);
});

test("fails clearly when the API key is missing", async () => {
  delete process.env.PLANTNET_API_KEY;

  await assert.rejects(
    identifyPlant(createImage()),
    /PLANTNET_API_KEY_MISSING/,
  );
});

test("converts a failed PlantNet response into a controlled error", async () => {
  mockPlantNetResponse({ error: "upstream failure" }, 503);

  await assert.rejects(identifyPlant(createImage()), /PLANTNET_API_FAILED/);
});
