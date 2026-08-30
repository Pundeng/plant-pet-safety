"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import PlantResult from "@/components/PlantResult";
import { Plant } from "@/types/plant";

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identification, setIdentification] = useState<{
    identified: boolean;
    scientificName?: string | null;
    commonName?: string | null;
    confidence?: number;
    lowConfidence?: boolean;
  } | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setPlant(null);
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

      const data = await response.json();

      if (!data.identification?.identified) {
        setError("No plant could be identified.");
        return;
      }

      console.log("Identification result:", data.identification);

      setIdentification(data.identification);

      const normalizedPlant: Plant = {
        commonName: data.identification.commonName ?? "Unknown",
        scientificName: data.identification.scientificName ?? "Unknown",

        imageUrl,

        catSafety: data.toxicity?.catSafety ?? "unknown",
        dogSafety: data.toxicity?.dogSafety ?? "unknown",

        toxicPrinciples: data.toxicity?.toxicPrinciples,
        toxicParts: data.toxicity?.toxicParts,
        symptoms: data.toxicity?.symptoms,
        sources: data.toxicity
          ? [
              {
                name: data.toxicity.source,
                url: "https://plantsm.art/",
              },
            ]
          : [],
      };

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
      <input type="file" accept="image/*" onChange={handleImageChange} />

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

          <button type="button" onClick={handleIdentify} disabled={isLoading}>
            {isLoading ? "Identifying..." : "Identify Plant"}
          </button>
        </div>
      )}

      {isLoading && <p>Analyzing plant...</p>}

      {error && <p>{error}</p>}

      {identification?.identified && (
        <div>
          <h2>Identification Info</h2>

          <p>
            Confidence: {Math.round((identification.confidence ?? 0) * 100)}%
          </p>

          {identification.lowConfidence && (
            <p>Low confidence result. Try uploading a clearer image.</p>
          )}
        </div>
      )}

      {plant && <PlantResult plant={plant} />}
    </div>
  );
}
