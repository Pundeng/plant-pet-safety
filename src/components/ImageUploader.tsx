"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import PlantResult from "@/components/PlantResult";
import { Plant } from "@/types/plant";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface CandidateToxicity {
  catSafety: Plant["catSafety"];
  dogSafety: Plant["dogSafety"];
  symptoms?: Plant["symptoms"];
  source?: {
    name: string;
    url: string;
  };
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
    sources: candidate.toxicity.source ? [candidate.toxicity.source] : [],
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
        setError("No plant could be identified.");
        return;
      }

      console.log("Identification result:", data.identification);

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
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleImageChange}
      />

      {preview && (
        <div>
          <Image
            src={preview}
            alt="Selected plant"
            width={400}
            height={400}
            unoptimized
          />

          <button type="button" onClick={handleRemoveImage}>
            Remove image
          </button>

          <button
            type="button"
            onClick={handleIdentify}
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? "Identifying..." : "Identify Plant"}
          </button>
        </div>
      )}

      {isLoading && <p>Analyzing plant...</p>}

      {error && <p>{error}</p>}

      {identification?.identified && identification.topResult && (
        <div>
          <h2>Identification Info</h2>

          <p>
            Confidence: {Math.round(identification.topResult.confidence * 100)}%
          </p>

          {identification.topResult.referenceImage && (
            <div>
              <Image
                src={identification.topResult.referenceImage.url}
                alt={`Reference image for ${
                  identification.topResult.commonName ??
                  identification.topResult.scientificName ??
                  "plant"
                }`}
                width={250}
                height={250}
              />

              <small>
                {identification.topResult.referenceImage.citation ??
                  `${
                    identification.topResult.referenceImage.author ??
                    "Unknown contributor"
                  } / Pl@ntNet`}
              </small>
            </div>
          )}

          {identification.topResult.lowConfidence && (
            <div>
              <strong>Uncertain identification</strong>
              <p>
                This plant identification may be incorrect. Pet-safety
                information may not apply to the plant in your photo.
              </p>
            </div>
          )}
        </div>
      )}

      {plant && (
        <PlantResult
          plant={plant}
          lowConfidence={identification?.topResult?.lowConfidence ?? false}
        />
      )}

      {hasSafetyConflict && (
        <div>
          <strong>Different safety results found</strong>

          <p>
            Similar matches have different pet-safety information. Confirm the
            plant identification before relying on the toxicity result.
          </p>
        </div>
      )}

      {identification?.alternatives &&
        identification.alternatives.length > 0 && (
          <div>
            <p>
              <strong>Not sure this is your plant?</strong>
            </p>
            <details>
              <summary>View similar matches</summary>

              {identification.alternatives.map((candidate, index) => (
                <div key={`${candidate.scientificName}-${index}`}>
                  <h3>
                    {candidate.commonName ??
                      candidate.scientificName ??
                      "Unknown plant"}
                  </h3>

                  {candidate.commonName && (
                    <p>
                      <em>{candidate.scientificName ?? "Unknown"}</em>
                    </p>
                  )}

                  <p>Confidence: {Math.round(candidate.confidence * 100)}%</p>

                  {candidate.referenceImage && (
                    <div>
                      <Image
                        src={candidate.referenceImage.url}
                        alt={`Reference image for ${
                          candidate.commonName ??
                          candidate.scientificName ??
                          "plant"
                        }`}
                        width={200}
                        height={200}
                      />
                      <small>
                        {candidate.referenceImage.citation ??
                          `${
                            candidate.referenceImage.author ??
                            "Unknown contributor"
                          } / Pl@ntNet`}
                      </small>
                    </div>
                  )}

                  <p>Cat Safety: {candidate.toxicity.catSafety}</p>
                  <p>Dog Safety: {candidate.toxicity.dogSafety}</p>
                </div>
              ))}
            </details>
          </div>
        )}
    </div>
  );
}
