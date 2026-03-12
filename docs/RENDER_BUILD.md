# Render Build Settings (Frontend)

Use these settings so the frontend builds correctly on Render (Linux).

## Build command

Set the **Build Command** to:

```bash
yarn build
```

**Do not use** `npm install && npm run build`. Render already installs dependencies with **Yarn** (see Install Command). Running `npm install` afterward changes `node_modules` (e.g. removes optional platform binaries), which leads to:

- `@esbuild/linux-x64` could not be found
- or similar missing optional dependency errors

Using `yarn build` keeps the install that Yarn did and builds with the correct Linux binaries.

## Install command

Leave the default **Install Command** as:

```bash
yarn install
```

(Or leave it empty so Render uses Yarn when it detects `yarn.lock`.)

## Optional: Remove mixed lockfile warning

The repo has both `yarn.lock` and `package-lock.json` in `frontend/`. To avoid the “do not mix package managers” warning and keep one source of truth, you can delete `frontend/package-lock.json` and use only Yarn for the frontend.
