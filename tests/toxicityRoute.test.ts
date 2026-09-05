import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { GET } from "../src/app/api/toxicity/route";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function createRequest(name?: string) {
  const url = new URL("http://localhost/api/toxicity");

  if (name !== undefined) {
    url.searchParams.set("name", name);
  }

  return new NextRequest(url);
}

test("returns 400 when plant name is missing", async () => {
  const response = await GET(createRequest());
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.equal(body.error.message, "A plant name is required.");
});

test("returns toxicity data for a known toxic plant", async () => {
  global.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          pid: "monstera",
          name: "Monstera deliciosa",
          animals: ["cats", "dogs"],
          common: [
            {
              name: "Swiss Cheese Plant",
              slug: "swiss-cheese-plant",
            },
          ],
          symptoms: [
            {
              name: "Drooling",
              slug: "drooling",
            },
            {
              name: "Vomiting",
              slug: "vomiting",
            },
          ],
          family: "Araceae",
        },
      ]),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  const response = await GET(createRequest("Monstera deliciosa"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.catSafety, "toxic");
  assert.equal(body.dogSafety, "toxic");
  assert.deepEqual(body.symptoms.cats, ["Drooling", "Vomiting"]);
  assert.deepEqual(body.symptoms.dogs, ["Drooling", "Vomiting"]);
  assert.equal(body.source.name, "Plant Smart");
});

test("returns null when no toxicity record exists", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });

  const response = await GET(createRequest("Unregistered plant species"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body, null);
});

test("returns local safe fallback when plant exists in safe dataset", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });

  const response = await GET(createRequest("Nephrolepis exaltata"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.catSafety, "safe");
  assert.equal(body.dogSafety, "safe");
  assert.deepEqual(body.symptoms, {
    cats: [],
    dogs: [],
  });
});

test("returns 502 when toxicity service fails", async () => {
  global.fetch = async () =>
    new Response("service unavailable", {
      status: 503,
    });

  const response = await GET(createRequest("Monstera deliciosa"));
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error.code, "TOXICITY_SERVICE_FAILED");
  assert.equal(
    body.error.message,
    "Toxicity information is temporarily unavailable.",
  );
});
