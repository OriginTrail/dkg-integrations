# DKG Integrations Registry

The official catalog of integrations for the OriginTrail Decentralized Knowledge Graph v10.

Each integration listed here is a **contributor-owned project** that talks to a DKG node through one of the supported public interfaces (HTTP API, `dkg` CLI, or MCP server). This repository is the canonical list of those integrations — what they are, who maintains them, what version they're pinned to, what they do, and what they're allowed to touch.

Integrations listed here are:

- **Discoverable** via `dkg integration search` in the CLI and the Integrations tab in the node dashboard.
- **Installable** via `dkg integration install <slug>`, which executes the declared install recipe and wires the integration to the local node with your consent.
- **Declared** — every entry spells out its license, its network egress, its DKG write authority, and its third-party credential needs. No hidden behavior.

This repository does **not** contain integration code. Integration code lives in each contributor's own repository, and this registry pins to a specific commit and published version.

---

## For users

```bash
# Browse the registry
dkg integration search                # list featured + verified
dkg integration search shared-memory  # filter by keyword
dkg integration info <slug>           # full details for one integration

# Install
dkg integration install <slug>
dkg integration install <slug> --for cursor   # scope an MCP install to one client

# Manage
dkg integration list                  # what's installed locally
dkg integration upgrade <slug>
dkg integration uninstall <slug>
```

See the DKG v10 node documentation for details on `dkg integration` subcommands.

---

## For contributors

If you've built something that plugs into a DKG v10 node, or you're building for the [DKG v10 bounty program](https://github.com/OriginTrail/dkg-v9/…), this is where your integration gets listed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the submission walkthrough. The short version:

1. Your integration lives in **your own repository** and is published to npm (or docker) at a pinned version.
2. You open a pull request against this repository adding a single entry file at `integrations/<your-slug>.json`, using [integrations/TEMPLATE.json](integrations/TEMPLATE.json) as a starting point.
3. CI validates your entry against [schema/integration.schema.json](schema/integration.schema.json) and runs security checks against your published package.
4. The review committee evaluates fit, quality, and security. Awards are disbursed on registry acceptance (not on integration code merging anywhere).

You do **not** need to build an installer — the `dkg integration install` command handles the supported install kinds automatically (`mcp`, `service`, `cli`, `agent-plugin`, `manual`). You just describe how your integration wants to be installed in the registry entry.

---

## Trust tiers

Every entry has a `trustTier` that determines how prominently it surfaces:

| Tier         | Who gets it                                          | Surfacing                                     |
| ------------ | ---------------------------------------------------- | --------------------------------------------- |
| `featured`   | OriginTrail-maintained or committee-promoted         | Default in `dkg integration search`, docs     |
| `verified`   | Externally maintained, passed full security review   | Default in search                             |
| `community`  | Any accepted entry                                   | Shown with `--include-community`              |

Contributors submit as `community`; the review committee may upgrade the tier.

---

## What CI checks automatically

Every registry PR runs:

- JSON Schema validation against `schema/integration.schema.json`
- Filename-matches-slug
- Slug uniqueness across the registry
- `install.kind` ↔ `publicInterfacesUsed` consistency
- Memory-layer ↔ `security.writeAuthority` consistency (e.g. can't claim WM-only while listing SWM writes)
- Round-1-scope guard (VM operations flagged as out-of-scope)
- npm package existence at the declared version
- No `preinstall` / `install` / `postinstall` scripts in the published package
- License consistency between registry entry and published package
- npm provenance attestation (warning if absent; required for `verified` / `featured` tier)
- Docker image digest pinning (warning if absent for `runtime: docker`)

Human review still decides fit, quality, and tier. CI just removes the mechanical failure modes.

---

## Repository layout

```
integrations/
  <slug>.json          # one file per integration
  TEMPLATE.json        # copy this to start a new submission

schema/
  integration.schema.json   # JSON Schema 2020-12 — the canonical contract

scripts/
  validate.mjs              # structural validation, run locally or in CI
  security-checks.mjs       # per-entry security checks against npm

.github/
  workflows/validate.yml    # CI wiring
  PULL_REQUEST_TEMPLATE.md  # submission checklist
```

---

## License

Registry entries are licensed by their individual contributors (each entry declares its integration's license). The registry scaffolding itself (schema, scripts, workflows, docs) is released under Apache-2.0 — see [LICENSE](LICENSE).

---

## Governance

Registry entries are reviewed by the OriginTrail core-developers team and, for bounty submissions, the DKG v10 bounty committee. Decisions and rationales are published alongside the accepted or declined PR. Maintainers commit to honoring the look-before-mint slug normalization rule (lowercase, ASCII-fold, strip stopwords, hyphenate, ≤60 chars) so entries converge rather than fragment.
