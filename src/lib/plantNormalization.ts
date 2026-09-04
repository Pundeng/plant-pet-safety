import { Plant } from "../types/plant";

export interface CandidateToxicity {
  catSafety: Plant["catSafety"];
  dogSafety: Plant["dogSafety"];
  symptoms?: Plant["symptoms"];
  source?: {
    name: string;
    url: string;
  };
}

export interface ReferenceImage {
  url: string;
  author: string | null;
  license: string | null;
  citation: string | null;
}

export interface IdentificationCandidate {
  scientificName: string | null;
  commonName: string | null;
  confidence: number;
  lowConfidence: boolean;
  referenceImage: ReferenceImage | null;
  toxicity: CandidateToxicity;
}

export function normalizePlant(
  candidate: IdentificationCandidate,
  imageUrl: string,
): Plant {
  return {
    commonName: candidate.commonName ?? "Unknown",
    scientificName: candidate.scientificName ?? "Unknown",
    imageUrl,
    catSafety: candidate.toxicity.catSafety,
    dogSafety: candidate.toxicity.dogSafety,
    symptoms: candidate.toxicity.symptoms,
    sources: candidate.toxicity.source ? [candidate.toxicity.source] : [],
  };
}
