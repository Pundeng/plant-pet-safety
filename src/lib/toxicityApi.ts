interface PlantSmartSymptom {
  name: string;
  slug: string;
}

interface PlantSmartCommonName {
  name: string;
  slug: string;
}

interface PlantSmartPlant {
  pid: string;
  name: string;
  animals: string[];
  common: PlantSmartCommonName[];
  symptoms: PlantSmartSymptom[];
  family: string;
}

const PLANT_SMART_URL = "https://plantsm.art/api/plants.json";

export async function findPlantToxicity(scientificName: string) {
  const response = await fetch(PLANT_SMART_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch plant toxicity data");
  }

  const plants: PlantSmartPlant[] = await response.json();

  const normalizedName = scientificName.trim().toLowerCase();

  const plant = plants.find(
    (plant) => plant.name.trim().toLowerCase() === normalizedName,
  );

  if (!plant) {
    return null;
  }

  const catIsToxic = plant.animals.includes("cats");
  const dogIsToxic = plant.animals.includes("dogs");

  const symptoms = plant.symptoms.map((symptom) => symptom.name);

  return {
    catSafety: catIsToxic ? "toxic" : "unknown",
    dogSafety: dogIsToxic ? "toxic" : "unknown",

    symptoms: {
      cats: catIsToxic ? symptoms : [],
      dogs: dogIsToxic ? symptoms : [],
    },

    source: "Plant Smart",
  };
}

// http://localhost:3000/api/toxicity?name=Monstera%20deliciosa
// sample request to test the API route
