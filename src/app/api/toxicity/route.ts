import { NextRequest, NextResponse } from "next/server";

import { createApiError, ServiceError } from "../../../lib/apiErrors";
import { findPlantToxicity } from "../../../lib/toxicityApi";

export async function GET(request: NextRequest) {
  const scientificName = request.nextUrl.searchParams.get("name");

  if (!scientificName?.trim()) {
    return NextResponse.json(
      createApiError("INVALID_REQUEST", "A plant name is required."),
      {
        status: 400,
      },
    );
  }

  try {
    const result = await findPlantToxicity(scientificName);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[toxicity-route] Toxicity lookup failed", {
      scientificName,
      error,
    });

    if (error instanceof ServiceError) {
      if (error.code === "TOXICITY_SERVICE_TIMEOUT") {
        return NextResponse.json(
          createApiError(
            error.code,
            "Toxicity service timed out. Please try again.",
          ),
          {
            status: 504,
          },
        );
      }

      if (
        error.code === "TOXICITY_SERVICE_FAILED" ||
        error.code === "TOXICITY_RESPONSE_INVALID"
      ) {
        return NextResponse.json(
          createApiError(
            error.code,
            "Toxicity information is temporarily unavailable.",
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
        "Toxicity information could not be retrieved.",
      ),
      {
        status: 500,
      },
    );
  }
}
