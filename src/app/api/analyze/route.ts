import { NextResponse } from "next/server";
import { identifyPlant } from "@/lib/plantIdentification";
import { findPlantToxicity } from "@/lib/toxicityApi";

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

    const identification = await identifyPlant(image);

    if (!identification.identified || !identification.scientificName) {
      return NextResponse.json({
        identification,
        toxicity: null,
      });
    }

    const toxicity = await findPlantToxicity(identification.scientificName);

    return NextResponse.json({
      identification,
      toxicity,
    });
  } catch (error) {
    console.error("Plant analysis error:", error);

    return NextResponse.json(
      { error: "Plant analysis failed" },
      { status: 500 },
    );
  }
}
