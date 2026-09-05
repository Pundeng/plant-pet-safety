import { NextResponse } from "next/server";

import { createApiError, ServiceError } from "../../../lib/apiErrors";
import { identifyPlant } from "../../../lib/plantIdentification";
import { findPlantToxicity } from "../../../lib/toxicityApi";

const UNKNOWN_TOXICITY = {
  catSafety: "unknown" as const,
  dogSafety: "unknown" as const,
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        createApiError("INVALID_REQUEST", "No image was uploaded."),
        {
          status: 400,
        },
      );
    }

    const identification = await identifyPlant(image);

    if (!identification.identified || !identification.topResult) {
      return NextResponse.json({
        identification,
        hasSafetyConflict: false,
      });
    }

    const allCandidates = [
      identification.topResult,
      ...identification.alternatives,
    ];

    const enrichedCandidates = await Promise.all(
      allCandidates.map(async (candidate) => {
        if (!candidate.scientificName?.trim()) {
          return {
            ...candidate,
            toxicity: UNKNOWN_TOXICITY,
            toxicityStatus: "unavailable" as const,
          };
        }

        try {
          const toxicity = await findPlantToxicity(candidate.scientificName);

          if (!toxicity) {
            return {
              ...candidate,
              toxicity: UNKNOWN_TOXICITY,
              toxicityStatus: "not_found" as const,
            };
          }

          return {
            ...candidate,
            toxicity,
            toxicityStatus: "available" as const,
          };
        } catch (error) {
          if (
            error instanceof ServiceError &&
            (error.code === "TOXICITY_SERVICE_TIMEOUT" ||
              error.code === "TOXICITY_SERVICE_FAILED" ||
              error.code === "TOXICITY_RESPONSE_INVALID")
          ) {
            console.error(
              "[plant-analysis] Toxicity lookup failed for candidate",
              {
                scientificName: candidate.scientificName,
                code: error.code,
              },
            );

            return {
              ...candidate,
              toxicity: UNKNOWN_TOXICITY,
              toxicityStatus: "service_error" as const,
              toxicityError: {
                code: error.code,
                message: "Toxicity information could not be determined.",
              },
            };
          }

          console.error("[plant-analysis] Unexpected toxicity lookup failure", {
            scientificName: candidate.scientificName,
            error,
          });

          return {
            ...candidate,
            toxicity: UNKNOWN_TOXICITY,
            toxicityStatus: "service_error" as const,
            toxicityError: {
              code: "TOXICITY_SERVICE_FAILED" as const,
              message: "Toxicity information could not be determined.",
            },
          };
        }
      }),
    );

    const topResult = enrichedCandidates[0] ?? null;
    const alternatives = enrichedCandidates.slice(1);

    const safetyProfiles = new Set(
      enrichedCandidates.map(
        (candidate) =>
          `${candidate.toxicity.catSafety}-${candidate.toxicity.dogSafety}`,
      ),
    );

    return NextResponse.json({
      identification: {
        identified: true,
        topResult,
        alternatives,
      },

      hasSafetyConflict: safetyProfiles.size > 1,
    });
  } catch (error) {
    console.error("[plant-analysis] Analysis failed", error);

    if (error instanceof ServiceError) {
      switch (error.code) {
        case "UNSUPPORTED_IMAGE_TYPE":
          return NextResponse.json(
            createApiError(
              error.code,
              "Only JPEG and PNG images are supported.",
            ),
            {
              status: 400,
            },
          );

        case "IDENTIFICATION_NOT_CONFIGURED":
          return NextResponse.json(
            createApiError(
              error.code,
              "Plant identification service is not configured.",
            ),
            {
              status: 500,
            },
          );

        case "IDENTIFICATION_SERVICE_TIMEOUT":
          return NextResponse.json(
            createApiError(
              error.code,
              "Plant identification service timed out. Please try again.",
            ),
            {
              status: 504,
            },
          );

        case "IDENTIFICATION_SERVICE_FAILED":
        case "IDENTIFICATION_RESPONSE_INVALID":
          return NextResponse.json(
            createApiError(
              error.code,
              "Plant identification is temporarily unavailable.",
            ),
            {
              status: 502,
            },
          );
      }
    }

    return NextResponse.json(
      createApiError(
        "INTERNAL_ERROR",
        "Plant analysis could not be completed.",
      ),
      {
        status: 500,
      },
    );
  }
}
