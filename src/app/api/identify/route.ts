import { NextResponse } from "next/server";
import { identifyPlant } from "@/lib/plantIdentification";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "No image was uploaded" },
        { status: 400 },
      );
    }

    const result = await identifyPlant(image);

    if (!result.identified) {
      return NextResponse.json({
        identified: false,
        message: "No plant could be identified",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Plant identification error:", error);

    if (error instanceof Error) {
      if (error.message === "UNSUPPORTED_IMAGE_TYPE") {
        return NextResponse.json(
          { error: "Only JPEG and PNG images are supported" },
          { status: 400 },
        );
      }

      if (error.message === "PLANTNET_API_KEY_MISSING") {
        return NextResponse.json(
          { error: "PlantNet API key is not configured" },
          { status: 500 },
        );
      }

      if (error.message === "PLANTNET_API_FAILED") {
        return NextResponse.json(
          { error: "Plant identification failed" },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
