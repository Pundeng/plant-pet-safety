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

test("finds spider plant by common name", async () => {
  const results = await searchPlants("spider plant");

  assert.equal(results.length > 0, true);
  assert.equal(results[0]?.scientificName, "Chlorophytum comosum");

  assert.equal(results[0]?.commonNames.includes("Spider plant"), true);
});

test("normalizes common-name case and whitespace", async () => {
  const results = await searchPlants("   SPIDER    PLANT   ");

  assert.equal(results[0]?.scientificName, "Chlorophytum comosum");
});

test("searches scientific names through PlantNet", async () => {
  mockPlantNet([
    {
      scientificNameWithoutAuthor: "Monstera deliciosa",
      commonNames: ["Swiss cheese plant"],
    },
  ]);

  const results = await searchPlants("Monstera");

  assert.equal(results.length > 0, true);

  assert.equal(
    results.some((result) => result.scientificName === "Monstera deliciosa"),
    true,
  );
});

test("returns multiple aliases for ambiguous common-name searches", async () => {
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

test("returns no results when neither local nor PlantNet data matches", async () => {
  mockPlantNet([]);

  const results = await searchPlants("Definitely not a plant");

  assert.deepEqual(results, []);
});

test("preserves local matches if PlantNet fails", async () => {
  global.fetch = async () =>
    new Response("service unavailable", {
      status: 503,
    });

  const results = await searchPlants("spider");

  assert.equal(
    results.some((result) => result.scientificName === "Chlorophytum comosum"),
    true,
  );
});
