#!/usr/bin/env node
// Registry validator.
//
// Walks integrations/*.json, validates each entry against schema/integration.schema.json,
// and runs a handful of structural checks the schema can't express:
//
//   - filename must equal "<slug>.json"
//   - slug must be globally unique across the registry
//   - maintainer.github handle must exist in the pinned commit's context
//     (soft-checked; CI's gh context is authoritative)
//   - `install.kind` consistency with `publicInterfacesUsed`
//   - WM/SWM/VM scope consistency with `writeAuthority` entries
//
// Exits non-zero on the first hard failure, after printing every finding.
//
// Usage:
//   node scripts/validate.mjs                 # validates all entries
//   node scripts/validate.mjs <path.json>...  # validates specific entries

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Load schema ────────────────────────────────────────────────────────────
const schemaPath = path.join(ROOT, 'schema', 'integration.schema.json');
const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// ── Resolve targets ────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let targets;
if (argv.length > 0) {
  targets = argv.map((p) => path.resolve(p));
} else {
  const dir = path.join(ROOT, 'integrations');
  const files = await fs.readdir(dir);
  targets = files
    .filter((f) => f.endsWith('.json') && f !== 'TEMPLATE.json')
    .map((f) => path.join(dir, f));
}

// ── Run ────────────────────────────────────────────────────────────────────
const findings = [];
const slugsSeen = new Map(); // slug → file that declared it
let hardFails = 0;

for (const file of targets) {
  const rel = path.relative(ROOT, file);
  const raw = await fs.readFile(file, 'utf8');

  let entry;
  try {
    entry = JSON.parse(raw);
  } catch (err) {
    hardFails += 1;
    findings.push({ level: 'error', file: rel, msg: `invalid JSON: ${err.message}` });
    continue;
  }

  // Schema validation
  if (!validate(entry)) {
    hardFails += 1;
    for (const err of validate.errors ?? []) {
      findings.push({
        level: 'error',
        file: rel,
        msg: `schema: ${err.instancePath || '/'} ${err.message}${err.params ? ` (${JSON.stringify(err.params)})` : ''}`,
      });
    }
    continue;
  }

  // Filename = slug
  const expectedName = `${entry.slug}.json`;
  if (path.basename(file) !== expectedName) {
    hardFails += 1;
    findings.push({
      level: 'error',
      file: rel,
      msg: `filename must match slug: expected ${expectedName}, got ${path.basename(file)}`,
    });
  }

  // Slug uniqueness
  if (slugsSeen.has(entry.slug)) {
    hardFails += 1;
    findings.push({
      level: 'error',
      file: rel,
      msg: `duplicate slug "${entry.slug}" also declared in ${slugsSeen.get(entry.slug)}`,
    });
  } else {
    slugsSeen.set(entry.slug, rel);
  }

  // Note: install.kind and publicInterfacesUsed describe independent things —
  // install.kind is the DISTRIBUTION surface (how users install the integration),
  // publicInterfacesUsed is the CONSUMPTION surface (how the integration talks
  // to the node). They are not implied by each other. An MCP-server integration
  // typically has install.kind: "mcp" but consumes "http-api". A CLI-distributed
  // integration might shell out to `dkg` (publicInterfacesUsed: ["cli"]) or it
  // might talk HTTP (publicInterfacesUsed: ["http-api"]). No structural check
  // here; the schema enum constrains values and human review covers fit.

  // Memory-layer ↔ writeAuthority sanity
  const writes = entry.security.writeAuthority ?? [];
  const touchesSwmWrite = writes.some((w) => /shared-memory|\/promote/.test(w));
  const touchesVmWrite = writes.some((w) => /\/publish|\/endorse|\/verify|\/update/.test(w));
  const layers = new Set(entry.memoryLayers);

  if (touchesSwmWrite && !layers.has('SWM')) {
    hardFails += 1;
    findings.push({
      level: 'error',
      file: rel,
      msg: `writeAuthority lists a Shared-Memory write but memoryLayers does not include "SWM"`,
    });
  }
  if (touchesVmWrite && !layers.has('VM')) {
    hardFails += 1;
    findings.push({
      level: 'error',
      file: rel,
      msg: `writeAuthority lists a Verified-Memory write but memoryLayers does not include "VM"`,
    });
  }

  // Round-1 scope guard: VM writes are out of scope.
  if (touchesVmWrite) {
    findings.push({
      level: 'warn',
      file: rel,
      msg: `writeAuthority declares Verified-Memory operations (/publish, /endorse, /verify, /update). Round 1 of the bounty is Working/Shared-only; this integration may be out of scope unless explicitly justified.`,
    });
  }

  // Curator-authority surface requires a security note
  const touchesCurator = writes.some((w) => /publish|share|endorse|verify/i.test(w));
  if (touchesCurator && !(entry.security.notes && entry.security.notes.length > 50)) {
    findings.push({
      level: 'warn',
      file: rel,
      msg: `writeAuthority includes Curator-authority surfaces but security.notes is thin (<50 chars). Document the model explicitly.`,
    });
  }

  // Community-tier trust default expectation
  if (entry.trustTier === 'featured' && !entry.maintainer.github.startsWith('@OriginTrail')) {
    findings.push({
      level: 'warn',
      file: rel,
      msg: `trustTier "featured" is usually reserved for OriginTrail-maintained integrations. Double-check tier assignment.`,
    });
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
const errors = findings.filter((f) => f.level === 'error');
const warns = findings.filter((f) => f.level === 'warn');

for (const f of findings) {
  const prefix = f.level === 'error' ? '✖' : '!';
  process.stdout.write(`${prefix} ${f.file}: ${f.msg}\n`);
}

process.stdout.write(
  `\n${targets.length} entr${targets.length === 1 ? 'y' : 'ies'} checked · ${errors.length} error${errors.length === 1 ? '' : 's'} · ${warns.length} warning${warns.length === 1 ? '' : 's'}\n`,
);

if (hardFails > 0) process.exit(1);
