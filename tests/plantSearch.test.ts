import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { searchPlants } from "../src/lib/plantSearch";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockPlants(plants: unknown[]) {
  global.fetch = async () =>
    new Response(JSON.stringify(plants), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
}

test("searches by scientific name", async () => {
  mockPlants([
    {
      name: "Monstera deliciosa",
      common: [{ name: "Swiss Cheese Plant" }],
    },
  ]);

  const results = await searchPlants("monstera deliciosa");

  assert.equal(results.length, 1);
  assert.equal(results[0]?.scientificName, "Monstera deliciosa");
});

test("searches by common name", async () => {
  mockPlants([
    {
      name: "Monstera deliciosa",
      common: [{ name: "Swiss Cheese Plant" }],
    },
  ]);

  const results = await searchPlants("swiss cheese");

  assert.equal(results.length, 1);
  assert.equal(results[0]?.scientificName, "Monstera deliciosa");
  assert.deepEqual(results[0]?.commonNames, ["Swiss Cheese Plant"]);
});

test("normalizes whitespace and case", async () => {
  mockPlants([
    {
      name: "Monstera deliciosa",
      common: [{ name: "Swiss Cheese Plant" }],
    },
  ]);

  const results = await searchPlants("   MONSTERA    DELICIOSA   ");

  assert.equal(results.length, 1);
  assert.equal(results[0]?.scientificName, "Monstera deliciosa");
});

test("returns multiple possible matches for ambiguous searches", async () => {
  mockPlants([
    {
      name: "Aloe vera",
      common: [{ name: "Aloe" }],
    },
    {
      name: "Aloe arborescens",
      common: [{ name: "Krantz Aloe" }],
    },
  ]);

  const results = await searchPlants("aloe");

  assert.equal(results.length, 2);
});

test("returns no results for an unmatched search", async () => {
  mockPlants([]);

  const results = await searchPlants("Definitely not a plant");

  assert.deepEqual(results, []);
});

test("includes local safe plants in search", async () => {
  mockPlants([]);

  const results = await searchPlants("Boston Fern");

  assert.equal(
    results.some(
      (result) => result.scientificName === "Nephrolepis exaltata",
    ),
    true,
  );
});