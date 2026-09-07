import plantAliasesData from "../data/plantAliases.json";

import { ServiceError } from "./apiErrors";
import { fetchWithTimeout, RequestTimeoutError } from "./fetchWithTimeout";

const PLANTNET_TIMEOUT_MS = 8000;
const MAX_SEARCH_RESULTS = 8;

interface PlantAlias {
  scientificName: string;
  commonNames: string[];
}

interface PlantNetSpecies {
  scientificNameWithoutAuthor?: unknown;
  scientificName?: unknown;
  commonNames?: unknown;
}

export interface PlantSearchResult {
  scientificName: string;
  commonNames: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizePlantSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getCommonNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    )
    .map((name) => name.trim());
}

function matchesSearch(value: string, query: string) {
  return normalizePlantSearch(value).includes(query);
}

function startsWithSearch(value: string, query: string) {
  return normalizePlantSearch(value).startsWith(query);
}

function searchLocalAliases(query: string): PlantSearchResult[] {
  const plants = plantAliasesData.plants as PlantAlias[];

  return plants
    .filter((plant) => {
      const scientificMatch = matchesSearch(plant.scientificName, query);

      const commonMatch = plant.commonNames.some((commonName) =>
        matchesSearch(commonName, query),
      );

      return scientificMatch || commonMatch;
    })
    .map((plant) => ({
      scientificName: plant.scientificName,
      commonNames: plant.commonNames,
    }));
}

function parsePlantNetSpecies(value: unknown): PlantSearchResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const species = value as PlantNetSpecies;

  const scientificName =
    getString(species.scientificNameWithoutAuthor) ??
    getString(species.scientificName);

  if (!scientificName) {
    return null;
  }

  return {
    scientificName,
    commonNames: getCommonNames(species.commonNames),
  };
}

function combineResults(
  localResults: PlantSearchResult[],
  plantNetResults: PlantSearchResult[],
  query: string,
) {
  const combined = new Map<string, PlantSearchResult>();

  for (const result of [...localResults, ...plantNetResults]) {
    const key = normalizePlantSearch(result.scientificName);

    const existing = combined.get(key);

    if (!existing) {
      combined.set(key, {
        scientificName: result.scientificName,
        commonNames: [...result.commonNames],
      });

      continue;
    }

    for (const commonName of result.commonNames) {
      const alreadyExists = existing.commonNames.some(
        (existingName) =>
          normalizePlantSearch(existingName) ===
          normalizePlantSearch(commonName),
      );

      if (!alreadyExists) {
        existing.commonNames.push(commonName);
      }
    }
  }

  return [...combined.values()]
    .sort((a, b) => {
      const aCommonExact = a.commonNames.some(
        (name) => normalizePlantSearch(name) === query,
      );

      const bCommonExact = b.commonNames.some(
        (name) => normalizePlantSearch(name) === query,
      );

      if (aCommonExact !== bCommonExact) {
        return aCommonExact ? -1 : 1;
      }

      const aScientificExact = normalizePlantSearch(a.scientificName) === query;

      const bScientificExact = normalizePlantSearch(b.scientificName) === query;

      if (aScientificExact !== bScientificExact) {
        return aScientificExact ? -1 : 1;
      }

      const aCommonStarts = a.commonNames.some((name) =>
        startsWithSearch(name, query),
      );

      const bCommonStarts = b.commonNames.some((name) =>
        startsWithSearch(name, query),
      );

      if (aCommonStarts !== bCommonStarts) {
        return aCommonStarts ? -1 : 1;
      }

      const aScientificStarts = startsWithSearch(a.scientificName, query);

      const bScientificStarts = startsWithSearch(b.scientificName, query);

      if (aScientificStarts !== bScientificStarts) {
        return aScientificStarts ? -1 : 1;
      }

      return a.scientificName.localeCompare(b.scientificName);
    })
    .slice(0, MAX_SEARCH_RESULTS);
}

async function searchPlantNet(
  searchInput: string,
): Promise<PlantSearchResult[]> {
  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    console.error("[plant-search] PLANTNET_API_KEY is not configured");

    throw new ServiceError(
      "IDENTIFICATION_NOT_CONFIGURED",
      "Plant search service is not configured.",
    );
  }

  const params = new URLSearchParams({
    "api-key": apiKey,
    lang: "en",
    prefix: searchInput,
    pageSize: String(MAX_SEARCH_RESULTS),
    page: "1",
  });

  let response: Response;

  try {
    response = await fetchWithTimeout(
      `https://my-api.plantnet.org/v2/species?${params.toString()}`,
      {},
      PLANTNET_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      console.error(
        `[plant-search] Pl@ntNet request timed out after ${PLANTNET_TIMEOUT_MS}ms`,
      );

      throw new ServiceError(
        "IDENTIFICATION_SERVICE_TIMEOUT",
        "Plant search service timed out.",
      );
    }

    console.error("[plant-search] Pl@ntNet request failed", error);

    throw new ServiceError(
      "IDENTIFICATION_SERVICE_FAILED",
      "Plant search service is temporarily unavailable.",
    );
  }

  if (!response.ok) {
    console.error("[plant-search] Pl@ntNet returned an unsuccessful response", {
      status: response.status,
    });

    throw new ServiceError(
      "IDENTIFICATION_SERVICE_FAILED",
      "Plant search service is temporarily unavailable.",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch (error) {
    console.error("[plant-search] Pl@ntNet returned malformed JSON", error);

    throw new ServiceError(
      "IDENTIFICATION_RESPONSE_INVALID",
      "Plant search service returned an invalid response.",
    );
  }

  if (!Array.isArray(data)) {
    console.error("[plant-search] Pl@ntNet species response was not an array");

    throw new ServiceError(
      "IDENTIFICATION_RESPONSE_INVALID",
      "Plant search service returned an invalid response.",
    );
  }

  return data
    .map(parsePlantNetSpecies)
    .filter((plant): plant is PlantSearchResult => plant !== null);
}

export async function searchPlants(
  searchInput: string,
): Promise<PlantSearchResult[]> {
  const cleanedInput = searchInput.trim().replace(/\s+/g, " ");
  const query = normalizePlantSearch(cleanedInput);

  if (!query) {
    return [];
  }

  const localResults = searchLocalAliases(query);

  const hasExactLocalMatch = localResults.some(
    (result) =>
      normalizePlantSearch(result.scientificName) === query ||
      result.commonNames.some((name) => normalizePlantSearch(name) === query),
  );

  if (hasExactLocalMatch) {
    return combineResults(localResults, [], query);
  }

  let plantNetResults: PlantSearchResult[] = [];

  try {
    plantNetResults = await searchPlantNet(cleanedInput);
  } catch (error) {
    if (localResults.length > 0) {
      console.error(
        "[plant-search] Pl@ntNet search failed; returning local matches",
        error,
      );

      return combineResults(localResults, [], query);
    }

    throw error;
  }

  return combineResults(localResults, plantNetResults, query);
}
