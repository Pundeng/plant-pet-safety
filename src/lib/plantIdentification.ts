import { LOW_CONFIDENCE_THRESHOLD } from "./constants";

export interface PlantIdentificationResult {
  identified: boolean;
  scientificName: string | null;
  commonName: string | null;
  confidence: number;
  lowConfidence: boolean;
}

export async function identifyPlant(
  image: File,
): Promise<PlantIdentificationResult> {
  const allowedTypes = ["image/jpeg", "image/png"];

  if (!allowedTypes.includes(image.type)) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }

  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    throw new Error("PLANTNET_API_KEY_MISSING");
  }

  const plantNetFormData = new FormData();

  plantNetFormData.append("images", image);

  const response = await fetch(
    `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}&lang=en`,
    {
      method: "POST",
      body: plantNetFormData,
    },
  );

  if (!response.ok) {
    console.error(
      "PlantNet API error:",
      response.status,
      await response.text(),
    );

    throw new Error("PLANTNET_API_FAILED");
  }

  const data = await response.json();

  const bestResult = data.results?.[0];

  if (!bestResult) {
    return {
      identified: false,
      scientificName: null,
      commonName: null,
      confidence: 0,
      lowConfidence: false,
    };
  }

  const scientificName =
    bestResult.species?.scientificNameWithoutAuthor ??
    bestResult.species?.scientificName ??
    data.bestMatch ??
    null;

  const commonName = bestResult.species?.commonNames?.[0] ?? null;

  const confidence = bestResult.score ?? 0;

  return {
    identified: true,
    scientificName,
    commonName,
    confidence,
    lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
  };
}
