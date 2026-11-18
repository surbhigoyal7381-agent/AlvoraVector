// Shared rules for the Alvora Vector rebrand. Used by brand-overrides.mjs (generator)
// and brand-check.mjs (CI check). See ../../docs/product/branding/2026-11-18-implementation-notes.md.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const NAME = 'Alvora Vector';
export const consoleDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const hostDir = path.join(consoleDir, 'translations');
export const overridesDir = path.join(hostDir, 'brand-overrides');
export const engineRoot = path.join(consoleDir, 'node_modules', '@fleetbase');

// js-yaml is not a direct dependency; borrow the copy ember-intl itself uses to read the same files.
const intlRequire = createRequire(fs.realpathSync(path.join(consoleDir, 'node_modules', 'ember-intl', 'package.json')));
export const yaml = intlRequire('js-yaml');

// Names to replace: the Latin brand (any case) and the transliterations found in the installed engines.
// A hyphen suffix on a capitalised name (German "Fleetbase-Konto") is replaced; fleetbase-xyz is kept.
// Not replaced: URLs/packages (fleetbase.io, @fleetbase/x, fleetbase/x) and Mongolian "Флит" (= "fleet").
const TRANSLITERATIONS = ['فلینتباس', 'فلينتباس', 'فليتباس', 'فليتباز', 'فلیت‌بیس'];
export const NAME_PATTERN = new RegExp(
    `(?<![@/\\w.-])(?:fleetbase|Fleetbase|FLEETBASE)(?![/\\w]|-[a-z]|\\.(?:io|com|dev|org)\\b)|${TRANSLITERATIONS.join('|')}`,
    'g'
);

// Text that names Fleetbase's own third-party services stays true and stays as is.
// Leaf keys: the hosted routing option sends data to Fleetbase Cloud (privacy text must stay accurate).
// - not-configured-message names the Fleetbase CLI, a real tool, in every language.
// - powered-by / preview-powered-by: the tracking-page toggle. The public page still renders ember-ui's
//   hard-coded "Powered by Fleetbase" (and its Legal link), so the toggle must say the same.
export const ALLOW_LEAF_KEYS = new Set(['hosted-routing-label', 'hosted-routing-help-text', 'not-configured-message', 'powered-by', 'preview-powered-by']);
export const ALLOW_PHRASES = [/Fleetbase Cloud/g, /Fleetbase CLI/g];

export function flatten(obj, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(obj || {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out[key] = v;
    }
    return out;
}

export function nest(flat) {
    const root = {};
    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let node = root;
        parts.slice(0, -1).forEach((p) => (node = node[p] ??= {}));
        node[parts.at(-1)] = value;
    }
    return root;
}

// Grammar fixes after the name went in (the name starts with a vowel and is not a word the sentence knew).
export function polish(locale, text) {
    let t = text.replace(/\b([Aa]) (Alvora Vector (?:account|user))/g, (_, a, rest) => `${a}n ${rest}`);
    if (locale === 'fr-fr') {
        const ap = t.includes('\u2019') ? '\u2019' : "'";
        t = t.replace(/\b(que|de) Alvora/g, (_, w) => `${w === 'que' ? 'qu' : 'd'}${ap}Alvora`);
    }
    if (locale === 'bg-bg') t = t.replace(/(?<!\p{L})([Вв])ъв Alvora/gu, '$1 Alvora');
    return t;
}

// Replacement for a value, or null when nothing to change.
export function rebrand(key, value, locale = '') {
    if (typeof value !== 'string' || ALLOW_LEAF_KEYS.has(key.split('.').at(-1))) return null;
    const kept = [];
    let masked = value;
    ALLOW_PHRASES.forEach((re) => (masked = masked.replace(re, (m) => `\u0000${kept.push(m) - 1}\u0000`)));
    const next = polish(locale, masked.replace(NAME_PATTERN, NAME).replace(/\u0000(\d+)\u0000/g, (_, i) => kept[i]));
    return next === value ? null : next;
}

export function localeOf(file) {
    return file.split('.')[0].toLowerCase();
}

export function readYaml(file) {
    return yaml.load(fs.readFileSync(file, 'utf8')) || {};
}

export function listYaml(dir) {
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)) : [];
}

// Engine translations per locale: { locale: [{ source, flat }] }
export function engineTranslations() {
    const out = {};
    for (const engine of fs.readdirSync(engineRoot).sort()) {
        const dir = path.join(engineRoot, engine, 'translations');
        for (const file of listYaml(dir)) {
            (out[localeOf(file)] ??= []).push({ source: `${engine}/${file}`, flat: flatten(readYaml(path.join(dir, file))) });
        }
    }
    return out;
}

// Every locale ember-intl will bundle: the host's own plus any an engine ships (e.g. fleetops has es-pa).
export function allLocales() {
    return [...new Set([...listYaml(hostDir).map(localeOf), ...Object.keys(engineTranslations())])].sort();
}

export function hostFile(locale) {
    const f = listYaml(hostDir).find((name) => localeOf(name) === locale);
    return f ? path.join(hostDir, f) : null;
}

// What brand-overrides.mjs writes: { locale: file text }. Pure, so the check can compare it with the committed files.
export const OVERRIDES_HEADER = '# GENERATED by scripts/brand-overrides.mjs. Do not edit; re-run the script after upstream upgrades.\n';
export function buildOverrides() {
    const engines = engineTranslations();
    const files = {};
    for (const locale of allLocales()) {
        const hostPath = hostFile(locale);
        const host = hostPath ? flatten(readYaml(hostPath)) : {};
        const out = {};
        for (const { flat } of engines[locale] || []) {
            for (const [key, value] of Object.entries(flat)) {
                const next = key in host ? null : rebrand(key, value, locale);
                if (next !== null) out[key] = next;
            }
        }
        const keys = Object.keys(out).sort();
        if (keys.length) files[locale] = OVERRIDES_HEADER + yaml.dump(nest(Object.fromEntries(keys.map((k) => [k, out[k]]))), { lineWidth: -1 });
    }
    return files;
}
