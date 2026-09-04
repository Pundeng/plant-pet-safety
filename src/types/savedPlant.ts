import { Plant } from "./plant";

export interface SavedPlant extends Plant {
  id: string;
  savedAt: string;
  isFavorite: boolean;
}
