import SavePlantButton from "@/components/SavePlantButton";
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
    <section className="w-full space-y-6 p-5 sm:p-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">
          Pet-safety information
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
          Plant Result
        </h2>
      </div>

      {/* Plant information */}
      <section className="grid gap-4 border-b border-zinc-200 pb-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-500">Common Name</p>
          <p className="mt-1 font-medium text-zinc-900">
            {plant.commonName || "Unknown"}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-500">Scientific Name</p>
          <p className="mt-1 italic text-zinc-900">
            {plant.scientificName || "Unknown"}
          </p>
        </div>
      </section>

      {lowConfidence && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-950">
            Identification is uncertain
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-900">
            Safety information is based on an uncertain plant identification.
            Confirm the plant before relying on this result.
          </p>
        </div>
      )}

      {/* Safety */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900">Pet Safety</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm font-medium text-zinc-500">Cat Safety</p>

            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {lowConfidence
                ? `Possible result: ${plant.catSafety}`
                : plant.catSafety}
            </p>

            {hasCatSymptoms && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <h4 className="font-medium text-zinc-900">Symptoms — Cats</h4>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  {plant.symptoms?.cats?.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm font-medium text-zinc-500">Dog Safety</p>

            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {lowConfidence
                ? `Possible result: ${plant.dogSafety}`
                : plant.dogSafety}
            </p>

            {hasDogSymptoms && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <h4 className="font-medium text-zinc-900">Symptoms — Dogs</h4>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
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
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">
            Toxicity information unavailable
          </p>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            No toxicity record was found for this plant. Unknown does not mean
            the plant is safe.
          </p>
        </div>
      )}

      {(hasToxicPrinciples || hasToxicParts) && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900">
            Toxicity Details
          </h3>

          {hasToxicPrinciples && (
            <div>
              <h4 className="font-medium text-zinc-900">Toxic Principles</h4>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {plant.toxicPrinciples?.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          )}

          {hasToxicParts && (
            <div>
              <h4 className="font-medium text-zinc-900">Toxic Plant Parts</h4>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {plant.toxicParts?.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Sources */}
      <section className="space-y-2 border-t border-zinc-200 pt-6">
        <h3 className="text-lg font-semibold text-zinc-900">Source</h3>

        {hasSources ? (
          <ul className="space-y-1 text-sm">
            {plant.sources?.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">
            No toxicity source is available for this result.
          </p>
        )}
      </section>

      {/* Preserve save functionality */}
      <div className="border-t border-zinc-200 pt-6">
        <SavePlantButton plant={plant} />
      </div>
    </section>
  );
}
