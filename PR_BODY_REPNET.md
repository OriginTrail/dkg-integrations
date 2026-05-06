## What this PR does

Adds RepNet Agent Trust Layer to the DKG integrations registry.

RepNet gives AI agents a DKG-backed trust layer for choosing counterparties. Agent identities, agreements, payments, escrow outcomes, disputes, and role-aware feedback become structured memory that future agents can query before hiring, paying, delegating, collaborating, or trusting.

## Integration links

- Repo: https://github.com/dreddster/RepNet
- Website: https://repnet.io
- Commit pinned: `1241e421b88de1bfe9631f1d38f5e969f9eda375`
- Published package: `@repnet/mcp-server@0.1.2`
- Design brief: https://github.com/dreddster/RepNet/blob/main/docs/DKG-INTEGRATION-DESIGN-BRIEF.md
- Demo: https://github.com/dreddster/RepNet/blob/main/docs/assets/demos/agent-onboarding.mp4

## Scope & faithfulness

- [x] Integration uses only the supported public interfaces: RepNet talks to the DKG node over the HTTP API.
- [x] It does not import internal DKG packages, patch node source, or write to SPARQL directly.
- [x] `memoryLayers` reflects the product surface:
  - `WM`: private job/dispute working material in RepNet before public/shared publication.
  - `SWM`: redacted `repnet:DisputeCase` RDF manifests written through `/api/shared-memory/write` before judging.
  - `VM`: public Agent Profiles, Job Agreements, Job Feedback, receipts, and final dispute reasoning published as Knowledge Assets.
- [x] `v10PrimitivesUsed` reflects implemented DKG-facing artifacts: Context Graph, Assertion, Knowledge Asset, Curator-governed writes, Entity, and UAL.
- [x] Terminology matches the v10 vocabulary used in the design brief.

## Security declarations

- [x] `security.networkEgress` lists the configured Base/Base Sepolia RPC endpoint, configured DKG node HTTP API, and optional RepNet publisher API for publisher-backed feedback actions.
- [x] `security.writeAuthority` lists DKG write operations used by the integration:
  - `POST /api/shared-memory/write`
  - `POST /api/publish-direct`
- [x] `security.credentialsHandled` lists user-provided credentials:
  - `REPNET_PRIVATE_KEY`
  - `REPNET_RPC_URL`
- [x] Published package has no `preinstall`, `install`, or `postinstall` scripts.
- [x] npm provenance check reports provenance present for `@repnet/mcp-server@0.1.2`.
- [x] The pinned public SHA is the exact source commit for the published package.

## Contributor attestation

- [x] This integration is my own work or properly licensed.
- [x] It contains no intentional backdoors, malicious logic, or data-exfiltration paths beyond what is declared in `security.networkEgress`.
- [x] I understand that the integration may be delisted for any material misrepresentation in the registry entry.
- [x] I commit to a minimum 6-month maintenance window post-acceptance.

## Notes for the committee

RepNet targets the Flagship tier and commits to one year of maintenance after registry acceptance.

The registry validator emits one warning because RepNet declares Knowledge Asset publishing (`POST /api/publish-direct`) in addition to the Round 1 Shared Memory path. The Round 1 fit is the explicit Shared Memory dispute case-file layer: RepNet writes redacted `repnet:DisputeCase` RDF quads to DKG Shared Memory before judging. The Knowledge Asset path is included because the published MCP surface also supports public Agent Profiles, Job Agreements, Job Feedback, receipts, and final dispute reasoning; this is documented as a promotion/oracle-readiness path rather than the sole Round 1 claim.

Current demo status: onboarding demo is linked. Regular job and disputed escrow recordings are pending OriginTrail team resolution of the DKG KA upload/finality issue observed on the testnet node path.

The demo links will be updated with the relevant recordings as soon as the DKG KA finality is resolved.

