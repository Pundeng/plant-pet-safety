import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { findPlantToxicity } from "../src/lib/toxicityApi";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockPlants(plants: unknown[]) {
  global.fetch = async () =>
    new Response(JSON.stringify(plants), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
}

test("parses cat and dog toxicity and symptoms", async () => {
  mockPlants([
    {
      pid: "monstera",
      name: "Monstera deliciosa",
      animals: ["cats", "dogs"],
      common: [],
      symptoms: [
        { name: "Oral Irritation", slug: "oral-irritation" },
        { name: "Drooling", slug: "drooling" },
      ],
      family: "Araceae",
    },
  ]);

  const result = await findPlantToxicity("Monstera deliciosa");

  assert.equal(result?.catSafety, "toxic");
  assert.equal(result?.dogSafety, "toxic");
  assert.deepEqual(result?.symptoms.cats, [
    "Oral Irritation",
    "Drooling",
  ]);
  assert.deepEqual(result?.symptoms.dogs, [
    "Oral Irritation",
    "Drooling",
  ]);
});

test("does not infer safe for an animal missing from a toxic record", async () => {
  mockPlants([
    {
      pid: "cat-only",
      name: "Example plant",
      animals: ["cats"],
      common: [],
      symptoms: [{ name: "Vomiting", slug: "vomiting" }],
      family: "Exampleaceae",
    },
  ]);

  const result = await findPlantToxicity("Example plant");

  assert.equal(result?.catSafety, "toxic");
  assert.equal(result?.dogSafety, "unknown");
  assert.deepEqual(result?.symptoms.dogs, []);
});

test("falls back to the local safe-plant dataset", async () => {
  mockPlants([]);

  const result = await findPlantToxicity("  NEPHROLEPIS   EXALTATA ");

  assert.equal(result?.catSafety, "safe");
  assert.equal(result?.dogSafety, "safe");
  assert.deepEqual(result?.symptoms, { cats: [], dogs: [] });
});

test("returns null when no toxicity or local safe record exists", async () => {
  mockPlants([]);

  const result = await findPlantToxicity(
    "Definitely not a registered plant",
  );

  assert.equal(result, null);
});

test("throws a controlled error when Plant Smart fails", async () => {
  global.fetch = async () =>
    new Response("service unavailable", { status: 503 });

  await assert.rejects(
    findPlantToxicity("Monstera deliciosa"),
    /Failed to fetch plant toxicity data/,
  );
});
