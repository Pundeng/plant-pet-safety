import safePlantsData from "@/data/safePlants.json";

interface LocalSafePlant {
  commonName: string;
  scientificName: string;
}

function normalizeScientificName(scientificName: string) {
  return scientificName.trim().replace(/\s+/g, " ").toLowerCase();
}

const safePlantsByScientificName = new Map(
  (safePlantsData.plants as LocalSafePlant[]).map((plant) => [
    normalizeScientificName(plant.scientificName),
    plant,
  ]),
);

export function findLocalSafePlant(scientificName: string) {
  const plant = safePlantsByScientificName.get(
    normalizeScientificName(scientificName),
  );

  if (!plant) {
    return null;
  }

  return {
    catSafety: "safe" as const,
    dogSafety: "safe" as const,
    symptoms: {
      cats: [],
      dogs: [],
    },
    source: {
      name: `${safePlantsData.metadata.sourceName} safe plants (${safePlantsData.metadata.originalSourceName}-sourced)`,
      url: safePlantsData.metadata.sourceUrl,
    },
  };
}
