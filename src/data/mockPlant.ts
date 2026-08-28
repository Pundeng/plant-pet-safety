import { Plant } from "@/types/plant";

export const mockPlant: Plant = {
  commonName: "Swiss Cheese Plant",
  scientificName: "Monstera deliciosa",
  imageUrl: "",

  catSafety: "toxic",
  dogSafety: "toxic",

  toxicPrinciples: ["Insoluble calcium oxalates"],
  toxicParts: ["Leaves", "Stem"],

  symptoms: {
    cats: ["Oral irritation", "Drooling", "Vomiting"],
    dogs: ["Oral irritation", "Drooling", "Vomiting"],
  },

  sources: [
    {
      name: "ASPCA",
      url: "https://www.aspca.org/",
    },
  ],
};