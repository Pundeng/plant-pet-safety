import Link from "next/link";

import ImageUploader from "@/components/ImageUploader";
import PlantNameSearch from "@/components/PlantNameSearch";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Plant Pet Safety
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-zinc-600">
            Search for a plant by name or upload a photo to check available
            pet-safety information.
          </p>

          <Link
            href="/my-plants"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            View My Plants
          </Link>
        </header>

        <PlantNameSearch />

        <div className="my-8 flex items-center gap-4" aria-hidden="true">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-sm font-medium text-zinc-400">or</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <ImageUploader />
      </div>
    </main>
  );
}
