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
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Search by plant name
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
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
            className="min-h-12 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {searchPerformed && !isSearching && !error && results.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="font-medium text-zinc-900">No matching plants found</p>

          <p className="mt-1 text-sm text-zinc-600">
            Try another common name, scientific name, or a shorter search term.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              Possible matches
            </h3>

            <p className="mt-1 text-sm text-zinc-600">
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
                className="w-full rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block font-semibold text-zinc-900">
                  {result.commonNames[0] ?? result.scientificName}
                </span>

                {result.commonNames.length > 0 && (
                  <span className="mt-1 block text-sm italic text-zinc-600">
                    {result.scientificName}
                  </span>
                )}

                {result.commonNames.length > 1 && (
                  <span className="mt-2 block text-xs text-zinc-500">
                    Also known as: {result.commonNames.slice(1).join(", ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {isLoadingResult && (
        <div role="status" className="rounded-xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">
            Loading pet-safety information...
          </p>
        </div>
      )}

      {selectedPlant && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <PlantResult plant={selectedPlant} />
        </div>
      )}
    </section>
  );
}
