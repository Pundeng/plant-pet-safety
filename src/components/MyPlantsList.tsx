"use client";

import Image from "next/image";
import { useState } from "react";
import { SavedPlant } from "../types/savedPlant";
import { getSavedPlants, removeSavedPlant } from "../lib/plantStorage";

const safetyClasses = {
  safe: "bg-emerald-50 text-emerald-800",
  toxic: "bg-red-50 text-red-800",
  unknown: "bg-slate-100 text-slate-700",
};

export default function MyPlantsList() {
  const [plants, setPlants] = useState<SavedPlant[]>(() => getSavedPlants());

  const handleRemove = (id: string) => {
    removeSavedPlant(id);
    setPlants((current) => current.filter((plant) => plant.id !== id));
  };

  if (plants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No saved plants yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Analyze a plant from the home page and save the result to build your
          personal list.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {plants.map((plant) => (
        <article
          key={plant.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {plant.imageUrl && (
            <Image
              className="aspect-[4/3] w-full object-cover"
              src={plant.imageUrl}
              alt={plant.commonName || plant.scientificName}
              width={480}
              height={360}
              unoptimized
            />
          )}

          <div className="p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {plant.commonName}
            </h2>
            <p className="mt-1 text-sm italic text-slate-500">
              {plant.scientificName}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span
                className={`rounded-full px-3 py-1.5 capitalize ${safetyClasses[plant.catSafety]}`}
              >
                Cat: {plant.catSafety}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 capitalize ${safetyClasses[plant.dogSafety]}`}
              >
                Dog: {plant.dogSafety}
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Saved {new Date(plant.savedAt).toLocaleDateString()}
            </p>

            <details className="mt-4 border-t border-slate-100 pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-800 hover:text-emerald-950">
                View details
              </summary>

              <div className="mt-3 space-y-4 text-sm leading-6 text-slate-600">
                {plant.symptoms?.cats && plant.symptoms.cats.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Cat symptoms
                    </h3>
                    <ul className="mt-1 list-disc pl-5">
                      {plant.symptoms.cats.map((symptom) => (
                        <li key={symptom}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plant.symptoms?.dogs && plant.symptoms.dogs.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Dog symptoms
                    </h3>
                    <ul className="mt-1 list-disc pl-5">
                      {plant.symptoms.dogs.map((symptom) => (
                        <li key={symptom}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plant.sources && plant.sources.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800">Sources</h3>
                    <ul className="mt-1">
                      {plant.sources.map((source) => (
                        <li key={source.url}>
                          <a
                            className="font-medium text-emerald-700 hover:underline"
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {source.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>

            <button
              type="button"
              onClick={() => handleRemove(plant.id)}
              className="mt-5 w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
