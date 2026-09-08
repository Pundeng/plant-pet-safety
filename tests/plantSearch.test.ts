import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { searchPlants } from "../src/lib/plantSearch";

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

function mockPlantNet(plants: unknown[]) {
  global.fetch = async () =>
    new Response(JSON.stringify(plants), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
}

test("searches by scientific name", async () => {
  mockPlantNet([
    {
      scientificNameWithoutAuthor: "Monstera deliciosa",
      commonNames: ["Swiss Cheese Plant"],
    },
  ]);

  const results = await searchPlants("monstera deliciosa");

  assert.equal(results.length >= 1, true);
  assert.equal(
    results.some((result) => result.scientificName === "Monstera deliciosa"),
    true,
  );
});

test("searches by common name", async () => {
  const results = await searchPlants("swiss cheese");

  assert.equal(results.length >= 1, true);

  const monstera = results.find(
    (result) => result.scientificName === "Monstera deliciosa",
  );

  assert.ok(monstera);

  assert.equal(
    monstera.commonNames.some(
      (name) => name.toLowerCase() === "swiss cheese plant",
    ),
    true,
  );
});

test("normalizes whitespace and case", async () => {
  mockPlantNet([
    {
      scientificNameWithoutAuthor: "Monstera deliciosa",
      commonNames: ["Swiss Cheese Plant"],
    },
  ]);

  const results = await searchPlants("   MONSTERA    DELICIOSA   ");

  assert.equal(results.length >= 1, true);

  assert.equal(
    results.some((result) => result.scientificName === "Monstera deliciosa"),
    true,
  );
});

test("returns multiple possible matches for ambiguous searches", async () => {
  const results = await searchPlants("prayer plant");

  assert.equal(results.length >= 2, true);

  assert.equal(
    results.some((result) => result.scientificName === "Maranta leuconeura"),
    true,
  );

  assert.equal(
    results.some((result) => result.scientificName === "Calathea orbifolia"),
    true,
  );
});

test("returns no results for an unmatched search", async () => {
  mockPlantNet([]);

  const results = await searchPlants("Definitely not a plant");

  assert.deepEqual(results, []);
});

test("includes local safe plants in search", async () => {
  const results = await searchPlants("Boston Fern");

  assert.equal(
    results.some((result) => result.scientificName === "Nephrolepis exaltata"),
    true,
  );
});

test("finds spider plant by common name", async () => {
  const results = await searchPlants("spider plant");

  assert.equal(results.length >= 1, true);

  assert.equal(
    results.some((result) => result.scientificName === "Chlorophytum comosum"),
    true,
  );
});
