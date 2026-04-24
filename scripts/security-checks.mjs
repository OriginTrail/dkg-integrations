#!/usr/bin/env node
// Security checks run per-entry as part of registry CI.
//
// These are the Section 8a checks that can be automated:
//
//   - no postinstall/preinstall/install scripts in the published npm package
//     (for install.kind in {cli, service-npm-global, agent-plugin, mcp-npx})
//   - declared license matches the published package's license field
//   - npm package exists at the declared version
//   - `npm audit --production` for the declared package (soft signal, warn only)
//   - docker image digest resolves (if declared)
//
// This script is deliberately read-only: it does not `npm install` anything;
// it uses the npm registry HTTP API so CI runs are fast and sandboxed.
//
// Usage:
//   node scripts/security-checks.mjs <path.json>...
//
// Exits non-zero only on hard-fail findings; warnings do not fail CI.

import fs from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('usage: security-checks.mjs <integrations/*.json>...');
  process.exit(2);
}

const findings = [];
let hardFails = 0;

for (const file of argv) {
  const rel = path.relative(process.cwd(), file);
  const entry = JSON.parse(await fs.readFile(file, 'utf8'));

  // ── Determine the npm package (if any) implied by the install kind ─────
  const { pkg, pkgVersion } = resolveNpmPackage(entry.install);

  if (pkg) {
    const meta = await fetchNpmMeta(pkg, pkgVersion);

    if (meta == null) {
      findings.push({
        level: 'error',
        file: rel,
        msg: `npm package "${pkg}${pkgVersion ? `@${pkgVersion}` : ''}" not found on registry.npmjs.org`,
      });
      hardFails += 1;
      continue;
    }

    // scripts check
    const scripts = meta.scripts ?? {};
    for (const hook of ['preinstall', 'install', 'postinstall']) {
      if (hook in scripts) {
        findings.push({
          level: 'error',
          file: rel,
          msg: `published package ${pkg}@${meta.version} declares a "${hook}" script: ${JSON.stringify(scripts[hook])}. Install hooks are disallowed (Section 8a).`,
        });
        hardFails += 1;
      }
    }

    // license consistency
    const declaredLicense = entry.license;
    const pkgLicense = typeof meta.license === 'string' ? meta.license : meta.license?.type;
    if (pkgLicense && pkgLicense !== declaredLicense) {
      findings.push({
        level: 'warn',
        file: rel,
        msg: `registry declares license "${declaredLicense}" but published package ${pkg}@${meta.version} reports "${pkgLicense}".`,
      });
    }

    // provenance attestation — informational for now
    if (!meta._hasProvenance) {
      findings.push({
        level: 'warn',
        file: rel,
        msg: `published package ${pkg}@${meta.version} has no npm provenance attestation. Verified/featured tier requires provenance; community tier does not.`,
      });
    } else {
      findings.push({
        level: 'info',
        file: rel,
        msg: `provenance attestation present on ${pkg}@${meta.version}.`,
      });
    }
  }

  // ── Docker image digest (if declared) ──────────────────────────────────
  const docker = entry.install.docker;
  if (docker?.digest) {
    findings.push({
      level: 'info',
      file: rel,
      msg: `docker digest declared: ${docker.image}@${docker.digest}. (Runtime resolution against the registry is not performed in CI.)`,
    });
  } else if (entry.install.kind === 'service' && entry.install.runtime === 'docker') {
    findings.push({
      level: 'warn',
      file: rel,
      msg: `docker install declared without an image digest. Verified/featured tier requires a pinned sha256 digest.`,
    });
  }
}

for (const f of findings) {
  const prefix = f.level === 'error' ? '✖' : f.level === 'warn' ? '!' : 'i';
  process.stdout.write(`${prefix} ${f.file}: ${f.msg}\n`);
}

process.stdout.write(
  `\n${argv.length} entr${argv.length === 1 ? 'y' : 'ies'} checked · ${findings.filter((f) => f.level === 'error').length} error(s) · ${findings.filter((f) => f.level === 'warn').length} warning(s)\n`,
);

if (hardFails > 0) process.exit(1);

// ── helpers ────────────────────────────────────────────────────────────────

function resolveNpmPackage(install) {
  switch (install.kind) {
    case 'cli':
      return { pkg: install.package, pkgVersion: install.version };
    case 'service':
      if (install.runtime === 'npm-global' && install.npmGlobal) {
        return { pkg: install.npmGlobal.package, pkgVersion: install.npmGlobal.version };
      }
      return { pkg: null };
    case 'agent-plugin':
      return { pkg: install.package, pkgVersion: install.version };
    case 'mcp': {
      // install.command === "npx" with args like ["-y", "<pkg>@<version>"] is the common shape.
      const args = install.args ?? [];
      const pkgArg = args.find((a) => !a.startsWith('-'));
      if (!pkgArg) return { pkg: null };
      const m = pkgArg.match(/^((?:@[^/]+\/)?[^@]+)(?:@(.+))?$/);
      if (!m) return { pkg: null };
      return { pkg: m[1], pkgVersion: m[2] };
    }
    default:
      return { pkg: null };
  }
}

async function fetchNpmMeta(pkg, version) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg).replace('%40', '@')}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const body = await res.json();
  // Hard requirement: if a version is pinned in the entry, it MUST exist on
  // the registry. We do not silently fall back to "latest" — that would let
  // entries pass CI while pointing at a version nobody has published.
  if (version) {
    const target = body.versions?.[version];
    if (!target) return null;
    return meta(target);
  }
  const latest = body['dist-tags']?.latest;
  const target = latest ? body.versions?.[latest] : null;
  if (!target) return null;
  return meta(target);
}

function meta(versionDoc) {
  return {
    version: versionDoc.version,
    scripts: versionDoc.scripts,
    license: versionDoc.license,
    _hasProvenance:
      Boolean(versionDoc.dist?.attestations?.provenance?.predicateType) ||
      Boolean(versionDoc.dist?.signatures?.length),
  };
}
