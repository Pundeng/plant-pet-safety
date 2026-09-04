import { Plant } from "@/types/plant";

interface PlantResultProps {
  plant: Plant;
  lowConfidence?: boolean;
}

export default function PlantResult({
  plant,
  lowConfidence = false,
}: PlantResultProps) {
  const hasCatSymptoms = plant.symptoms?.cats && plant.symptoms.cats.length > 0;

  const hasDogSymptoms = plant.symptoms?.dogs && plant.symptoms.dogs.length > 0;

  const hasToxicPrinciples =
    plant.toxicPrinciples && plant.toxicPrinciples.length > 0;

  const hasToxicParts = plant.toxicParts && plant.toxicParts.length > 0;

  const hasSources = plant.sources && plant.sources.length > 0;

  const hasKnownToxicity =
    plant.catSafety !== "unknown" || plant.dogSafety !== "unknown";

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h2 className="text-2xl font-semibold">Plant Result</h2>
      </div>
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Common Name</h3>
          <p>{plant.commonName || "Unknown"}</p>
        </div>

        <div>
          <h3 className="font-semibold">Scientific Name</h3>
          <p>
            <em>{plant.scientificName || "Unknown"}</em>
          </p>
        </div>
      </section>
      {lowConfidence && (
        <div className="space-y-1">
          <strong>Uncertain identification</strong>
          <p>
            Safety information is based on an uncertain plant identification.
            Confirm the plant before relying on this result.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Pet Safety</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="space-y-3">
            <div>
              <h4 className="font-semibold">Cat Safety</h4>
              <p>
                {lowConfidence
                  ? `Possible result: ${plant.catSafety}`
                  : plant.catSafety}
              </p>
            </div>

            {hasCatSymptoms && (
              <div>
                <h4 className="font-semibold">Symptoms — Cats</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {plant.symptoms?.cats?.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section className="space-y-3">
            <div>
              <h4 className="font-semibold">Dog Safety</h4>
              <p>
                {lowConfidence
                  ? `Possible result: ${plant.dogSafety}`
                  : plant.dogSafety}
              </p>
            </div>

            {hasDogSymptoms && (
              <div>
                <h4 className="font-semibold">Symptoms — Dogs</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {plant.symptoms?.dogs?.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </section>
      {!hasKnownToxicity && (
        <div className="space-y-1">
          <strong>Toxicity information unavailable</strong>
          <p>
            No toxicity record was found for this plant. Unknown does not mean
            the plant is safe.
          </p>
        </div>
      )}

      {(hasToxicPrinciples || hasToxicParts) && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Toxicity Details</h3>

          {hasToxicPrinciples && (
            <div>
              <h4 className="font-semibold">Toxic Principles</h4>
              <ul className="list-disc space-y-1 pl-5">
                {plant.toxicPrinciples?.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          )}

          {hasToxicParts && (
            <div>
              <h4 className="font-semibold">Toxic Plant Parts</h4>
              <ul className="list-disc space-y-1 pl-5">
                {plant.toxicParts?.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-xl font-semibold">Source</h3>

        {hasSources ? (
          <ul className="space-y-1">
            {plant.sources?.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No toxicity source is available for this result.</p>
        )}
      </section>
    </section>
  );
}
