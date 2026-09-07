"use client";

import { useState } from "react";
import { Plant } from "../types/plant";
import { isPlantSaved, savePlant } from "../lib/plantStorage";

interface SavePlantButtonProps {
  plant: Plant;
}

export default function SavePlantButton({ plant }: SavePlantButtonProps) {
  const [saved, setSaved] = useState(() => isPlantSaved(plant.scientificName));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      <button
        type="button"
        onClick={handleSave}
        disabled={saved || isSaving}
        className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSaving ? "Saving..." : saved ? "Saved to My Plants" : "Save to My Plants"}
      </button>

      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
