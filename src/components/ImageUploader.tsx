"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import PlantResult from "@/components/PlantResult";
import { Plant } from "@/types/plant";
import { validateImage } from "@/lib/imageValidation";
import {
  IdentificationCandidate,
  normalizePlant,
} from "@/lib/plantNormalization";

interface IdentificationResult {
  identified: boolean;
  topResult: IdentificationCandidate | null;
  alternatives: IdentificationCandidate[];
}

interface AnalyzeResponse {
  identification: IdentificationResult;
  hasSafetyConflict: boolean;
}

const statusClass =
  "rounded-xl border px-4 py-3 text-sm leading-6";

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSafetyConflict, setHasSafetyConflict] = useState(false);
  const [identification, setIdentification] =
    useState<IdentificationResult | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setPlant(null);
    setIdentification(null);
    setHasSafetyConflict(false);

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
    setPlant(null);
    setIdentification(null);
    setHasSafetyConflict(false);
    setError(null);
  };

  const handleIdentify = async () => {
    const imageUrl = preview;

    if (!selectedFile || !imageUrl) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlant(null);
    setIdentification(null);
    setHasSafetyConflict(false);

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
        setError("No plant could be identified. Try a clearer photo with the plant centered.");
        return;
      }

      setIdentification(data.identification);
      setHasSafetyConflict(data.hasSafetyConflict ?? false);

      const normalizedPlant = normalizePlant(
        data.identification.topResult,
        imageUrl,
      );

      setPlant(normalizedPlant);
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-950">Upload a plant photo</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            JPEG or PNG, up to 5 MB. A clear photo of leaves or flowers works best.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-800/25 bg-emerald-50/55 px-6 py-10 text-center hover:border-emerald-700/45 hover:bg-emerald-50">
          <span className="text-base font-semibold text-emerald-950">
            {selectedFile ? "Choose a different photo" : "Choose a plant photo"}
          </span>
          <span className="mt-1 text-sm text-slate-500">Click to browse your device</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
          />
        </label>

        {preview && (
          <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,320px)_1fr] md:items-center">
            <Image
              className="aspect-square w-full rounded-2xl border border-slate-200 object-cover"
              src={preview}
              alt="Selected plant"
              width={400}
              height={400}
              unoptimized
            />

            <div>
              <p className="mb-4 break-all text-sm text-slate-500">
                Selected: {selectedFile?.name}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleIdentify}
                  disabled={isLoading || !selectedFile}
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isLoading ? "Analyzing..." : "Analyze Plant"}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Remove image
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {isLoading && (
        <div className={`${statusClass} border-emerald-200 bg-emerald-50 text-emerald-900`}>
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
            <span>Identifying the plant and checking pet-safety information...</span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className={`${statusClass} border-red-200 bg-red-50 text-red-800`}>
          <strong>We could not complete the analysis.</strong>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {identification?.identified && identification.topResult && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Identification confidence</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {Math.round(identification.topResult.confidence * 100)}%
              </p>
            </div>

            {identification.topResult.referenceImage && (
              <div className="max-w-[180px]">
                <Image
                  className="aspect-square rounded-xl border border-slate-200 object-cover"
                  src={identification.topResult.referenceImage.url}
                  alt={`Reference image for ${
                    identification.topResult.commonName ??
                    identification.topResult.scientificName ??
                    "plant"
                  }`}
                  width={180}
                  height={180}
                />
                <small className="mt-2 block text-xs leading-5 text-slate-500">
                  {identification.topResult.referenceImage.citation ??
                    `${identification.topResult.referenceImage.author ?? "Unknown contributor"} / Pl@ntNet`}
                </small>
              </div>
            )}
          </div>

          {identification.topResult.lowConfidence && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Uncertain identification</strong>
              <p className="mt-1 leading-6">
                Pet-safety information may not apply if the plant identification is incorrect.
              </p>
            </div>
          )}
        </section>
      )}

      {plant && (
        <PlantResult
          plant={plant}
          lowConfidence={identification?.topResult?.lowConfidence ?? false}
        />
      )}

      {hasSafetyConflict && (
        <div className={`${statusClass} border-amber-200 bg-amber-50 text-amber-900`}>
          <strong>Similar matches have different safety results.</strong>
          <p className="mt-1">
            Confirm the plant identification before relying on the toxicity result.
          </p>
        </div>
      )}

      {identification?.alternatives && identification.alternatives.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <details>
            <summary className="cursor-pointer font-semibold text-slate-900 hover:text-emerald-800">
              Not sure this is your plant? View similar matches
            </summary>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {identification.alternatives.map((candidate, index) => (
                <article
                  key={`${candidate.scientificName}-${index}`}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  {candidate.referenceImage && (
                    <Image
                      className="mb-3 aspect-video w-full rounded-lg object-cover"
                      src={candidate.referenceImage.url}
                      alt={`Reference image for ${
                        candidate.commonName ?? candidate.scientificName ?? "plant"
                      }`}
                      width={320}
                      height={180}
                    />
                  )}
                  <h3 className="font-semibold text-slate-950">
                    {candidate.commonName ?? candidate.scientificName ?? "Unknown plant"}
                  </h3>
                  {candidate.commonName && (
                    <p className="mt-1 text-sm italic text-slate-500">
                      {candidate.scientificName ?? "Unknown"}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-slate-600">
                    Confidence: {Math.round(candidate.confidence * 100)}%
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-lg bg-slate-50 px-3 py-2">
                      Cat: {candidate.toxicity.catSafety}
                    </span>
                    <span className="rounded-lg bg-slate-50 px-3 py-2">
                      Dog: {candidate.toxicity.dogSafety}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
