import { NextRequest, NextResponse } from "next/server";
import { findPlantToxicity } from "@/lib/toxicityApi";

export async function GET(request: NextRequest) {
  const scientificName = request.nextUrl.searchParams.get("name");

  if (!scientificName) {
    return NextResponse.json({ error: "Missing plant name" }, { status: 400 });
  }

  const result = await findPlantToxicity(scientificName);

  return NextResponse.json(result);
}
