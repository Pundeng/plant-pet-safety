import { LOW_CONFIDENCE_THRESHOLD } from "./constants";
import { ServiceError } from "./apiErrors";
import { fetchWithTimeout, RequestTimeoutError } from "./fetchWithTimeout";

const PLANTNET_TIMEOUT_MS = 8000;

interface PlantNetResult {
  score?: unknown;
  species?: unknown;
  images?: unknown;
}

interface PlantNetResponse {
  results?: unknown;
}

export interface PlantReferenceImage {
  url: string;
  author: string | null;
  license: string | null;
  citation: string | null;
}

export interface PlantIdentificationCandidate {
  scientificName: string | null;
  commonName: string | null;
  confidence: number;
  lowConfidence: boolean;
  referenceImage: PlantReferenceImage | null;
}

export interface PlantIdentificationResult {
  identified: boolean;
  topResult: PlantIdentificationCandidate | null;
  alternatives: PlantIdentificationCandidate[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getScientificName(species: unknown): string | null {
  if (!isRecord(species)) {
    return null;
  }

  return (
    getOptionalString(species.scientificNameWithoutAuthor) ??
    getOptionalString(species.scientificName)
  );
}

function getCommonName(species: unknown): string | null {
  if (!isRecord(species) || !Array.isArray(species.commonNames)) {
    return null;
  }

  const commonName = species.commonNames.find(
    (name): name is string =>
      typeof name === "string" && name.trim().length > 0,
  );

  return commonName ?? null;
}

function getConfidence(score: unknown): number {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(1, score));
}

function getReferenceImage(images: unknown): PlantReferenceImage | null {
  if (!Array.isArray(images)) {
    return null;
  }

  for (const value of images) {
    if (!isRecord(value)) {
      continue;
    }

    const urlData = value.url;

    if (!isRecord(urlData)) {
      continue;
    }

    const url =
      getOptionalString(urlData.m) ??
      getOptionalString(urlData.o) ??
      getOptionalString(urlData.s);

    if (!url) {
      continue;
    }

    return {
      url,
      author: getOptionalString(value.author),
      license: getOptionalString(value.license),
      citation: getOptionalString(value.citation),
    };
  }

  return null;
}

function parseCandidate(value: unknown): PlantIdentificationCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const result = value as PlantNetResult;

  const scientificName = getScientificName(result.species);
  const commonName = getCommonName(result.species);
  const confidence = getConfidence(result.score);

  if (!scientificName && !commonName) {
    return null;
  }

  return {
    scientificName,
    commonName,
    confidence,
    lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
    referenceImage: getReferenceImage(result.images),
  };
}

export async function identifyPlant(
  image: File,
): Promise<PlantIdentificationResult> {
  const allowedTypes = ["image/jpeg", "image/png"];

  if (!allowedTypes.includes(image.type)) {
    throw new ServiceError(
      "UNSUPPORTED_IMAGE_TYPE",
      "Only JPEG and PNG images are supported.",
    );
  }

  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    console.error("[plant-identification] PLANTNET_API_KEY is not configured");

    throw new ServiceError(
      "IDENTIFICATION_NOT_CONFIGURED",
      "Plant identification service is not configured.",
    );
  }

  const plantNetFormData = new FormData();
  plantNetFormData.append("images", image);

  const params = new URLSearchParams({
    "api-key": apiKey,
    lang: "en",
    "nb-results": "3",
    "include-related-images": "true",
  });

  let response: Response;

  try {
    response = await fetchWithTimeout(
      `https://my-api.plantnet.org/v2/identify/all?${params.toString()}`,
      {
        method: "POST",
        body: plantNetFormData,
      },
      PLANTNET_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      console.error(
        `[plant-identification] Pl@ntNet request timed out after ${PLANTNET_TIMEOUT_MS}ms`,
      );

      throw new ServiceError(
        "IDENTIFICATION_SERVICE_TIMEOUT",
        "Plant identification service timed out.",
      );
    }

    console.error("[plant-identification] Pl@ntNet request failed", error);

    throw new ServiceError(
      "IDENTIFICATION_SERVICE_FAILED",
      "Plant identification service is temporarily unavailable.",
    );
  }

  if (!response.ok) {
    console.error(
      "[plant-identification] Pl@ntNet returned an unsuccessful response",
      {
        status: response.status,
      },
    );

    throw new ServiceError(
      "IDENTIFICATION_SERVICE_FAILED",
      "Plant identification service is temporarily unavailable.",
    );
  }

  let data: PlantNetResponse;

  try {
    data = (await response.json()) as PlantNetResponse;
  } catch (error) {
    console.error(
      "[plant-identification] Pl@ntNet returned malformed JSON",
      error,
    );

    throw new ServiceError(
      "IDENTIFICATION_RESPONSE_INVALID",
      "Plant identification service returned an invalid response.",
    );
  }

  if (!isRecord(data) || !Array.isArray(data.results)) {
    console.error(
      "[plant-identification] Pl@ntNet response did not contain a valid results array",
    );

    throw new ServiceError(
      "IDENTIFICATION_RESPONSE_INVALID",
      "Plant identification service returned an invalid response.",
    );
  }

  const candidates = data.results
    .slice(0, 3)
    .map(parseCandidate)
    .filter(
      (candidate): candidate is PlantIdentificationCandidate =>
        candidate !== null,
    );

  if (candidates.length === 0) {
    return {
      identified: false,
      topResult: null,
      alternatives: [],
    };
  }

  return {
    identified: true,
    topResult: candidates[0] ?? null,
    alternatives: candidates.slice(1),
  };
}
