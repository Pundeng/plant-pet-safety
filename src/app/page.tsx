import ImageUploader from "@/components/ImageUploader";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-8 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Photo-based plant check
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Check whether a plant may be safe for your pets
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Upload a clear photo. We identify the plant, show confidence, and look up
          available toxicity information for cats and dogs.
        </p>
      </section>

      <ImageUploader />
    </main>
  );
}
