import Link from "next/link";
import MyPlantsList from "../../components/MyPlantsList";

export default function MyPlantsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/"
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        ← Back to analyzer
      </Link>

      <section className="mb-8 mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Saved collection
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          My Plants
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Revisit plants you saved from previous analyses without scanning them
          again.
        </p>
      </section>

      <MyPlantsList />
    </main>
  );
}
