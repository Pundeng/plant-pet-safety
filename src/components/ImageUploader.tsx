"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import PlantResult from "@/components/PlantResult";
import { Plant } from "@/types/plant";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface CandidateToxicity {
  catSafety: Plant["catSafety"];
  dogSafety: Plant["dogSafety"];
  symptoms?: Plant["symptoms"];
  source?: string;
}

interface ReferenceImage {
  url: string;
  author: string | null;
  license: string | null;
  citation: string | null;
}

interface IdentificationCandidate {
  scientificName: string | null;
  commonName: string | null;
  confidence: number;
  lowConfidence: boolean;
  referenceImage: ReferenceImage | null;
  toxicity: CandidateToxicity;
}

interface IdentificationResult {
  identified: boolean;
  topResult: IdentificationCandidate | null;
  alternatives: IdentificationCandidate[];
}

interface AnalyzeResponse {
  identification: IdentificationResult;
  hasSafetyConflict: boolean;
}

function normalizePlant(
  candidate: IdentificationCandidate,
  imageUrl: string,
): Plant {
  return {
    commonName: candidate.commonName ?? "Unknown",
    scientificName: candidate.scientificName ?? "Unknown",
    imageUrl,
    catSafety: candidate.toxicity.catSafety,
    dogSafety: candidate.toxicity.dogSafety,
    symptoms: candidate.toxicity.symptoms,
    sources: candidate.toxicity.source
      ? [
          {
            name: candidate.toxicity.source,
            url: "https://plantsm.art/",
          },
        ]
      : [],
  };
}

function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG or PNG image.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "This image is too large. Please upload an image under 5 MB.";
  }

  return null;
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

export default function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [identification, setIdentification] =
    useState<IdentificationResult | null>(null);
  const [hasSafetyConflict, setHasSafetyConflict] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearResults = () => {
    setPlant(null);
    setIdentification(null);
    setHasSafetyConflict(false);
    setError(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearResults();

    const validationError = validateImage(file);

    if (validationError) {
      setSelectedFile(null);
      setPreview(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    clearResults();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleIdentify = async () => {
    const imageUrl = preview;

    if (!selectedFile || !imageUrl) {
      return;
    }

    setIsLoading(true);
    clearResults();

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze plant");
      }

      const data: AnalyzeResponse = await response.json();

      if (!data.identification?.identified || !data.identification.topResult) {
        setError(
          "We couldn't identify this plant. Try another photo with the plant clearly visible.",
        );
        return;
      }

      setIdentification(data.identification);
      setHasSafetyConflict(data.hasSafetyConflict ?? false);

      setPlant(normalizePlant(data.identification.topResult, imageUrl));
    } catch (error) {
      console.error(error);

      setError("Unable to analyze this plant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const topResult = identification?.topResult;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900">
            Upload a plant photo
          </h2>

          <p className="text-sm leading-6 text-zinc-600">
            Use a clear photo showing the leaves, flowers, or other identifying
            features.
          </p>
        </div>

        <input
          ref={inputRef}
          id="plant-image"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
          className="sr-only"
        />

        {!preview && (
          <label
            htmlFor="plant-image"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-400 hover:bg-zinc-100"
          >
            <span className="text-base font-semibold text-zinc-900">
              Upload a plant photo
            </span>

            <span className="mt-1 text-sm text-zinc-500">
              Click to choose a JPEG or PNG
            </span>

            <span className="mt-1 text-xs text-zinc-400">
              Maximum file size: 5 MB
            </span>
          </label>
        )}

        {preview && (
          <div className="mt-5 space-y-4">
            <div className="overflow-hidden rounded-xl bg-zinc-100">
              <Image
                src={preview}
                alt="Uploaded plant"
                width={800}
                height={600}
                unoptimized
                className="max-h-[32rem] w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleIdentify}
                disabled={isLoading || !selectedFile}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span
                      className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden="true"
                    />
                    Identifying plant...
                  </>
                ) : (
                  "Identify Plant"
                )}
              </button>

              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isLoading}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-36"
              >
                Remove image
              </button>
            </div>
          </div>
        )}
      </section>

      {isLoading && (
        <div
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          role="status"
        >
          <p className="font-medium text-zinc-900">Analyzing your plant...</p>

          <p className="mt-1 text-sm text-zinc-600">
            Comparing your photo with possible plant matches.
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <p className="font-medium text-red-900">
            Identification unsuccessful
          </p>

          <p className="mt-1 text-sm text-red-800">{error}</p>
        </div>
      )}

      {topResult && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-zinc-500">
              Top identification
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
              {topResult.commonName ??
                topResult.scientificName ??
                "Unknown plant"}
            </h2>

            {topResult.commonName && (
              <p className="mt-1 text-sm italic text-zinc-600">
                {topResult.scientificName ?? "Scientific name unavailable"}
              </p>
            )}
          </div>

          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Identification confidence
                </p>

                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {formatConfidence(topResult.confidence)}
                </p>
              </div>

              {topResult.lowConfidence && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-950">
                    Uncertain identification
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    This plant identification may be incorrect. Pet-safety
                    information may not apply to the plant in your photo.
                  </p>
                </div>
              )}
            </div>

            {topResult.referenceImage ? (
              <figure className="space-y-2">
                <div className="overflow-hidden rounded-xl bg-zinc-100">
                  <Image
                    src={topResult.referenceImage.url}
                    alt={`Reference image for ${
                      topResult.commonName ??
                      topResult.scientificName ??
                      "plant"
                    }`}
                    width={440}
                    height={440}
                    className="aspect-square w-full object-cover"
                  />
                </div>

                <figcaption className="text-xs leading-5 text-zinc-500">
                  {topResult.referenceImage.citation ??
                    `${
                      topResult.referenceImage.author ?? "Unknown contributor"
                    } / Pl@ntNet`}
                </figcaption>
              </figure>
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-xl bg-zinc-100 p-4 text-center text-sm text-zinc-500">
                No reference image available
              </div>
            )}
          </div>
        </section>
      )}

      {plant && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <PlantResult
            plant={plant}
            lowConfidence={topResult?.lowConfidence ?? false}
          />
        </div>
      )}

      {hasSafetyConflict && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-950">
            Similar plants have different safety information
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-900">
            The likely matches do not all have the same pet-safety profile.
            Confirm the plant identification before relying on the toxicity
            result.
          </p>
        </div>
      )}

      {identification && identification.alternatives.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <details className="group">
            <summary className="cursor-pointer list-none px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-900">
                    Not sure this is your plant?
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    View similar matches for comparison
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-xl text-zinc-500 transition group-open:rotate-180"
                >
                  ▾
                </span>
              </div>
            </summary>

            <div className="border-t border-zinc-200 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {identification.alternatives.map((candidate, index) => (
                  <article
                    key={`${candidate.scientificName}-${index}`}
                    className="overflow-hidden rounded-xl border border-zinc-200"
                  >
                    {candidate.referenceImage ? (
                      <figure>
                        <div className="bg-zinc-100">
                          <Image
                            src={candidate.referenceImage.url}
                            alt={`Reference image for ${
                              candidate.commonName ??
                              candidate.scientificName ??
                              "plant"
                            }`}
                            width={500}
                            height={350}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </div>

                        <figcaption className="px-4 pt-2 text-xs leading-5 text-zinc-500">
                          {candidate.referenceImage.citation ??
                            `${
                              candidate.referenceImage.author ??
                              "Unknown contributor"
                            } / Pl@ntNet`}
                        </figcaption>
                      </figure>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 p-4 text-sm text-zinc-500">
                        No reference image available
                      </div>
                    )}

                    <div className="space-y-4 p-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Alternative {index + 1}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                          {candidate.commonName ??
                            candidate.scientificName ??
                            "Unknown plant"}
                        </h3>

                        {candidate.commonName && (
                          <p className="mt-1 text-sm italic text-zinc-600">
                            {candidate.scientificName ??
                              "Scientific name unavailable"}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Confidence</p>

                        <p className="font-medium text-zinc-900">
                          {formatConfidence(candidate.confidence)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Cat Safety</p>
                          <p className="mt-1 font-medium text-zinc-900">
                            {candidate.toxicity.catSafety}
                          </p>
                        </div>

                        <div>
                          <p className="text-zinc-500">Dog Safety</p>
                          <p className="mt-1 font-medium text-zinc-900">
                            {candidate.toxicity.dogSafety}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
