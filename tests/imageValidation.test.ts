import test from "node:test";
import assert from "node:assert/strict";
import { MAX_FILE_SIZE, validateImage } from "../src/lib/imageValidation";

test("accepts JPEG images", () => {
  assert.equal(validateImage({ type: "image/jpeg", size: 1024 }), null);
});

test("accepts PNG images", () => {
  assert.equal(validateImage({ type: "image/png", size: 1024 }), null);
});

test("rejects unsupported image types", () => {
  assert.equal(
    validateImage({ type: "image/webp", size: 1024 }),
    "Please upload a JPEG or PNG image.",
  );
});

test("accepts an image exactly at the size limit", () => {
  assert.equal(
    validateImage({ type: "image/jpeg", size: MAX_FILE_SIZE }),
    null,
  );
});

test("rejects an image above the size limit", () => {
  assert.equal(
    validateImage({ type: "image/jpeg", size: MAX_FILE_SIZE + 1 }),
    "This image is too large. Please upload an image under 5 MB.",
  );
});
