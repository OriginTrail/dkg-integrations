## What this PR does

Adds RepNet Agent Trust Layer to the DKG integrations registry.

RepNet gives AI agents a DKG-backed trust layer for choosing counterparties. Jobs, applications, payment paths, delivery context, LLM-assisted delivery reports, feedback rights, and final reputation evidence become structured memory that future agents can query before hiring, paying, delegating, collaborating, or trusting.

## Key product update

- RepNet supports two simple payment paths:
  - Review-hold: the Contractor funds the job in advance, funds stay held while the Worker delivers, and an LLM opinion report helps the Contractor evaluate whether to release funds or request more work.
  - Upfront: the Contractor pays the Worker immediately through RepNet, creating a simple paid job receipt and feedback path for reputation.
- This simplifies escrow into an agent-friendly transaction flow while preserving verifiable job, payment, delivery, and reputation evidence.

## Integration links and metadata

- Repo: https://github.com/dreddster/RepNet
- Website: https://repnet.io
- Commit pinned: `692faf247d062ec91c24d25d37867454a918a216`
- Published package: `@repnet/mcp-server@0.1.4`
- Supporting packages: `@repnet/sdk@0.1.7`, `@repnet/cli@0.1.7`
- Design brief: https://github.com/dreddster/RepNet/blob/main/docs/DKG-INTEGRATION-DESIGN-BRIEF.md
- Lifecycle demo: https://raw.githubusercontent.com/dreddster/RepNet/main/docs/assets/demos/repnet-job-board-lifecycle.mp4
- CI: https://github.com/dreddster/RepNet/actions/runs/26445646071

## Current demo evidence

The side-by-side Contractor/Worker lifecycle demo shows:

job post → Worker applies → Contractor checks DKG-backed reputation → Worker delivers → LLM opinion report → Contractor review/release → DKG reputation query with 5 prior events.

## Memory-layer mapping

- `WM`: private job specs, applications, delivery payloads, and review context stay in RepNet gateway custody / local node state.
- `SWM`: public `OpenJob` and `JobApplication` summaries are shaped for Context Graph Shared Memory so DKG peers can discover open work and applications without exposing private specs or proposals.
- `VM`: completed outcomes become public DKG reputation evidence / Knowledge Assets for future counterparty evaluation.

## Scope & faithfulness

- [x] Integration uses only the supported public interfaces: RepNet talks to the DKG node over the HTTP API.
- [x] It does not import internal DKG packages, patch node source, or write to SPARQL directly.
- [x] `memoryLayers` reflects the product surface: Working Memory for private active job state, Shared Memory path for public job/application discovery summaries, and Verified Memory for completed reputation evidence.
- [x] `v10PrimitivesUsed` reflects implemented DKG-facing artifacts: Context Graph, Assertion, Knowledge Asset, Curator-governed writes, Entity, and UAL.
- [x] Terminology matches the v10 vocabulary used in the design brief.

## Security declarations

- [x] `security.networkEgress` lists the configured Base/Base Sepolia RPC endpoint, configured DKG node HTTP API, and configured RepNet gateway/publisher API when using gateway-backed job-board, delivery, or feedback actions.
- [x] `security.writeAuthority` lists DKG write operations used by the integration:
  - `POST /api/assertion/create` with `promote=true` for Shared Memory promotion fallback
  - `POST /api/shared-memory/publish`
  - `POST /api/publish-direct`
- [x] `security.credentialsHandled` lists user-provided credentials:
  - `REPNET_PRIVATE_KEY`
  - `REPNET_RPC_URL`
  - `DKG_API_URL`
  - `DKG_AUTH_TOKEN`
  - `DKG_CONTEXT_GRAPH_ID`
- [x] Published MCP package has no `preinstall`, `install`, or `postinstall` scripts.
- [x] The pinned public SHA contains the published package source, current design brief, lifecycle demo, and passing public CI state.

## Contributor attestation

- [x] This integration is my own work or properly licensed.
- [x] It contains no intentional backdoors, malicious logic, or data-exfiltration paths beyond what is declared in `security.networkEgress`.
- [x] I understand that the integration may be delisted for any material misrepresentation in the registry entry.
- [x] I commit to a minimum one-year maintenance window post-acceptance.

## Notes for the committee

RepNet targets the Flagship tier and commits to one year of maintenance after registry acceptance.

The registry validator emits one warning because RepNet declares Knowledge Asset publishing (`POST /api/publish-direct`) in addition to Shared Memory promotion/publish surfaces. That is intentional: RepNet covers live/private job coordination, public job/application discovery, and completed reputation evidence. The Round 1 fit is the Working/Shared Memory path for agent coordination; the Verified Memory path records completed outcomes as durable counterparty evidence for future agents.
