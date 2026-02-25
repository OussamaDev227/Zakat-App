# Fix "Not Found" for Direct Links (SPA Routing on Render)

When you share a link like `https://zakat-app-1.onrender.com/login` or `https://zakat-app-1.onrender.com/companies`, visitors see **Not Found** because the server looks for a file at that path. The app is a **Single Page Application (SPA)**: all routes (`/login`, `/companies`, etc.) are handled by React Router in the browser, so the server must serve `index.html` for those paths and let the frontend handle routing.

## Fix: Add a Rewrite Rule on Render

1. Open the [Render Dashboard](https://dashboard.render.com/).
2. Select your **static site** (the frontend service, e.g. `zakat-app-1`).
3. Go to the **Redirects/Rewrites** tab.
4. Add a **Rewrite** rule (not Redirect):
   - **Source Path:** `/*`
   - **Destination Path:** `/index.html`
   - **Action:** **Rewrite**
5. Save. Redeploy if needed.

Render will then serve `index.html` for any path that doesn’t match a real file (e.g. `/login`, `/companies`), so React Router can handle the route and the shared link will work.

| Source   | Destination   | Action   | Effect                          |
|----------|----------------|----------|----------------------------------|
| `/*`     | `/index.html`  | Rewrite  | All non-file paths → index.html |

**Why Rewrite and not Redirect?**  
Redirect would change the URL in the address bar. Rewrite keeps the URL (e.g. `/companies`) and serves the content of `index.html`, so the user stays on the correct page and the SPA can route correctly.
