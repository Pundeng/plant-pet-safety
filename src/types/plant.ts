export type SafetyStatus = "safe" | "toxic" | "unknown";

export interface Source {
  name: string;
  url: string;
}

export interface PlantSymptom {
  cats?: string[];
  dogs?: string[];
}

export interface Plant {
  commonName: string;
  scientificName: string;
  imageUrl: string;

  catSafety: SafetyStatus;
  dogSafety: SafetyStatus;

  toxicPrinciples?: string[];
  toxicParts?: string[];

  symptoms?: PlantSymptom;

  sources?: Source[];
}
