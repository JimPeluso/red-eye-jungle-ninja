// ESLint setup.
// The game files in js/ are classic scripts that share ONE global scope and load in order (CLAUDE.md section 3).
// So each game file's allowed globals are generated from the top-level names declared by the *other* game files:
//  - no-undef catches typos and names that don't exist anywhere,
//  - no-redeclare catches the same top-level name declared in two files (a SyntaxError that blanks the game),
//  - no-global-assign catches assigning to another file's const.
// Nothing to keep up to date by hand: add a file or a name and the lists follow.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import js from '@eslint/js';
import globals from 'globals';
import * as espree from 'espree';

const ECMA = 2022;
const root = import.meta.dirname;
const gameFiles = readdirSync(path.join(root, 'js'))
  .filter(f => f.endsWith('.js'))
  .map(f => `js/${f}`);

/** Top-level names a classic script declares, as { name: 'readonly' | 'writable' }. */
function topLevelNames(file) {
  const ast = espree.parse(readFileSync(path.join(root, file), 'utf8'), { ecmaVersion: ECMA, sourceType: 'script' });
  const out = {};
  const add = (node, kind) => {
    if (!node) return;
    if (node.type === 'Identifier') out[node.name] = kind;
    else if (node.type === 'ObjectPattern') node.properties.forEach(p => add(p.type === 'RestElement' ? p.argument : p.value, kind));
    else if (node.type === 'ArrayPattern') node.elements.forEach(e => add(e, kind));
    else if (node.type === 'AssignmentPattern') add(node.left, kind);
    else if (node.type === 'RestElement') add(node.argument, kind);
  };
  for (const n of ast.body) {
    if (n.type === 'VariableDeclaration') n.declarations.forEach(d => add(d.id, n.kind === 'const' ? 'readonly' : 'writable'));
    else if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') && n.id) out[n.id.name] = 'writable';
  }
  return out;
}

const declared = Object.fromEntries(gameFiles.map(f => [f, topLevelNames(f)]));
const declaredByOthers = file => Object.assign({}, ...gameFiles.filter(f => f !== file).map(f => declared[f]));

export default [
  { ignores: ['node_modules/', 'tests/shots/', 'test-results/', 'playwright-report/', '_site/', 'fonts/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: ECMA, sourceType: 'script', globals: { ...globals.browser } },
    rules: {
      // Top-level names are used by other files, so only check unused names inside functions.
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-redeclare': ['error', { builtinGlobals: true }],
    },
  },
  ...gameFiles.map(f => ({ files: [f], languageOptions: { globals: declaredByOthers(f) } })),
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // page.evaluate() callbacks run in the browser and use the ?test hook (window.__t).
      globals: { ...globals.node, ...globals.browser, __t: 'readonly' },
    },
  },
];
