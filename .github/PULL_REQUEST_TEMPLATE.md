<!-- Thanks for contributing to the DKG Integrations Registry. -->

## What this PR does

<!-- One or two sentences. "Adds <name>", "Updates <slug> to v<version>", etc. -->

## Integration links

- Repo: <!-- https://github.com/... -->
- Commit pinned: <!-- full 40-char SHA -->
- Published package: <!-- @scope/name@version or ghcr.io/... -->
- Design brief (bounty submissions): <!-- URL -->
- Demo (bounty submissions): <!-- URL to recorded walkthrough or live endpoint -->

## Scope & faithfulness

- [ ] Integration uses only the supported public interfaces (HTTP API, `dkg` CLI, MCP). It does **not** import internal DKG packages, patch node source, or write to SPARQL directly (bypassing the assertion lifecycle / Curator).
- [ ] `memoryLayers` correctly reflects which layer(s) the integration touches.
- [ ] `v10PrimitivesUsed` correctly reflects which primitives are exercised.
- [ ] Terminology matches the v10 vocabulary (Context Graph, Sub-graph, Assertion, Knowledge Asset, Knowledge Collection, Curator, Entity, WM/SWM/VM).

## Security declarations (Section 8a)

- [ ] `security.networkEgress` lists every external host the integration contacts beyond the local DKG node.
- [ ] `security.writeAuthority` lists every DKG write operation the integration performs. Curator-authority ops (PUBLISH, SHARE, endorse, verify) are called out explicitly if used.
- [ ] `security.credentialsHandled` lists every third-party credential the installer will prompt for.
- [ ] The published package has **no** `preinstall` / `install` / `postinstall` scripts, or the exceptions are explained in `security.notes`.
- [ ] The package is published with build provenance (`npm publish --provenance`) when applicable.
- [ ] The pinned git SHA is the exact commit the published package was built from.

## Contributor attestation

- [ ] This integration is my own work or properly licensed.
- [ ] It contains no intentional backdoors, malicious logic, or data-exfiltration paths beyond what is declared in `security.networkEgress`.
- [ ] I understand that the integration may be delisted for any material misrepresentation in the registry entry.
- [ ] I commit to a minimum 6-month maintenance window post-acceptance (bounty submissions).

## Notes for the committee

<!-- Anything not captured by the structured fields that the committee should know. -->
