"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import PlantResult from "@/components/PlantResult";
import { mockPlant } from "@/data/mockPlant";

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
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
    setShowResult(false);
  };

  const handleIdentify = () => {
    if (!selectedFile) {
      return;
    }

    setShowResult(true);
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
        accept="image/*"
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

          <button
            type="button"
            onClick={handleRemoveImage}
          >
            Remove image
          </button>

          <button
            type="button"
            onClick={handleIdentify}
          >
            Identify Plant
          </button>
        </div>
      )}
      
        {showResult && <PlantResult plant={mockPlant} />}
    </div>
  );
}