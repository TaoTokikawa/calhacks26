# Start here

This is the current ForgeAI website source, including the Hyphenate finance workflow, assembly BOM planner, manufacturing estimates, sample STL, API routes and automated tests.

## Run on your computer

Install Node.js 22.13 or newer (Node 24 is also suitable). Extract this ZIP, open the ForgeAI folder in VS Code, then use its terminal:

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal (normally http://localhost:5173). Run all commands from this root folder, not frontend/. The root package.json is the active application.

## Tests and production build

```bash
npm test
npx tsc --noEmit
npm run build
```

The published source passed 21 automated tests and the TypeScript and production build checks. This export excludes installed dependencies and generated build output. Run npm ci to install the exact lockfile dependencies.

## Main files to edit

- frontend/src/FinanceControls.tsx: requests, supplier review, demo approval and invoice reconciliation.
- frontend/src/financeModel.ts: finance checks and workflow rules.
- frontend/src/ProjectWorkspace.tsx: idea brief, BOM, sources, routes, assembly and budget screens.
- frontend/src/projectModel.ts: assembly-level costs, inventory, purchasing constraints and capacity.
- frontend/src/main.tsx: app navigation and original single-part estimator.
- frontend/src/style.css and project.css: styling.
- app/api/catalog/adafruit/route.ts: server-side public product lookup.
- public/ForgeAI-team-handoff.md: team responsibilities.
- public/samples/mounting-bracket.stl: sample part.

## Important scope

The current website uses React/TypeScript with a Vinext server. The Python backend/ directory is the earlier standalone FastAPI prototype; it is not required to run this website. Do not start a separate frontend package: frontend/index.html is also an earlier Vite entrypoint; use the root npm scripts and app/page.tsx.

All supplier finance cases and approval personas are simulated. Finance history and project plans persist in your browser only; they are not production authorization or tamper-proof server records. No money or supplier order is sent. Nessie and LLM integrations are not connected. The public Adafruit lookup requires no key, but supplier/network availability can affect it; failures do not update prices.

CAD measurements do not verify strength, manufacturing time, fit or process feasibility. Manufacturing costs are preliminary assumptions unless explicitly replaced with a documented quote/catalog observation.

The .openai/hosting.json file identifies the existing hosted website. Local development does not publish changes. Do not run the Sites publishing helpers against that project unless you intend to update the hosted site. A new deployment elsewhere requires that host's configuration; this source is not a universal drag-and-drop static export.

No API keys, Git credentials, node_modules, browser state or environment secrets are included.
