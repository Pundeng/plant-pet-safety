import { NextResponse } from "next/server";
import { identifyPlant } from "@/lib/plantIdentification";
import { findPlantToxicity } from "@/lib/toxicityApi";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "No image was uploaded",
        },
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
        const toxicity = candidate.scientificName
          ? await findPlantToxicity(candidate.scientificName)
          : null;

        console.log("Toxicity lookup:", candidate.scientificName, toxicity);

        return {
          ...candidate,
          toxicity: {
            catSafety: toxicity?.catSafety ?? "unknown",
            dogSafety: toxicity?.dogSafety ?? "unknown",
            symptoms: toxicity?.symptoms,
            source: toxicity?.source,
          },
        };
      }),
    );

    const [topResult, ...alternatives] = enrichedCandidates;

    const safetyProfiles = new Set(
      enrichedCandidates.map(
        (candidate) =>
          `${candidate.toxicity.catSafety}-${candidate.toxicity.dogSafety}`,
      ),
    );

    const hasSafetyConflict = safetyProfiles.size > 1;

    return NextResponse.json({
      identification: {
        identified: true,
        topResult,
        alternatives,
      },

      hasSafetyConflict,
    });
  } catch (error) {
    console.error("Plant analysis error:", error);

    if (error instanceof Error && error.message === "UNSUPPORTED_IMAGE_TYPE") {
      return NextResponse.json(
        {
          error: "Only JPEG and PNG images are supported",
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message === "PLANTNET_API_KEY_MISSING"
    ) {
      return NextResponse.json(
        {
          error: "Plant identification service is not configured",
        },
        {
          status: 500,
        },
      );
    }

    if (error instanceof Error && error.message === "PLANTNET_API_FAILED") {
      return NextResponse.json(
        {
          error: "Plant identification failed",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Plant analysis failed",
      },
      {
        status: 500,
      },
    );
  }
}
