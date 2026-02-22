# Embed Bundle — CSS Injection Fix + Deploy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the embed bundle so Tailwind CSS is injected into the Shadow DOM, then build and deploy `embed.js` to Vercel so the calculator can be embedded in any website via a single `<script>` tag.

**Architecture:** `src/embed.tsx` uses a `__INLINE_CSS__` build-time global that is currently set to an empty string in `vite.config.ts`. The fix replaces this with a direct `import cssText from './index.css?inline'` in `embed.tsx` — Vite resolves `?inline` imports as a plain string containing the compiled CSS. That string is injected into the Shadow DOM `<style>` element at runtime. The `define: { __INLINE_CSS__ }` override in `vite.config.ts` is no longer needed and is removed.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3. No new dependencies. Node 22 required.

---

## Tier Reference — what the embed build produces

| Artifact | Path | Loaded by |
|---|---|---|
| SPA (main app) | `dist/index.html` + assets | `https://wrapcostcalculator.vercel.app/` |
| Embed bundle | `dist/embed.js` | `<script src=".../embed.js">` on any site |

`emptyOutDir: false` in `vite.config.ts` keeps both builds coexisting in `dist/`.

---

### Task 1: Fix CSS injection in `src/embed.tsx`

**Files:**
- Modify: `src/embed.tsx` (lines 1–19)

**What's wrong:** Lines 12–19 use a `__INLINE_CSS__` global that `vite.config.ts` sets to an empty string `''`. Shadow DOM gets no styles — Tailwind classes have no effect.

**Step 1: Add the `?inline` CSS import at the top of the file**

Open `src/embed.tsx`. After the existing React/component imports (lines 5–8), add this import as the **last import line** (before any non-import code):

```typescript
import cssText from './index.css?inline';
```

The `?inline` suffix tells Vite to resolve this as a `string` containing the full compiled CSS, not as a side-effect style injection.

**Step 2: Replace the `__INLINE_CSS__` block with the imported constant**

Remove lines 11–19 (the comment + try/catch block):

```typescript
// CSS is injected as inline string for Shadow DOM isolation (via Vite ?inline)
// In embed mode, Tailwind CSS will be injected at runtime
let inlineCss = '';
try {
  // This is replaced at build time with the actual CSS string
  // @ts-expect-error — populated by Vite build
  inlineCss = __INLINE_CSS__ ?? '';
} catch {
  // Fallback: no inline CSS (styles from CDN or parent page)
}
```

Replace with:

```typescript
const inlineCss = cssText;
```

After the fix the top of `src/embed.tsx` should look exactly like this:

```typescript
// Embed entry point — registers <wrap-calculator> as a Web Component
// Built as IIFE bundle by `vite build --mode embed`
// Usage: <script src="embed.js" data-mode="inline" data-container="#my-div"></script>

import { createRoot } from 'react-dom/client';
import { WizardProvider } from './context/WizardContext';
import { WizardShell } from './components/WizardShell';
import type { EmbedConfig } from './types';
import cssText from './index.css?inline';

const inlineCss = cssText;
```

Everything below line 21 (the `class WrapCalculatorWidget` definition onward) stays **unchanged**.

**Step 3: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```

Expected: one error — `Cannot find module './index.css?inline' or its corresponding type declarations`. This is expected — TypeScript doesn't know about `?inline` CSS modules yet. It will be fixed in Task 2.

**Step 4: Commit the embed.tsx change**

```bash
git add src/embed.tsx
git commit -m "feat: inject Tailwind CSS into Shadow DOM via ?inline import"
```

---

### Task 2: Fix TypeScript to recognise `?inline` CSS imports

**Files:**
- Create: `src/vite-env.d.ts` (or modify if it already exists)

**Why:** TypeScript doesn't natively know that `import foo from './file.css?inline'` resolves to a `string`. We need to declare a module type for this pattern.

**Step 1: Check if `src/vite-env.d.ts` already exists**

```bash
ls /Users/slavic/Documents/projects/wrapcostcalculator/src/vite-env.d.ts 2>&1
```

**Step 2a: If the file does NOT exist — create it**

Create `src/vite-env.d.ts` with this exact content:

```typescript
/// <reference types="vite/client" />

// Teach TypeScript that *.css?inline imports resolve to a string
declare module '*.css?inline' {
  const content: string;
  export default content;
}
```

**Step 2b: If the file DOES exist — append to it**

If `src/vite-env.d.ts` already exists, open it and add after any existing content:

```typescript
// Teach TypeScript that *.css?inline imports resolve to a string
declare module '*.css?inline' {
  const content: string;
  export default content;
}
```

**Step 3: TypeScript check — should now be clean**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/vite-env.d.ts
git commit -m "chore: add TypeScript declaration for *.css?inline imports"
```

---

### Task 3: Remove the now-redundant `define` override from `vite.config.ts`

**Files:**
- Modify: `vite.config.ts` (lines 10–13)

**Why:** The `define: { __INLINE_CSS__: JSON.stringify('') }` block was needed because `embed.tsx` used a build-time global. Now that `embed.tsx` uses a proper `?inline` import, this override is dead code and should be removed to avoid confusion.

**Step 1: Remove the `define` block from the embed config**

Open `vite.config.ts`. Find the embed mode block (lines 6–34). Remove the `define:` property entirely:

```diff
  if (mode === 'embed') {
    return {
      plugins: [react()],
-     define: {
-       // Embed build doesn't use inline CSS injection (simplified)
-       __INLINE_CSS__: JSON.stringify(''),
-     },
      build: {
```

After the change the embed config section should look like:

```typescript
  if (mode === 'embed') {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: 'src/embed.tsx',
          name: 'WrapCalculator',
          fileName: 'embed',
          formats: ['iife'],
        },
        rollupOptions: {
          external: [],
          output: {
            dir: 'dist',
            entryFileNames: 'embed.js',
          },
        },
        outDir: 'dist',
        emptyOutDir: false,
        minify: true,
      },
    };
  }
```

**Step 2: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```

Expected: no errors.

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "chore: remove redundant __INLINE_CSS__ define from embed vite config"
```

---

### Task 4: Build the embed bundle and verify it works locally

**Files:**
- No code changes — build and verify only

**Step 1: Build the SPA first (so dist/ has the main app)**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npm --prefix /Users/slavic/Documents/projects/wrapcostcalculator run build:app 2>&1
```

Expected: `✓ built in X.XXs` with no errors.

**Step 2: Build the embed bundle**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npm --prefix /Users/slavic/Documents/projects/wrapcostcalculator run build:embed 2>&1
```

Expected output (exact numbers vary):
```
vite v5.x.x building for embed...
✓ built in X.XXs
dist/embed.js  XXX kB │ gzip: XX kB
```

**Step 3: Verify `dist/embed.js` was created**

```bash
ls -lh /Users/slavic/Documents/projects/wrapcostcalculator/dist/embed.js 2>&1
```

Expected: file exists, size > 100KB (it bundles React + full app).

**Step 4: Check that the CSS is actually in the bundle**

```bash
grep -c "rounded-xl\|border-slate\|text-brand" /Users/slavic/Documents/projects/wrapcostcalculator/dist/embed.js 2>&1
```

Expected: a number > 0 (Tailwind class names are embedded in the JS as strings). This confirms CSS injection is wired up.

**Step 5: Serve and test locally**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx serve /Users/slavic/Documents/projects/wrapcostcalculator -l 4174 2>&1 &
```

Then open `http://localhost:4174/embed.html` in a browser.

Verify:
- The calculator renders inside the page
- Buttons are styled correctly (blue, rounded — NOT the red/yellow from the host page CSS)
- The wizard is interactive and steps advance correctly
- There are no console errors

**Step 6: Kill the local server**

```bash
pkill -f "npx serve" 2>&1 || true
```

---

### Task 5: Deploy to Vercel and verify live embed URL

**Step 1: Full production build**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npm --prefix /Users/slavic/Documents/projects/wrapcostcalculator run build 2>&1
```

This runs `tsc -b && vite build && vite build --mode embed` (both SPA and embed in one command).

Expected: two sequential builds complete with no errors.

**Step 2: Deploy**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && vercel --prod 2>&1
```

Expected: deployment completes, aliased to `https://wrapcostcalculator.vercel.app`.

**Step 3: Verify embed.js is accessible**

```bash
curl -I https://wrapcostcalculator.vercel.app/embed.js 2>&1
```

Expected: `HTTP/2 200` with `Content-Type: application/javascript`.

**Step 4: Confirm CSS is in the live bundle**

```bash
curl -s https://wrapcostcalculator.vercel.app/embed.js | grep -c "rounded-xl" 2>&1
```

Expected: number > 0.

---

## Verification

After deployment, provide this WordPress snippet to the user:

```html
<!-- Wrap Cost Calculator -->
<div id="wrap-calc"></div>
<script
  src="https://wrapcostcalculator.vercel.app/embed.js"
  data-mode="inline"
  data-container="#wrap-calc"
></script>
```

Manual test checklist:
1. Open `https://wrapcostcalculator.vercel.app` — confirm main SPA still works
2. Open `https://wrapcostcalculator.vercel.app/embed.js` — confirm file loads (not 404)
3. Paste the WordPress snippet into a plain HTML file with conflicting CSS — confirm widget renders correctly and is style-isolated
4. Complete the full wizard flow (Steps 1–5) inside the embedded widget — confirm no errors
5. Try modal mode: add `data-mode="modal"` to the script tag — confirm a floating "Get a Wrap Quote" button appears, clicking it opens the calculator in an overlay
