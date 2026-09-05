import { ServiceError } from "./apiErrors";
import { fetchWithTimeout, RequestTimeoutError } from "./fetchWithTimeout";
import { findLocalSafePlant } from "./safePlants";

const PLANT_SMART_URL = "https://plantsm.art/api/plants.json";
const PLANT_SMART_TIMEOUT_MS = 8000;

interface PlantSmartSymptom {
  name: string;
}

interface PlantSmartPlant {
  name: string;
  animals: string[];
  symptoms: PlantSmartSymptom[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlantSmartPlant(value: unknown): PlantSmartPlant | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.name !== "string") {
    return null;
  }

  const animals = Array.isArray(value.animals)
    ? value.animals.filter(
        (animal): animal is string => typeof animal === "string",
      )
    : [];

  const symptoms = Array.isArray(value.symptoms)
    ? value.symptoms
        .filter(isRecord)
        .map((symptom) => symptom.name)
        .filter(
          (name): name is string =>
            typeof name === "string" && name.trim().length > 0,
        )
        .map((name) => ({ name }))
    : [];

  return {
    name: value.name,
    animals,
    symptoms,
  };
}

export async function findPlantToxicity(scientificName: string) {
  const normalizedName = scientificName.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(
      PLANT_SMART_URL,
      {},
      PLANT_SMART_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      console.error(
        `[toxicity] Plant Smart request timed out after ${PLANT_SMART_TIMEOUT_MS}ms`,
      );

      throw new ServiceError(
        "TOXICITY_SERVICE_TIMEOUT",
        "Toxicity service timed out.",
      );
    }

    console.error("[toxicity] Plant Smart request failed", error);

    throw new ServiceError(
      "TOXICITY_SERVICE_FAILED",
      "Toxicity service is temporarily unavailable.",
    );
  }

  if (!response.ok) {
    console.error("[toxicity] Plant Smart returned an unsuccessful response", {
      status: response.status,
    });

    throw new ServiceError(
      "TOXICITY_SERVICE_FAILED",
      "Toxicity service is temporarily unavailable.",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch (error) {
    console.error("[toxicity] Plant Smart returned malformed JSON", error);

    throw new ServiceError(
      "TOXICITY_RESPONSE_INVALID",
      "Toxicity service returned an invalid response.",
    );
  }

  if (!Array.isArray(data)) {
    console.error("[toxicity] Plant Smart response was not an array");

    throw new ServiceError(
      "TOXICITY_RESPONSE_INVALID",
      "Toxicity service returned an invalid response.",
    );
  }

  const plants = data
    .map(parsePlantSmartPlant)
    .filter((plant): plant is PlantSmartPlant => plant !== null);

  const plant = plants.find(
    (candidate) => candidate.name.trim().toLowerCase() === normalizedName,
  );

  if (!plant) {
    return findLocalSafePlant(scientificName);
  }

  const catIsToxic = plant.animals.includes("cats");
  const dogIsToxic = plant.animals.includes("dogs");

  const symptoms = plant.symptoms.map((symptom) => symptom.name);

  return {
    catSafety: catIsToxic ? ("toxic" as const) : ("unknown" as const),
    dogSafety: dogIsToxic ? ("toxic" as const) : ("unknown" as const),

    symptoms: {
      cats: catIsToxic ? symptoms : [],
      dogs: dogIsToxic ? symptoms : [],
    },

    source: {
      name: "Plant Smart",
      url: "https://plantsm.art/",
    },
  };
}
