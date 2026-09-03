import { Plant } from "../types/plant";
import { SavedPlant } from "../types/savedPlant";

const STORAGE_KEY = "plant-pet-safety:saved-plants";

function normalizeScientificName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function readStoredPlants(): SavedPlant[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPlant[]) : [];
  } catch {
    return [];
  }
}

function writeStoredPlants(plants: SavedPlant[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

async function createThumbnail(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const maxSize = 320;
    const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return "";
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return canvas.toDataURL("image/jpeg", 0.75);
  } catch {
    return "";
  }
}

export function getSavedPlants(): SavedPlant[] {
  return readStoredPlants().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function isPlantSaved(scientificName: string): boolean {
  const normalizedName = normalizeScientificName(scientificName);

  return readStoredPlants().some(
    (plant) => normalizeScientificName(plant.scientificName) === normalizedName,
  );
}

export async function savePlant(plant: Plant): Promise<SavedPlant | null> {
  if (isPlantSaved(plant.scientificName)) {
    return null;
  }

  const persistentImageUrl = plant.imageUrl
    ? await createThumbnail(plant.imageUrl)
    : "";

  const savedPlant: SavedPlant = {
    ...plant,
    imageUrl: persistentImageUrl,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    isFavorite: false,
  };

  const plants = readStoredPlants();
  writeStoredPlants([...plants, savedPlant]);

  return savedPlant;
}

export function removeSavedPlant(id: string): void {
  const plants = readStoredPlants();
  writeStoredPlants(plants.filter((plant) => plant.id !== id));
}

export function getSavedPlant(id: string): SavedPlant | null {
  return readStoredPlants().find((plant) => plant.id === id) ?? null;
}
