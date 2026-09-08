import { NextRequest, NextResponse } from "next/server";

import { createApiError, ServiceError } from "@/lib/apiErrors";
import { searchPlants } from "@/lib/plantSearch";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json(
      createApiError("INVALID_REQUEST", "A plant search term is required."),
      {
        status: 400,
      },
    );
  }

  try {
    const results = await searchPlants(query);

    return NextResponse.json({
      query: query.trim(),
      results,
    });
  } catch (error) {
    console.error("[plant-search-route] Plant search failed", error);

    if (error instanceof ServiceError) {
      switch (error.code) {
        case "IDENTIFICATION_NOT_CONFIGURED":
          return NextResponse.json(
            createApiError(
              error.code,
              "Plant search service is not configured.",
            ),
            {
              status: 500,
            },
          );

        case "IDENTIFICATION_SERVICE_TIMEOUT":
          return NextResponse.json(
            createApiError(
              error.code,
              "Plant search timed out. Please try again.",
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
              "Plant search is temporarily unavailable.",
            ),
            {
              status: 502,
            },
          );
      }
    }

    return NextResponse.json(
      createApiError("INTERNAL_ERROR", "Plant search could not be completed."),
      {
        status: 500,
      },
    );
  }
}
