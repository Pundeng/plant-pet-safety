"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    setIdentification(null);
  };

  const handleIdentify = async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();

    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error);
        return;
      }

      setIdentification(data);
    } catch (error) {
      console.error("Failed to identify plant:", error);
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

          <button type="button" onClick={handleIdentify}>
            Identify Plant
          </button>
        </div>
      )}

      {identification && (
        <div>
          <h2>Identification Result</h2>

          {identification.identified ? (
            <>
              <p>Common name: {identification.commonName ?? "Unknown"}</p>

              <p>Scientific name: {identification.scientificName}</p>

              <p>
                Confidence: {Math.round((identification.confidence ?? 0) * 100)}
                %
              </p>

              {identification.lowConfidence && (
                <p>Low confidence result. Try uploading a clearer image.</p>
              )}
            </>
          ) : (
            <p>No plant could be identified.</p>
          )}
        </div>
      )}
    </div>
  );
}
