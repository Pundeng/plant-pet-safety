import { NextResponse } from "next/server";

import { createApiError, ServiceError } from "../../../lib/apiErrors";
import { identifyPlant } from "../../../lib/plantIdentification";

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

    const result = await identifyPlant(image);

    if (!result.identified) {
      return NextResponse.json({
        identified: false,
        message: "No plant could be identified.",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[identify-route] Identification failed", error);

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
        "Plant identification could not be completed.",
      ),
      {
        status: 500,
      },
    );
  }
}
