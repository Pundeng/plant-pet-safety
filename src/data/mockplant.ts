import type { Plant } from '../types/plant';

export const mockPlants: Plant[] = [
  {
    commonName: 'Easter Lily',
    scientificName: 'Lilium longiflorum',
    imageUrl: '/images/plants/easter-lily.jpg',
    catSafety: 'toxic',
    dogSafety: 'toxic',
    toxicPrinciple: ['Unknown'],
    toxicParts: ['Leaves', 'Flowers', 'Pollen', 'Stem'],
    symptoms: {
      cats: 'Vomiting, loss of appetite, lethargy.',
      dogs: 'May cause stomach upset.',
    },
    sources: [
      {
        name: 'Plant Smart',
        url: 'https://plantsm.art/api',
      },
    ],
  },

  {
    commonName: 'Calathea',
    scientificName: 'Goeppertia orbifolia',
    imageUrl: '/images/plants/calathea.jpg',
    catSafety: 'safe',
    dogSafety: 'safe',
    sources: [
      {
        name: 'Plant Smart',
        url: 'https://plantsm.art/api',
      },
    ],
  },

  {
    commonName: 'Mystery Plant',
    scientificName: 'Unknown',
    imageUrl: '/images/plants/unknown-plant.jpg',
    catSafety: 'unknown',
    dogSafety: 'unknown',
  },
];