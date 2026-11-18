#!/usr/bin/env node
// Brand check: fails when anything a person reads still says "Fleetbase" (or a transliteration).
//   node scripts/brand-check.mjs            checks sources (run by `pnpm lint:brand`, so `pnpm lint` and CI call it)
//   node scripts/brand-check.mjs --dist     also scans the built bundle in dist/ (run after `ember build`)
//
// 1. Merged translations: engines first, then host files (host + generated overrides), exactly the
//    order ember-intl uses, plus the en-us fallback for keys a locale lacks.
// 2. Host files with hard-coded text: app/**/*.hbs|js, index.html, site.webmanifest, ../docker-compose.yml.
// Allowed: see ALLOW_* in brand-rules.mjs (hosted routing to Fleetbase Cloud, the Fleetbase CLI) and
// ALLOW_FILES below. The legal notice / attribution is inside @fleetbase/ember-ui and is not scanned.
import fs from 'node:fs';
import path from 'node:path';
import { ALLOW_LEAF_KEYS, ALLOW_PHRASES, NAME_PATTERN, consoleDir, engineTranslations, flatten, hostDir, allLocales, listYaml, localeOf, overridesDir, readYaml } from './brand-rules.mjs';

// Files whose "Fleetbase" is Fleetbase's own content or a developer-only log line.
const ALLOW_FILES = new Set([
    'app/instance-initializers/initialize-widgets.js', // Fleetbase Blog / GitHub widgets show Fleetbase's own feed
    'app/components/fleetbase-blog.hbs',
    'app/utils/router-refresh-patch.js', // debug() log prefix
    'app/models/template-query.js', // PHP class names in comments
]);

const problems = [];
const hits = (text, capitalOnly = false) => {
    let t = String(text);
    ALLOW_PHRASES.forEach((re) => (t = t.replace(re, '')));
    return (t.match(NAME_PATTERN) || []).some((m) => !capitalOnly || m !== m.toLowerCase() || !/^fleetbase$/.test(m));
};

// 1. merged translations
const engines = engineTranslations();
const readDir = (dir, locale) =>
    listYaml(dir)
        .filter((f) => localeOf(f) === locale)
        .map((f) => flatten(readYaml(path.join(dir, f))));
const merged = {};
for (const locale of allLocales()) {
    merged[locale] = Object.assign({}, ...(engines[locale] || []).map((e) => e.flat), ...readDir(overridesDir, locale), ...readDir(hostDir, locale));
}
const en = merged['en-us'];
for (const [locale, flat] of Object.entries(merged)) {
    for (const [key, value] of Object.entries({ ...en, ...flat })) {
        if (!ALLOW_LEAF_KEYS.has(key.split('.').at(-1)) && hits(value)) problems.push(`translation [${locale}] ${key}: ${String(value).slice(0, 90)}`);
    }
}

// 2. hard-coded host text
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const generated = [path.join(consoleDir, 'app/router.js'), path.join(consoleDir, 'app/extensions')];
const files = [
    ...walk(path.join(consoleDir, 'app')).filter((f) => /\.(hbs|js|html)$/.test(f) && !generated.some((g) => f.startsWith(g))),
    path.join(consoleDir, 'public/favicon/site.webmanifest'),
];
for (const file of files) {
    const rel = path.relative(consoleDir, file);
    if (ALLOW_FILES.has(rel)) continue;
    fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*|\{\{!)/.test(line)) return; // comments are not shown to people
            // code uses lowercase identifiers (authenticator:fleetbase); only the capitalised name is text
            if (hits(line, true)) problems.push(`${rel}:${i + 1}: ${line.trim().slice(0, 90)}`);
        });
}
fs.readFileSync(path.join(consoleDir, '../docker-compose.yml'), 'utf8')
    .split('\n')
    .forEach((line, i) => {
        if (/^\s*(APP_NAME|MAIL_FROM_NAME):/.test(line) && hits(line)) problems.push(`docker-compose.yml:${i + 1}: ${line.trim()}`);
    });

// 3. built bundle (optional): the merged translations ember-intl bundles into dist/assets/vendor.js
if (process.argv.includes('--dist')) {
    const vendor = path.join(consoleDir, 'dist/assets/vendor.js');
    if (!fs.existsSync(vendor)) problems.push('dist/assets/vendor.js not found: run `pnpm build` first');
    else {
        const text = fs.readFileSync(vendor, 'utf8');
        const start = text.indexOf('define("ember-intl/translations"');
        const body = text.slice(start, text.indexOf(';define(', start + 10));
        let seen = 0;
        for (const m of body.matchAll(/"([^"\\]+)":"((?:[^"\\]|\\.)*)"/g)) {
            seen++;
            if (!ALLOW_LEAF_KEYS.has(m[1].split('.').at(-1)) && hits(m[2])) problems.push(`dist translation ${m[1]}: ${m[2].slice(0, 90)}`);
        }
        if (start < 0 || seen < 1000) problems.push(`dist: expected the ember-intl translations bundle, read ${seen} strings`);
        else console.log(`dist: scanned ${seen} bundled translation strings`);
    }
}

if (problems.length) {
    console.error(`brand check FAILED: ${problems.length} place(s) still say Fleetbase\n` + problems.map((p) => `  ${p}`).join('\n'));
    console.error('\nFix: host text in translations/<locale>.yaml; engine text with `node scripts/brand-overrides.mjs`.');
    process.exit(1);
}
console.log(`brand check ok: ${Object.keys(merged).length} locales, ${files.length} host files`);
