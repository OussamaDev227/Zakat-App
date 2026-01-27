# Corporate Zakat Calculation System

Backend API for corporate zakat calculation based on fiqh-accounting rules.

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Alembic (migrations)
- Pydantic

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zakat_db
RULES_PATH=./zakat_rules_full_v1.json
```

### 3. Database Setup

```bash
# Run migrations
alembic upgrade head
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Companies

- `POST /companies` - Create a company

### Financial Items

- `POST /financial-items` - Create a financial item

### Zakat Calculation

- `POST /zakat/calculate/{company_id}` - Calculate zakat for a company

## Example Requests

### Create Company

```json
{
  "name": "شركة المثال",
  "legal_type": "LLC",
  "fiscal_year_start": "2024-01-01",
  "fiscal_year_end": "2024-12-31"
}
```

### Create Financial Item (Asset)

```json
{
  "company_id": 1,
  "name": "النقدية في البنك",
  "category": "ASSET",
  "asset_code": "CASH",
  "amount": 100000.00,
  "metadata": {}
}
```

### Create Financial Item (Liability)

```json
{
  "company_id": 1,
  "name": "دائنين تجاريين",
  "category": "LIABILITY",
  "liability_code": "SHORT_TERM_LIABILITY",
  "amount": 20000.00,
  "metadata": {}
}
```

### Calculate Zakat

```bash
POST /zakat/calculate/1
```

Response:

```json
{
  "zakat_base": 80000.00,
  "zakat_amount": 2000.00,
  "items": [
    {
      "item_name": "النقدية في البنك",
      "included": true,
      "included_amount": 100000.00,
      "explanation_ar": "النقدية تمثل ثروة كاملة جاهزة للنمو"
    }
  ],
  "direction": "rtl"
}
```

## Notes

- All rule explanations are returned in Arabic (`explanation_ar`)
- The system applies pre-defined rules from `zakat_rules_full_v1.json`
- No AI inference or rule modification is performed
- **Important**: Rules JSON must include Arabic fields (`reason_ar`) for all explanations. The app will fail to start if any Arabic explanations are missing.

## Architecture

- **Models**: SQLAlchemy ORM models with proper relationships and constraints
- **Rules Engine**: Deterministic rule application (no inference, only pre-defined rules)
- **Service Layer**: Business logic separation (zakat calculation orchestration)
- **API Layer**: FastAPI endpoints with proper validation and error handling
- **Migrations**: Alembic for database schema management

## Development

The backend follows clean architecture principles:
- `app/models/`: Database models
- `app/schemas/`: Pydantic request/response models
- `app/rules/`: Rule schemas and engine
- `app/services/`: Business logic
- `app/api/`: API routes
