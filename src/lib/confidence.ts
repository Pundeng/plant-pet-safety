export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function normalizeConfidence(
  confidence: number | null | undefined,
): number | null {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return null;
  }

  return Math.max(0, Math.min(1, confidence));
}

export function isLowConfidence(confidence: number | null): boolean {
  if (confidence === null) {
    return true;
  }

  return confidence < LOW_CONFIDENCE_THRESHOLD;
}
