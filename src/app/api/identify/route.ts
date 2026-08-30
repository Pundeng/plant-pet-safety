import { NextResponse } from "next/server";

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

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG images are supported" },
        { status: 400 },
      );
    }

    const apiKey = process.env.PLANTNET_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "PlantNet API key is not configured" },
        { status: 500 },
      );
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

      return NextResponse.json(
        { error: "Plant identification failed" },
        { status: 502 },
      );
    }

    const data = await response.json();

    const bestResult = data.results?.[0];

    if (!bestResult) {
      return NextResponse.json({
        identified: false,
        message: "No plant could be identified",
      });
    }

    const scientificName =
      bestResult.species?.scientificNameWithoutAuthor ??
      bestResult.species?.scientificName ??
      data.bestMatch ??
      null;

    const commonName = bestResult.species?.commonNames?.[0] ?? null;

    const confidence = bestResult.score ?? 0;

    const lowConfidence = confidence < 0.3;

    return NextResponse.json({
      identified: true,
      scientificName,
      commonName,
      confidence,
      lowConfidence,
    });
  } catch (error) {
    console.error("Plant identification error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
