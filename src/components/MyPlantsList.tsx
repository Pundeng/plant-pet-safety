"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SavedPlant } from "../types/savedPlant";
import { getSavedPlants, removeSavedPlant } from "../lib/plantStorage";

export default function MyPlantsList() {
  const [plants, setPlants] = useState<SavedPlant[]>([]);

  useEffect(() => {
    setPlants(getSavedPlants());
  }, []);

  const handleRemove = (id: string) => {
    removeSavedPlant(id);
    setPlants((current) => current.filter((plant) => plant.id !== id));
  };

  if (plants.length === 0) {
    return <p>No saved plants yet. Analyze a plant and save it to see it here.</p>;
  }

  return (
    <div>
      {plants.map((plant) => (
        <article key={plant.id}>
          {plant.imageUrl && (
            <Image
              src={plant.imageUrl}
              alt={plant.commonName || plant.scientificName}
              width={240}
              height={240}
              unoptimized
            />
          )}

          <h2>{plant.commonName}</h2>
          <p>
            <em>{plant.scientificName}</em>
          </p>
          <p>Cat Safety: {plant.catSafety}</p>
          <p>Dog Safety: {plant.dogSafety}</p>
          <p>Saved: {new Date(plant.savedAt).toLocaleString()}</p>

          <details>
            <summary>View details</summary>

            {plant.symptoms?.cats && plant.symptoms.cats.length > 0 && (
              <div>
                <h3>Cat Symptoms</h3>
                <ul>
                  {plant.symptoms.cats.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {plant.symptoms?.dogs && plant.symptoms.dogs.length > 0 && (
              <div>
                <h3>Dog Symptoms</h3>
                <ul>
                  {plant.symptoms.dogs.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {plant.sources && plant.sources.length > 0 && (
              <div>
                <h3>Sources</h3>
                <ul>
                  {plant.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </details>

          <button type="button" onClick={() => handleRemove(plant.id)}>
            Remove
          </button>
        </article>
      ))}
    </div>
  );
}
