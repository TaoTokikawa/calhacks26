# ForgeAI Hyphenate team split

## Vincent — Engineering and manufacturing logic
Own the component requirements, CAD and BOM. Define intended loads, fit, temperature and environment. Validate inventory and quantities, purchased stock, material grade, operation time and assembly steps. Obtain a reference quote or mentor review. Qualify process alternatives only with evidence. CAD alone does not establish machining time or structural safety.

## Frontend teammate — Complete build workflow
Own project brief -> editable BOM -> source evidence -> manufacturing route -> assembly/capacity -> cash decision. Keep errors, stale data and unreviewed requirements visible. Test imports, export, reload persistence and unfamiliar user input. Integrate the API through same-origin routes; never expose credentials.

## Backend teammate — Deterministic calculation and durable state
Own BOM expansion, scrap, inventory, MOQ, packs, quantity breaks, setup once per unique manufactured part run, final-assembly labor, taxes, fees, contingency, deadlines and maximum feasible quantity. Add authenticated project storage, revisioned approvals and duplicate-action controls before any purchase integration. Keep independent reference tests.

## Integration teammate — Current data
Adafruit public product lookup is implemented at /api/catalog/adafruit?id=3777. It retains a retrieval timestamp, stock text, price breaks and supplier URL. No API key is required. It is throttled and briefly cached; a catalog observation is not a binding quote or inventory reservation.

Mouser Search and DigiKey Product Information require provider access credentials/OAuth and are NOT connected. Intended for catalog electronic parts. Add server-side integrations after selecting and registering a provider; store keys as hosted runtime secrets, never browser inputs, VITE variables, source files or chat text.

Nessie is NOT connected. Request sponsor sandbox access, verify the current host and account/transaction semantics, then implement a server-side read. Make mock versus live status explicit. No purchases or real payments are performed by this demo.

The LLM is NOT connected. A future model may draft a requirements checklist or tentative BOM and explain verified calculations. It must not invent prices, compatibility, process time, strength or supplier availability. Current starters and suggestions are rule based.

## Next two checkpoints
1. Reproduce one complete assembly cost independently, including packs and inventory. Read and apply an actual catalog price to its exact component.
2. Obtain one custom-manufacturing quote for a specified part/revision/quantity and compare it with the operation-based estimate. Confirm a Nessie read affects affordability before adding approvals.

## Current demo boundaries
BOM projects persist in this browser only. CAD geometry metadata persists; uploaded CAD bytes do not. Capacity is a rough station bound, not a factory digital twin. Existing stock book value is excluded: the main total represents new run cash. Supplier shipping/tax and unspecified inspection/tooling need explicit inputs.

## Hyphenate focus
The primary system fills manufacturing purchasing analyst and accounts payable reviewer seats for a hardware startup. The Finance controls tab demonstrates request/quote eligibility, separate simulated requester and approver personas, an exact approved snapshot, invoice holds, duplicate-ID checks, rejection and browser-local evidence history. All suppliers and actions are simulated. This is not production authorization or an immutable audit log.

Priority upgrades: backend-owned workflow state, authenticated distinct users and segregation of duties, append-only records, scheduled/event-driven intake, real supplier records, and adversarial exception tests. Nessie is optional. BOM and CAD provide purchasing context rather than being the whole demo.
