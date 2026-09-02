import { LOW_CONFIDENCE_THRESHOLD } from "./constants";

interface PlantNetSpecies {
  scientificNameWithoutAuthor?: string;
  scientificName?: string;
  commonNames?: string[];
}

interface PlantNetImage {
  organ?: string;
  author?: string;
  license?: string;
  citation?: string;
  url?: {
    o?: string;
    m?: string;
    s?: string;
  };
}

interface PlantNetResult {
  score?: number;
  species?: PlantNetSpecies;
  images?: PlantNetImage[];
}

interface PlantNetResponse {
  results?: PlantNetResult[];
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

function getReferenceImage(
  images: PlantNetImage[] | undefined,
): PlantReferenceImage | null {
  const image = images?.[0];

  if (!image) {
    return null;
  }

  const url = image.url?.m ?? image.url?.o ?? image.url?.s ?? null;

  if (!url) {
    return null;
  }

  return {
    url,
    author: image.author ?? null,
    license: image.license ?? null,
    citation: image.citation ?? null,
  };
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

  const params = new URLSearchParams({
    "api-key": apiKey,
    lang: "en",
    "nb-results": "3",
    "include-related-images": "true",
  });

  const response = await fetch(
    `https://my-api.plantnet.org/v2/identify/all?${params.toString()}`,
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

  const data: PlantNetResponse = await response.json();

  const results = data.results?.slice(0, 3) ?? [];

  if (results.length === 0) {
    return {
      identified: false,
      topResult: null,
      alternatives: [],
    };
  }

  const candidates = results.map((result) => {
    const scientificName =
      result.species?.scientificNameWithoutAuthor ??
      result.species?.scientificName ??
      null;

    const commonName = result.species?.commonNames?.[0] ?? null;

    const confidence = result.score ?? 0;

    return {
      scientificName,
      commonName,
      confidence,
      lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
      referenceImage: getReferenceImage(result.images),
    };
  });

  const [topResult, ...alternatives] = candidates;

  return {
    identified: true,
    topResult,
    alternatives,
  };
}
