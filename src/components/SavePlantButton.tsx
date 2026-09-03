"use client";

import { useEffect, useState } from "react";
import { Plant } from "../types/plant";
import { isPlantSaved, savePlant } from "../lib/plantStorage";

interface SavePlantButtonProps {
  plant: Plant;
}

export default function SavePlantButton({ plant }: SavePlantButtonProps) {
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSaved(isPlantSaved(plant.scientificName));
  }, [plant.scientificName]);

  const handleSave = async () => {
    if (saved || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const savedPlant = await savePlant(plant);

      if (!savedPlant) {
        setSaved(true);
        setMessage("This plant is already in My Plants.");
        return;
      }

      setSaved(true);
      setMessage("Saved to My Plants.");
    } catch {
      setMessage("Unable to save this plant. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleSave} disabled={saved || isSaving}>
        {isSaving ? "Saving..." : saved ? "Saved" : "Save Plant"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
