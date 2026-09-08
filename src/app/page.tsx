import Link from "next/link";

import ImageUploader from "@/components/ImageUploader";
import PlantNameSearch from "@/components/PlantNameSearch";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Plant pet-safety checker
          </p>

          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Check whether a plant may be safe for your pets
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Search by plant name or upload a clear photo. We identify the plant,
            show confidence, and look up available toxicity information for cats
            and dogs.
          </p>

          <Link
            href="/my-plants"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            View My Plants
          </Link>
        </header>

        <PlantNameSearch />

        <div className="my-8 flex items-center gap-4" aria-hidden="true">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm font-medium text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <ImageUploader />
      </div>
    </main>
  );
}
