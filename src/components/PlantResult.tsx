import { Plant } from "@/types/plant";
import SavePlantButton from "@/components/SavePlantButton";

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
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-700">Best match</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {plant.commonName}
        </h2>
        <p className="mt-1 italic text-slate-500">{plant.scientificName}</p>
      </div>

      {lowConfidence && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Safety information is based on an uncertain plant identification. Confirm the plant before relying on this result.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`rounded-xl border p-4 ${safetyClasses[plant.catSafety]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Cat safety</p>
          <p className="mt-1 text-lg font-bold capitalize">
            {lowConfidence ? `Possible: ${plant.catSafety}` : plant.catSafety}
          </p>
        </div>
        <div className={`rounded-xl border p-4 ${safetyClasses[plant.dogSafety]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Dog safety</p>
          <p className="mt-1 text-lg font-bold capitalize">
            {lowConfidence ? `Possible: ${plant.dogSafety}` : plant.dogSafety}
          </p>
        </div>
      </div>

      {plant.symptoms &&
        ((plant.symptoms.cats && plant.symptoms.cats.length > 0) ||
          (plant.symptoms.dogs && plant.symptoms.dogs.length > 0)) && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="font-semibold text-slate-950">Reported symptoms</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {plant.symptoms.cats && plant.symptoms.cats.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-600">Cats</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                    {plant.symptoms.cats.map((symptom) => (
                      <li key={symptom}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {plant.symptoms.dogs && plant.symptoms.dogs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-600">Dogs</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                    {plant.symptoms.dogs.map((symptom) => (
                      <li key={symptom}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="font-semibold text-slate-950">Sources</h3>
        {plant.sources && plant.sources.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm">
            {plant.sources.map((source) => (
              <li key={source.url}>
                <a
                  className="font-medium text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No source available.</p>
        )}
      </div>

      <div className="mt-6">
        <SavePlantButton plant={plant} />
      </div>
    </section>
  );
}
