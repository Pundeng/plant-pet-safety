import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Plant Pet Safety
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-zinc-600">
            Upload a photo to identify a plant and check available pet-safety
            information.
          </p>

          <Link
            href="/my-plants"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            View My Plants
          </Link>
        </header>

        <ImageUploader />
      </div>
    </main>
  );
}
