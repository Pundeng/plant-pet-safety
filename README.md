# Plant Pet Safety

A pet-safety focused plant identification web app that helps users check whether a plant may be safe or toxic to cats and dogs.

Built for **AnimalHack 2026** by [Pundeng](https://github.com/Pundeng) and [cho-hazel](https://github.com/cho-hazel).

> **Important:** Plant identification and toxicity data can be incomplete or uncertain. This app is designed to communicate that uncertainty instead of treating missing information as proof that a plant is safe.

<!-- TODO before submission: add a live demo link and a short screenshot/GIF here. -->

## About the Project

Pet owners often encounter plants without knowing their exact species or whether they are safe around cats and dogs. A simple toxic/non-toxic answer can also be misleading when the plant identification is uncertain or the available toxicity dataset has no record for that species.

Plant Pet Safety combines plant identification, name search, toxicity lookup, uncertainty handling, and saved results in one interface. The project is intentionally conservative about safety: **unknown data stays unknown**.

## Key Features

- **Photo-based plant identification** using the Pl@ntNet API.
- **Plant name search** by common or scientific name.
- **Cat and dog safety results** based on available toxicity data.
- **Identification confidence** with a warning when the top match is below the confidence threshold.
- **Alternative plant matches** so users can compare similar identification candidates.
- **Safety-conflict warnings** when likely matches have different pet-safety profiles.
- **Explicit `unknown` safety states** when the data does not support a safe or toxic conclusion.
- **Local non-toxic fallback data** for selected plants missing from the primary toxicity dataset.
- **My Plants** for saving analyzed plants in browser local storage.
- **Responsive loading, error, empty, and result states** for desktop and mobile use.

## How It Works

### Photo analysis flow

```mermaid
flowchart LR
    A[Upload JPEG/PNG] --> B[Validate image]
    B --> C[Pl@ntNet identification]
    C --> D[Top match + alternatives]
    D --> E[Scientific names]
    E --> F[Plant Smart toxicity lookup]
    F --> G[Local safe fallback when applicable]
    G --> H[Normalize safety data]
    H --> I[Result UI]
    D --> J[Confidence + safety-conflict checks]
    J --> I
```

The `/api/analyze` route coordinates the complete photo pipeline. It identifies up to three candidates, performs toxicity lookup for each candidate, and returns the top result, alternatives, and whether those candidates disagree on cat/dog safety.

A toxicity-service failure does not erase a successful plant identification. Instead, the affected candidate remains available with an `unknown` safety result and a service-status indicator.

### Plant name search flow

```mermaid
flowchart LR
    A[Enter plant name] --> B[Local alias search]
    B --> C{Exact local match?}
    C -- Yes --> D[Return ranked matches]
    C -- No --> E[Pl@ntNet species search]
    E --> F[Merge and rank results]
    F --> D
    D --> G[Select species]
    G --> H[Toxicity lookup]
    H --> I[Pet-safety result]
```

Local aliases provide fast matches for known common names. If there is no exact local match, the app also searches Pl@ntNet and combines the results. The selected scientific name is then used for toxicity lookup.

## Safety Design

Safety handling is a core design decision rather than only a UI detail.

### Unknown does not mean safe

The primary toxicity dataset records animals associated with known toxicity. If a plant is not marked toxic for cats or dogs, the app does **not** automatically label that animal as safe. Without positive evidence, the result stays `unknown`.

### Low-confidence identification

Pl@ntNet returns a confidence score for identification candidates. Results below the app's configured threshold are marked as low confidence, and the interface warns that the toxicity information may not apply if the species identification is wrong.

### Alternative-match safety conflicts

The app checks the cat/dog safety profile of the top candidate and its alternatives. If likely matches produce different safety profiles, the user receives an additional warning to confirm the species before relying on the result.

### Local non-toxic fallback

When the primary Plant Smart toxicity dataset has no matching record, the app can check a small local list of plants explicitly listed as non-toxic to both cats and dogs. The local dataset records **Plant Smart** as the source and **ASPCA** as its original source. A plant absent from both datasets still remains `unknown`.

## Architecture

The project separates UI, route handling, domain logic, data, and shared types so that the main logic can be reused and tested independently of the React interface.

```text
plant-pet-safety/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/       # Full image -> identification -> toxicity pipeline
│   │   │   ├── identify/      # Identification-only API route
│   │   │   ├── search/        # Plant name search API route
│   │   │   └── toxicity/      # Toxicity lookup API route
│   │   ├── my-plants/         # Saved-plant page
│   │   └── page.tsx           # Main search and photo-analysis page
│   ├── components/            # Search, upload, result, and saved-plant UI
│   ├── data/                  # Local aliases and non-toxic fallback data
│   ├── lib/                   # Identification, toxicity, search, storage, validation, errors
│   └── types/                 # Shared TypeScript models
├── tests/                     # Automated core-flow and API-route tests
├── sample_images/             # Safe, toxic, unknown, and validation test images
└── .github/workflows/ci.yml   # Pull-request CI checks
```

### Main responsibilities

| Layer | Responsibility |
| --- | --- |
| `src/app` | Pages and Next.js API route boundaries |
| `src/components` | User interaction and presentation |
| `src/lib` | Reusable application logic and external-service integration |
| `src/data` | Small local reference datasets used by search and safety fallback logic |
| `src/types` | Shared application data models |
| `tests` | Automated behavior checks for the core analysis flow |

This separation keeps API-specific concerns out of the components and allows the same identification, toxicity, search, and normalization logic to be tested directly.

## External Services and Data

### Pl@ntNet

[Pl@ntNet](https://plantnet.org/) is used for plant identification and species-name search.

For photo analysis, the server sends the uploaded image to Pl@ntNet and requests up to three results with related reference images. The API key is read only on the server from `PLANTNET_API_KEY`.

### Plant Smart

[Plant Smart](https://plantsm.art/) provides the primary toxicity dataset used by the application. The app looks up plants by normalized scientific name and maps available animal toxicity information into cat and dog safety states.

### ASPCA-sourced local safe data

The project's local safe-plant dataset is based on the [Plant Smart safe-plants list](https://plantsm.art/safe/), whose stored metadata cites the [ASPCA Toxic and Non-Toxic Plants list](https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants) as the original source.

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Pl@ntNet API](https://my.plantnet.org/)
- Plant Smart toxicity data
- Browser `localStorage` for saved plants
- Node.js built-in test runner
- ESLint + Prettier
- GitHub Actions CI

## Getting Started

### Prerequisites

- **Node.js 20** or a compatible modern Node.js version
- **npm**
- A **Pl@ntNet API key**

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Pundeng/plant-pet-safety.git
cd plant-pet-safety
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example` and add your Pl@ntNet API key:

```env
PLANTNET_API_KEY=your_api_key_here
```

Do not commit your real API key.

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server after a build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Compile and run automated tests |
| `npm run test:coverage` | Run tests with Node's coverage reporting |

## Testing and CI

Automated tests cover the core plant-analysis behavior, including image validation, identification parsing, confidence handling, toxicity parsing, search behavior, normalization, API routes, and degraded external-service cases.

Pull requests targeting `main` run the following GitHub Actions checks:

```text
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

## My Plants

Analyzed plants can be saved locally in the browser. Saved entries use the scientific name to prevent duplicates and include a persistent thumbnail generated from the uploaded image.

Saved data is currently device- and browser-specific because it is stored in `localStorage`; there is no account or cloud synchronization.

## Known Limitations

- Plant identification is probabilistic and may be incorrect, especially with unclear or visually similar plants.
- Toxicity datasets do not cover every plant species.
- A missing toxicity record is not evidence that a plant is safe.
- The local non-toxic fallback covers only explicitly listed plants.
- Saved plants are stored only in the current browser.
- Photo upload currently accepts JPEG and PNG images up to 5 MB.
- External API availability can affect identification, search, or toxicity information.
- This project is an informational tool and is **not a substitute for veterinary advice or emergency poison-control guidance**.

## Contributors

- [Pundeng](https://github.com/Pundeng)
- [cho-hazel](https://github.com/cho-hazel)

## Data Attribution

Plant Pet Safety does not claim ownership of third-party identification or toxicity data.

- Plant identification and species search: [Pl@ntNet](https://plantnet.org/)
- Primary toxicity data: [Plant Smart](https://plantsm.art/)
- Local non-toxic reference data: [Plant Smart Safe Plants](https://plantsm.art/safe/), with ASPCA recorded as the original source in the project's dataset metadata
- Original non-toxic plant reference: [ASPCA Toxic and Non-Toxic Plants](https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants)

## Disclaimer

Always confirm a plant's identity before acting on a safety result. If a pet may have eaten a toxic or unidentified plant, contact a veterinarian or appropriate animal poison-control service rather than relying on this application alone.
