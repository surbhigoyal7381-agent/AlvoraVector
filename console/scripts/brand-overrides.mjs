#!/usr/bin/env node
// Generates console/translations/brand-overrides/<locale>.yaml for every locale ember-intl will bundle.
//
// Why: Fleetbase engines (fleetops, iam, dev, storefront ...) ship their own translations that say
// "Fleetbase". ember-intl lets the host app win over engines, so for every engine value that names
// Fleetbase we write the same key here with "Alvora Vector". Nothing under node_modules is edited.
//
// Usage (Node 22, from console/):   pnpm brand:overrides
// Re-run after every `pnpm install` that changes an @fleetbase package (each upstream upgrade),
// then commit the changed files. `pnpm lint:brand` fails when the committed files differ from what
// this script would write now (new, changed or removed upstream text).
// Hand-written host strings live in translations/<locale>.yaml and are never touched by this script;
// a key the host already defines is skipped so host text always wins.
// Wording fixes (articles, elision) live in polish() in brand-rules.mjs, not in the generated files.
import fs from 'node:fs';
import path from 'node:path';
import { buildOverrides, overridesDir } from './brand-rules.mjs';

const files = buildOverrides();
fs.rmSync(overridesDir, { recursive: true, force: true });
fs.mkdirSync(overridesDir, { recursive: true });
let total = 0;
for (const [locale, text] of Object.entries(files)) {
    fs.writeFileSync(path.join(overridesDir, `${locale}.yaml`), text);
    const n = (text.match(/^\s*[\w-]+: /gm) || []).length;
    total += n;
    console.log(`${locale}: ~${n} lines`);
}
console.log(`${Object.keys(files).length} files written`);
