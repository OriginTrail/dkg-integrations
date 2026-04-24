---
name: Propose a new install kind
about: Your integration doesn't fit any of the existing install kinds (mcp / service / cli / agent-plugin / manual).
labels: schema-proposal
---

### What kind of integration are you building

<!-- Describe the shape. Process model, transport, lifecycle, target platforms. -->

### Why the existing kinds don't fit

- `mcp` doesn't fit because: <!-- ... -->
- `service` doesn't fit because: <!-- ... -->
- `cli` doesn't fit because: <!-- ... -->
- `agent-plugin` doesn't fit because: <!-- ... -->
- `manual` is a last resort; explain why it's not acceptable here:

### Proposed kind

- `kind: <name>` — <!-- one-sentence summary -->
- Required fields in the install block:
- Installer behavior you'd expect `dkg integration install` to implement:
- Security implications (what new trust decisions does this kind force on the operator?):

### Would you be willing to implement the installer side?

<!-- yes / no / partial — the schema lives here, but the installer logic lives in OriginTrail/dkg's dkg-cli. -->
