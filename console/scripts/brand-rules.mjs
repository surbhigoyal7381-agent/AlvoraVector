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
export const ALLOW_LEAF_KEYS = new Set(['hosted-routing-label', 'hosted-routing-help-text']);
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

// Replacement for a value, or null when nothing to change.
export function rebrand(key, value) {
    if (typeof value !== 'string' || ALLOW_LEAF_KEYS.has(key.split('.').at(-1))) return null;
    const kept = [];
    let masked = value;
    ALLOW_PHRASES.forEach((re) => (masked = masked.replace(re, (m) => `\u0000${kept.push(m) - 1}\u0000`)));
    const next = masked.replace(NAME_PATTERN, NAME).replace(/\u0000(\d+)\u0000/g, (_, i) => kept[i]);
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
