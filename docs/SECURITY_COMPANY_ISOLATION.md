# Company-Level Data Isolation – Security Model

## 1. Security Issues Found (Pre-Implementation)

| # | Issue | Severity | Description |
|---|--------|----------|-------------|
| 1 | **Client-controlled company_id** | Critical | All APIs trusted `company_id` from query, path, or body. A user could access any company's data by changing the ID. |
| 2 | **No backend session/auth** | Critical | No JWT or server session. Company "selection" was frontend state only; backend had no notion of "current company". |
| 3 | **IDOR on financial items** | Critical | `GET/PUT/DELETE /financial-items/{item_id}` did not verify item ownership. Any authenticated user could access any item by ID. |
| 4 | **IDOR on zakat calculations** | Critical | `GET/POST/DELETE` on calculations by `calculation_id` did not verify calculation belonged to the same company as the client. |
| 5 | **Full company list exposed** | High | `GET /companies` returned all companies (full details) to anyone. After login, users could enumerate all tenants. |
| 6 | **Companies CRUD without scope** | High | Create/Read/Update/Delete company by ID with no authorization; any user could modify any company. |
| 7 | **Excel upload by path company_id** | Critical | `POST /zakat/excel/upload/{company_id}` used client-supplied company_id; could upload into any company. |
| 8 | **No company-level authentication** | Critical | Selecting a company required no password; switching companies was a dropdown with no re-authentication. |
| 9 | **Route guard only for app login** | Medium | ProtectedRoute only checked app login; no guard for "company session". User could open /financial-items without a selected company or with manipulated state. |

---

## 2. Company Isolation Model (Post-Implementation)

### 2.1 Principles

- **One company per session**: Each session is bound to exactly one `company_id` (stored in JWT). No endpoint accepts client-sent `company_id` for data access.
- **Backend-only derivation**: `company_id` is taken only from the verified JWT (or server session). Request body, query, and path parameters must not override it for scoping.
- **Company password**: Each company has a stored hash (`company_password_hash`). To "enter" a company, the user must supply the company password; backend verifies and then issues a JWT containing that `company_id`.
- **Switch = re-auth**: Switching company requires entering the target company's password again; previous company session is cleared.

### 2.2 Flow

1. **App login** (existing): User logs in to the application (e.g. static credentials for demo). No company context yet.
2. **Company selection**: User sees a list of company names (minimal: id + name only). No sensitive company data is returned.
3. **Company authentication**: User selects a company and is prompted for that company's password. Backend verifies against `company_password_hash`, then issues a JWT containing `company_id` (and expiry). Frontend stores the token and sends it on every API request.
4. **Data access**: All data APIs (financial items, zakat, excel upload, company details for current company) use a dependency that reads `company_id` from the JWT. Queries are filtered by this ID; any attempt to access another company's resource (e.g. by item id or calculation id) is rejected if the resource's `company_id` does not match.
5. **Switch company**: User clicks "Switch Company", current token is discarded, and they must select another company and enter that company's password to get a new JWT.

### 2.3 What Is Not Exposed After Company Login

- Full list of all companies is not returned after a company session is active. The "list" for switch is minimal (id + name) and only used to choose the next company; switching still requires that company's password.
- No API returns data for a company other than the one in the JWT.

### 2.4 Multi-Tenancy Analogy

Treat each company as a tenant. The JWT is the "tenant context." All reads/writes are scoped to that tenant. No cross-tenant queries; no trusting client-supplied tenant id for access control.

---

## 3. Backend Changes Summary

- **Auth module**: JWT creation/validation; dependency `get_current_company_id()`; optional `get_current_company_id_optional()` for routes that work with or without company (e.g. list companies for selection).
- **Company password**: New column `company_password_hash`; bcrypt (or equivalent) on set; verify on company select.
- **Endpoints**:
  - `POST /auth/company/select`: body `{ company_id, password }` → verify password, return JWT + company info.
  - `GET /auth/company/current`: return current company (from JWT).
  - `GET /companies`: without company JWT → minimal list (id, name). With company JWT → can return only current company for "manage" view (or keep minimal for switch dropdown).
  - `GET /companies/current`: with JWT → full current company.
  - `GET/PUT/DELETE /companies/{id}`: require JWT and `id == JWT.company_id`.
  - `POST /companies`: allowed without company JWT (first-time setup); response minimal or full per policy.
- **Financial items**: Create uses JWT company_id (ignore body company_id). List/Get/Update/Delete all scoped or checked by JWT company_id.
- **Zakat**: Start/list use JWT company_id; all calculation operations validate calculation.company_id == JWT.company_id.
- **Excel upload**: Remove company_id from path; use JWT company_id.

---

## 4. Frontend Changes Summary

- **Company session context**: Store JWT and current company `{ id, name }`; clear on logout or switch.
- **API client**: Send `Authorization: Bearer <token>` for all requests that require company scope; do not send `company_id` for data APIs (backend derives it).
- **Companies page**: When no company session → show minimal list + "Select & enter password" flow. When session exists → show current company name, "Switch Company" (password modal), and manage only current company (edit/delete).
- **Route guard**: Add company-session guard for /financial-items, /zakat, /history, /history/:id. Redirect to /companies if no company session.
- **Hide company selector**: Replace free dropdown with "Switch Company" button that always requires password.

---

## 5. Database Migration

- Add `company_password_hash` (nullable String) to `companies`.
- Backfill existing rows with a default hash (e.g. bcrypt of a temporary password). Optional: force password change on first login (not implemented in initial deliverable).

---

## 6. Files Touched (Summary)

- **Backend**: `app/core/config.py`, `app/models/company.py`, `app/schemas/company.py`, `app/schemas/financial_item.py`, new `app/core/security.py`, new `app/api/routes/auth.py`, `app/api/routes/companies.py`, `app/api/routes/financial_items.py`, `app/api/routes/zakat.py`, `app/api/routes/excel_upload.py`, `app/main.py`, `alembic/versions/add_company_password_hash.py`.
- **Frontend**: `contexts/CompanyContext.jsx`, `api/authStore.js`, `api/auth.js`, `components/CompanyPasswordModal.jsx`, `components/CompanyRouteGuard.jsx`, `Layout.jsx`, `CompaniesPage.jsx`, `api/client.js`, `api/companies.js`, `api/financialItems.js`, `api/zakat.js`, `api/excelUpload.js`, `App.jsx`, `FinancialItemsPage.jsx`, `ZakatPage.jsx`, `ZakatHistoryPage.jsx`, `ExcelUploadForm.jsx`, `CompanyForm.jsx`. `CompanySelector.jsx` is no longer used on company-scoped pages (replaced by "Switch Company" and password flow).

## 7. Environment

- Set `SECRET_KEY` in production (e.g. in `.env`). Used for JWT signing.
- After running the migration, existing companies get a default company password (temporary): `ChangeMe123`. Change per company via "Edit company" and setting a new password.

## 8. Testing

- Integration/API tests that call company-scoped endpoints must send `Authorization: Bearer <token>` with a valid company JWT. Create a company, set password, call `POST /auth/company/select` to get a token, then use it for `/financial-items`, `/zakat/*`, etc.
