import { Plant } from "@/types/plant";

interface PlantResultProps {
  plant: Plant;
}

export default function PlantResult({ plant }: PlantResultProps) {
  return (
    <section>
      <h2>{plant.commonName}</h2>
      <p>
        <em>{plant.scientificName}</em>
      </p>

      <h3>Pet Safety</h3>

      <p>Cat: {plant.catSafety}</p>
      <p>Dog: {plant.dogSafety}</p>

      {plant.toxicPrinciples && (
        <>
          <h3>Toxic Principles</h3>
          <ul>
            {plant.toxicPrinciples.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </>
      )}

      {plant.toxicParts && (
        <>
          <h3>Toxic Parts</h3>
          <ul>
            {plant.toxicParts.map((part) => (
              <li key={part}>{part}</li>
            ))}
          </ul>
        </>
      )}

      {plant.symptoms?.cats && (
        <>
          <h3>Cat Symptoms</h3>
          <ul>
            {plant.symptoms.cats.map((symptom) => (
              <li key={symptom}>{symptom}</li>
            ))}
          </ul>
        </>
      )}

      {plant.symptoms?.dogs && (
        <>
          <h3>Dog Symptoms</h3>
          <ul>
            {plant.symptoms.dogs.map((symptom) => (
              <li key={symptom}>{symptom}</li>
            ))}
          </ul>
        </>
      )}

      <h3>Sources</h3>

      <ul>
        {plant.sources?.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
