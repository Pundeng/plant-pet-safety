import { Plant } from "@/types/plant";

interface PlantResultProps {
  plant: Plant;
}

export default function PlantResult({ plant }: PlantResultProps) {
  return (
    <section>
      <h2>Plant Result</h2>

      <div>
        <h3>Common Name</h3>
        <p>{plant.commonName}</p>
      </div>

      <div>
        <h3>Scientific Name</h3>
        <p>
          <em>{plant.scientificName}</em>
        </p>
      </div>

      <div>
        <h3>Cat Safety</h3>
        <p>{plant.catSafety}</p>
      </div>

      <div>
        <h3>Dog Safety</h3>
        <p>{plant.dogSafety}</p>
      </div>

      {plant.symptoms && (
        <div>
          <h3>Symptoms</h3>

          {plant.symptoms.cats && (
            <div>
              <h4>Cats</h4>
              <ul>
                {plant.symptoms.cats.map((symptom) => (
                  <li key={symptom}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}

          {plant.symptoms.dogs && (
            <div>
              <h4>Dogs</h4>
              <ul>
                {plant.symptoms.dogs.map((symptom) => (
                  <li key={symptom}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <h3>Sources</h3>

        {plant.sources && plant.sources.length > 0 ? (
          <ul>
            {plant.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No source available.</p>
        )}
      </div>
    </section>
  );
}
