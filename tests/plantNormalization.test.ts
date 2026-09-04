import test from "node:test";
import assert from "node:assert/strict";
import {
  IdentificationCandidate,
  normalizePlant,
} from "../src/lib/plantNormalization";

function candidate(
  overrides: Partial<IdentificationCandidate> = {},
): IdentificationCandidate {
  return {
    scientificName: "Monstera deliciosa",
    commonName: "Swiss cheese plant",
    confidence: 0.9,
    lowConfidence: false,
    referenceImage: null,
    toxicity: {
      catSafety: "toxic",
      dogSafety: "toxic",
      symptoms: {
        cats: ["Drooling"],
        dogs: ["Drooling"],
      },
      source: {
        name: "Plant Smart",
        url: "https://plantsm.art/",
      },
    },
    ...overrides,
  };
}

test("normalizes identification and toxicity into Plant", () => {
  const result = normalizePlant(candidate(), "blob:plant-image");

  assert.equal(result.commonName, "Swiss cheese plant");
  assert.equal(result.scientificName, "Monstera deliciosa");
  assert.equal(result.imageUrl, "blob:plant-image");
  assert.equal(result.catSafety, "toxic");
  assert.equal(result.dogSafety, "toxic");
  assert.deepEqual(result.symptoms?.cats, ["Drooling"]);
  assert.deepEqual(result.sources, [
    {
      name: "Plant Smart",
      url: "https://plantsm.art/",
    },
  ]);
});

test("falls back safely when plant names are missing", () => {
  const result = normalizePlant(
    candidate({
      commonName: null,
      scientificName: null,
    }),
    "blob:plant-image",
  );

  assert.equal(result.commonName, "Unknown");
  assert.equal(result.scientificName, "Unknown");
});

test("preserves unknown safety instead of converting it to safe", () => {
  const result = normalizePlant(
    candidate({
      toxicity: {
        catSafety: "unknown",
        dogSafety: "unknown",
      },
    }),
    "blob:plant-image",
  );

  assert.equal(result.catSafety, "unknown");
  assert.equal(result.dogSafety, "unknown");
  assert.deepEqual(result.sources, []);
});
