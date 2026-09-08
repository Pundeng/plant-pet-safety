import SavePlantButton from "@/components/SavePlantButton";
import { Plant } from "@/types/plant";

interface PlantResultProps {
  plant: Plant;
  lowConfidence?: boolean;
}

const safetyClasses = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-900",
  toxic: "border-red-200 bg-red-50 text-red-900",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

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
        <p className="text-sm font-medium text-emerald-700">
          Pet-safety information
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">
          {plant.commonName || "Unknown plant"}
        </h2>
        <p className="mt-1 text-sm italic text-slate-500">
          {plant.scientificName || "Scientific name unavailable"}
        </p>
      </div>

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

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-950">Pet Safety</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <section
            className={`rounded-xl border p-4 ${safetyClasses[plant.catSafety]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Cat safety
            </p>
            <p className="mt-1 text-lg font-bold capitalize">
              {lowConfidence ? `Possible: ${plant.catSafety}` : plant.catSafety}
            </p>

            {hasCatSymptoms && (
              <div className="mt-4 border-t border-current/10 pt-4">
                <h4 className="font-medium">Symptoms — Cats</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                  {plant.symptoms?.cats?.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section
            className={`rounded-xl border p-4 ${safetyClasses[plant.dogSafety]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Dog safety
            </p>
            <p className="mt-1 text-lg font-bold capitalize">
              {lowConfidence ? `Possible: ${plant.dogSafety}` : plant.dogSafety}
            </p>

            {hasDogSymptoms && (
              <div className="mt-4 border-t border-current/10 pt-4">
                <h4 className="font-medium">Symptoms — Dogs</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
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
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">
            Toxicity information unavailable
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            No toxicity record was found for this plant. Unknown does not mean
            the plant is safe.
          </p>
        </div>
      )}

      {(hasToxicPrinciples || hasToxicParts) && (
        <section className="space-y-4 border-t border-slate-100 pt-5">
          <h3 className="text-lg font-semibold text-slate-950">
            Toxicity Details
          </h3>

          {hasToxicPrinciples && (
            <div>
              <h4 className="font-medium text-slate-900">Toxic Principles</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                {plant.toxicPrinciples?.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          )}

          {hasToxicParts && (
            <div>
              <h4 className="font-medium text-slate-900">Toxic Plant Parts</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                {plant.toxicParts?.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2 border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-950">Sources</h3>

        {hasSources ? (
          <ul className="space-y-1 text-sm">
            {plant.sources?.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-900"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">
            No toxicity source is available for this result.
          </p>
        )}
      </section>

      <div className="border-t border-slate-200 pt-6">
        <SavePlantButton plant={plant} />
      </div>
    </section>
  );
}
