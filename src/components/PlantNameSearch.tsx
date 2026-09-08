"use client";

import { FormEvent, useState } from "react";

import PlantResult from "@/components/PlantResult";
import { Plant } from "@/types/plant";

interface PlantSearchResult {
  scientificName: string;
  commonNames: string[];
  matchedBy: "scientific" | "common";
}

interface SearchResponse {
  query: string;
  results: PlantSearchResult[];
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface ToxicityResponse {
  catSafety: Plant["catSafety"];
  dogSafety: Plant["dogSafety"];
  symptoms?: Plant["symptoms"];
  source?: {
    name: string;
    url: string;
  };
}

export default function PlantNameSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlantSearchResult[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setError("Enter a plant name to search.");
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    setResults([]);
    setSelectedPlant(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
      );
      const data = (await response.json()) as SearchResponse & ApiErrorResponse;

      if (!response.ok) {
        setError(data.error?.message ?? "Plant search failed.");
        return;
      }

      setResults(data.results ?? []);
    } catch (error) {
      console.error(error);
      setError("Unable to search for plants. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: PlantSearchResult) => {
    setIsLoadingResult(true);
    setSelectedPlant(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/toxicity?name=${encodeURIComponent(result.scientificName)}`,
      );

      const data = (await response.json()) as
        ToxicityResponse | ApiErrorResponse | null;

      if (!response.ok) {
        const errorResponse = data as ApiErrorResponse;
        setError(
          errorResponse.error?.message ??
            "Toxicity information could not be retrieved.",
        );
        return;
      }

      const toxicity = data as ToxicityResponse | null;

      const plant: Plant = {
        commonName: result.commonNames[0] ?? "Unknown",
        scientificName: result.scientificName,
        imageUrl: "",
        catSafety: toxicity?.catSafety ?? "unknown",
        dogSafety: toxicity?.dogSafety ?? "unknown",
        symptoms: toxicity?.symptoms,
        sources: toxicity?.source ? [toxicity.source] : [],
      };

      setSelectedPlant(plant);
    } catch (error) {
      console.error(error);
      setError("Unable to load plant safety information. Please try again.");
    } finally {
      setIsLoadingResult(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Name search</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Search by plant name
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Already know the plant? Search by a common or scientific name.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="plant-search" className="sr-only">
            Plant name
          </label>

          <input
            id="plant-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Monstera or Monstera deliciosa"
            className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="font-medium text-red-900">Something went wrong</p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
        </div>
      )}

      {searchPerformed && !isSearching && !error && results.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-900">No matching plants found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try another common name, scientific name, or a shorter search term.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Possible matches
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Select the plant you mean. Search matches are suggestions, not
              guaranteed identification.
            </p>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <button
                key={result.scientificName}
                type="button"
                disabled={isLoadingResult}
                onClick={() => handleSelect(result)}
                className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block font-semibold text-slate-950">
                  {result.commonNames[0] ?? result.scientificName}
                </span>

                {result.commonNames.length > 0 && (
                  <span className="mt-1 block text-sm italic text-slate-600">
                    {result.scientificName}
                  </span>
                )}

                {result.commonNames.length > 1 && (
                  <span className="mt-2 block text-xs text-slate-500">
                    Also known as: {result.commonNames.slice(1).join(", ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {isLoadingResult && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-emerald-900">
              Loading pet-safety information...
            </p>
          </div>
        </div>
      )}

      {selectedPlant && <PlantResult plant={selectedPlant} />}
    </section>
  );
}
