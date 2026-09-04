import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/identify/route";

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

function createImageRequest(type = "image/jpeg") {
  const formData = new FormData();

  formData.append(
    "image",
    new File(["plant"], "plant.jpg", {
      type,
    }),
  );

  return new Request("http://localhost/api/identify", {
    method: "POST",
    body: formData,
  });
}

test("returns 400 when no image is uploaded", async () => {
  const request = new Request("http://localhost/api/identify", {
    method: "POST",
    body: new FormData(),
  });

  const response = await POST(request);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "No image was uploaded");
});

test("returns identification result on successful PlantNet response", async () => {
  global.fetch = async () =>
    new Response(
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
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  const response = await POST(createImageRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.identified, true);

  assert.equal(body.topResult.scientificName, "Monstera deliciosa");

  assert.equal(body.topResult.commonName, "Swiss cheese plant");

  assert.equal(body.topResult.confidence, 0.91);
  assert.equal(body.topResult.lowConfidence, false);
});

test("returns controlled no-result response when no plant is identified", async () => {
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        results: [],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  const response = await POST(createImageRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.identified, false);
  assert.equal(body.message, "No plant could be identified");
});

test("returns 400 for unsupported image types", async () => {
  const response = await POST(createImageRequest("image/webp"));

  const body = await response.json();

  assert.equal(response.status, 400);

  assert.equal(body.error, "Only JPEG and PNG images are supported");
});

test("returns 500 when PlantNet API key is missing", async () => {
  delete process.env.PLANTNET_API_KEY;

  const response = await POST(createImageRequest());
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, "PlantNet API key is not configured");
});

test("returns 502 when PlantNet fails", async () => {
  global.fetch = async () =>
    new Response("PlantNet unavailable", {
      status: 503,
    });

  const response = await POST(createImageRequest());
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error, "Plant identification failed");
});
