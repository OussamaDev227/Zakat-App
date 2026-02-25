# Frontend - Corporate Zakat Calculation System

Decision Support System frontend for corporate zakat calculation.

## Tech Stack

- React 18
- Vite
- React Router
- Tailwind CSS
- JavaScript (ES6+)

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=https://zakat-app-y6su.onrender.com/
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Deployment (Render) – SPA routing

If you deploy the frontend as a **static site** on Render, direct links like `/login` or `/companies` will show "Not Found" until you add a **rewrite** so the server serves `index.html` for those paths. See [RENDER_SPA_ROUTING.md](../docs/RENDER_SPA_ROUTING.md) for step-by-step instructions in the Render Dashboard.

## Architecture

### Decision Support System Principles

- **No Business Logic in Frontend**: All zakat rules and calculations are performed by the backend rule engine
- **Rule-Driven UI**: Dropdowns and classifications come from `GET /rules` endpoint
- **Display Only**: Frontend displays backend decisions (included amounts, explanations) without interpretation

### Folder Structure

```
src/
  api/          # API client functions (no business logic)
  contexts/     # React contexts (Rules, Company)
  pages/        # Page components
  components/   # Reusable UI components
  styles/       # Tailwind CSS styles
```

### Key Features

1. **Company Management**: CRUD operations for companies
2. **Financial Items**: CRUD with rule-driven dropdowns
3. **Zakat Calculation**: Calculate and view results with Arabic explanations
4. **History**: View past calculations and details

## RTL Support

The app is configured for RTL (Right-to-Left) layout:
- HTML `dir="rtl"` attribute
- Arabic font stack (Cairo, Tajawal)
- Right-aligned form fields
- RTL-aware Tailwind utilities

## Academic Notes

This is an academic MVP demonstrating:
- Clean separation between frontend (presentation) and backend (business logic)
- Rule-based decision support (no AI inference)
- Clear, explainable architecture suitable for graduation project documentation
