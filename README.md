# ForgeAI manufacturing finance workspace

React/TypeScript/Tailwind application with a Vinext server deployed on Sites. The project studio expands a build idea into an editable BOM, manufacturing operations, assembly labor/capacity and new-cash production scenarios. The original single-part estimator remains available.

## Start and verify

Use Node.js 22.13+ and the root package scripts. Install with the supplied dependency helper or `npm ci`, then `npm run dev`. Build with `npm run build`. Test with `npm test`. The server is necessary for /api/catalog/adafruit and /api/integrations; no Python process is required by the hosted application.

## Working features

- Three labeled, rule-based starter drafts (robot, fixture, sensor) plus keyword routing from a user brief. No LLM design generation is claimed.
- Editable BOM, CSV replacement with Undo, JSON export, browser-local project persistence.
- Per-product demand, inventory, scrap, minimum orders, packs, surplus and supplier quantity breaks.
- Custom manufacturing: purchased stock kg x material rate, explicit operation minutes/rates, setup once per part run and finish.
- Per-component STL geometry attachment, declared units, mesh checks and software 3D preview. Uploaded CAD bytes are session-only; geometry metadata persists locally.
- Assembly station labor and setup; parallel staffed station capacity; bottleneck and rough completion bound.
- Global shipping, optional tax on BOM spend and contingency allocation; mock bank balance minus other commitments/reserve.
- Whole-request quantity comparisons and maximum affordable quantity, scanned up to the requested demand (5,000 maximum).
- Alternatives excluded from cost comparisons until a user marks engineering review; changes to requirements invalidate the mark.
- Source labels, supplier observation timestamps, quote expiry/scope flags and read-only live Adafruit catalog lookup.
- Team task split and downloadable public/ForgeAI-team-handoff.md.

## Current data

GET /api/catalog/adafruit?id=3777 retrieves a specific Adafruit product. Product ID is numeric and the upstream host is fixed, preventing arbitrary URL fetches. No API key is required. We retain product name, MPN, USD price, stock text, quantity breaks, timestamp and supplier URL. Reads are throttled (13 seconds between uncached requests in a worker instance) and cached for 15 minutes. Cache/rate controls are per instance, not a global distributed quota. No images are hotlinked. Verify provider limits before scaling.

A catalog observation is not a binding quote, physical compatibility check, confirmed lead time or inventory reservation. Applying data requires user review and does not rename the original engineering requirement. Lead time remains manually entered. Failures leave current price assumptions unchanged.

Mouser, DigiKey, Nessie and LLM integrations are not connected. /api/integrations states this explicitly. Store future credentials using hosted server secrets, never VITE variables, localStorage, source files, BOM fields or chat. Provider documentation is linked in the Team & data tab. No API credential is needed for the implemented public lookup.

## Cost conventions

Money component calculations are rounded to cents before multiplication; subtotal and contingency are display-rounded to cents. Amounts are preliminary USD planning values. Main totals represent new cash needed for a run; existing inventory's book value is not included. Contingency is reserved cash rather than a supplier payment. Manufacturing setup is charged only when new pieces are needed. Pack/MOQ costs use ordered quantity for price tiers. Gross requirements = ceil(net demand / (1 - scrap)), before subtracting inventory.

Capacity = staffed parallel stations x scheduled minutes/day x entered efficiency / cycle minutes per product. The limiting station defines rough throughput. Completion = longest required component lead time + ceil(requested products / limiting daily capacity). This deliberately simplified model treats all days alike and waits for all components before assembly. No finite buffers, shared operators, machine breakdowns, rework, shift calendar or discrete-event simulation are represented.

No manufacturing time, toolpath, structural safety, tolerance capability, fit or production qualification is inferred from CAD. Unspecified tooling, inspection, freight and taxes need explicit inputs. No supplier order or bank payment is initiated. Project review saves only a local demo decision.

## Legacy code

backend/ retains the earlier standalone FastAPI/trimesh prototype for local experimentation. It is not the server used by this hosted Vinext application; current web server routes are in app/api and calculation logic in frontend/src/projectModel.ts.

## Hyphenate workflow
The default Finance controls page is a simulated manufacturing finance workflow. It automatically evaluates quotation revision, material, quantity, expiry and total budget, selects the cheapest eligible offer, blocks the requester demo persona from approving, snapshots approved records, reconciles a later invoice and flags duplicate invoice IDs. Rejections return the request for clarification. Draft a requirement from a BOM component to connect the engineering model to purchasing. Records persist only in browser localStorage; personas are simulated, not authenticated roles. Audit history is editable client data rather than an immutable log. No payment, bank transfer or real supplier order is executed. Production needs server-owned records and authenticated segregation of duties.
