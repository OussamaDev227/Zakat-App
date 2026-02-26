# Domain Correction: Inventories vs Trading Goods

## Summary

The system previously used a single rule/category for both **inventories** and **trading goods (merchandise)**. Under Zakat accounting standards and the doctoral framework for corporate Zakat accounting, these must be modeled and classified separately because their Zakat treatment can differ by purpose and nature.

## Domain Model Correction

### Two distinct financial item types (asset subtypes)

| Type | Code | Meaning | Zakat treatment |
|------|------|---------|-----------------|
| **Trading goods** | `TRADING_GOODS` | Goods held for resale / merchandise (عروض التجارة) | **Zakatable** — included in base at market value. |
| **Production inventory** | `PRODUCTION_INVENTORY` | Raw materials, WIP, manufacturing stock (المخزون الإنتاجي) | **Classified per framework** — not automatically zakatable; may differ by school/policy. |

They are conceptually distinct and must not be merged again.

## Changes Implemented

### 1. Domain model (backend)

- **`app/models/financial_item.py`**  
  - Replaced `AssetType.INVENTORY` with:
    - `AssetType.TRADING_GOODS`
    - `AssetType.PRODUCTION_INVENTORY`

### 2. Rule engine and rules JSON

- **`zakat_rules_full_v1.json`**
  - **Assets:** Removed single `INVENTORY` asset; added:
    - `TRADING_GOODS`: zakatable, included in base, condition `intended_for_sale`.
    - `PRODUCTION_INVENTORY`: not zakatable by default, not in base; framework-specific.
  - **Valuation rules:** Replaced `inventory` with `trading_goods` and `production_inventory` (both `market_value` in the file).
  - **Intention override:** `fixed_asset_for_trade` and `investment_for_trading` now use `override_to: "TRADING_GOODS"` (was `INVENTORY`).

- **`app/rules/schemas.py`**  
  - `ValuationRules`: `inventory` replaced by `trading_goods` and `production_inventory`.

### 3. Database migration

- **`alembic/versions/split_inventory_to_trading_goods_and_production.py`**
  - Adds enum values `TRADING_GOODS` and `PRODUCTION_INVENTORY` to `assettype` (using autocommit for `ADD VALUE`).
  - Data migration: all existing rows with `asset_type = 'INVENTORY'` are set to `'TRADING_GOODS'` (conservative default; users can reclassify to production inventory if needed).

**Run after pull:**

```bash
alembic upgrade head
```

### 4. API and validation

- **`app/schemas/financial_item.py`**  
  - Create/Update schemas: `asset_type` accepts `TRADING_GOODS` and `PRODUCTION_INVENTORY`.  
  - Backward compatibility: if the client sends `"INVENTORY"`, it is coerced to `TRADING_GOODS`.

- **`app/api/routes/lookups.py`**  
  - `/lookups/asset-types` returns the new asset types with correct labels and `zakatable_default`.

- **`app/services/category_mapper.py`**  
  - Excel/import mapping:
    - “inventory”, “finished goods”, “goods for resale”, “trade goods”, “trading goods”, “merchandise” → `TRADING_GOODS`.
    - “raw materials”, “work in progress”, “wip”, “production inventory”, “manufacturing stock” → `PRODUCTION_INVENTORY`.  
  - Legacy: “inventory” still maps to `TRADING_GOODS` so old imports keep working.

### 5. Frontend

- **Asset subtype dropdown**  
  - Fed by `/lookups/asset-types`; now shows **Trading Goods** and **Production Inventory** (and other asset types) with Arabic labels.

- **`frontend/src/utils/categoryMapper.js`**
  - Category options and mappings updated so that:
    - Assets → subtype options include: **Cash**, **Trading Goods**, **Production Inventory**, **Fixed Assets**, **Receivables**.
  - Excel/import: same semantic split (trading goods vs production inventory) and legacy “inventory” → Trading Goods.

- **`frontend/src/components/ExcelUploadForm.jsx`**  
  - Initial category code and zakatable logic use `TRADING_GOODS` / `PRODUCTION_INVENTORY`; legacy `INVENTORY` from API is shown as “Trading Goods”.

- **`frontend/src/utils/ruleCodeTranslations.js`**  
  - Arabic labels for `TRADING_GOODS`, `PRODUCTION_INVENTORY`, and legacy `INVENTORY` (displayed as trading goods label).

### 6. Backward compatibility

- **Existing data:** After migration, every former `INVENTORY` row becomes `TRADING_GOODS`; no rows remain as `INVENTORY` in the DB.
- **API input:** Request body with `asset_type: "INVENTORY"` is accepted and treated as `TRADING_GOODS`.
- **Display:** Any legacy rule or code still referring to `INVENTORY` (e.g. in results) is shown with the same Arabic label as trading goods.

## Rule summary

| Asset subtype         | Zakatable | In base | Notes                                      |
|----------------------|-----------|---------|--------------------------------------------|
| Cash                 | Yes       | Yes     | Nominal value.                             |
| **Trading goods**   | **Yes**   | **Yes** | Market value; condition: intended for sale. |
| **Production inventory** | **No** (default) | **No** | Per framework; not treated as trade goods by default. |
| Receivable           | Yes*      | Yes*    | *Subject to collectibility (strong/weak). |
| Fixed asset          | No        | No      | Unless intention override to trade.       |
| Intangible / LTI     | No        | No      | Unless intention override to trade.       |

This aligns the application with Zakat accounting principles and keeps inventories and trading goods as separate, non-mergeable categories.
