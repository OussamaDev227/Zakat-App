"""Category mapper for Excel categories to zakat ruleset codes."""
from typing import Dict, Optional, Tuple, Any
from app.models.financial_item import AssetType


# Mapping from Excel category strings (case-insensitive) to zakat classification
# Format: (category, asset_type, liability_code, equity_code, metadata)
CATEGORY_MAPPINGS: Dict[str, Tuple[str, Optional[AssetType], Optional[str], Optional[str], Dict]] = {
    # Assets
    "cash": ("ASSET", AssetType.CASH, None, None, {}),
    "cash and cash equivalents": ("ASSET", AssetType.CASH, None, None, {}),
    "bank balance": ("ASSET", AssetType.CASH, None, None, {}),
    "bank": ("ASSET", AssetType.CASH, None, None, {}),
    
    # Trading goods (merchandise) — zakatable
    "inventory": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),  # backward compat: default to trading goods
    "finished goods": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),
    "goods for resale": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),
    "trade goods": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),
    "trading goods": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),
    "merchandise": ("ASSET", AssetType.TRADING_GOODS, None, None, {}),
    # Production inventory (raw materials, WIP) — classified per framework
    "raw materials": ("ASSET", AssetType.PRODUCTION_INVENTORY, None, None, {}),
    "work in progress": ("ASSET", AssetType.PRODUCTION_INVENTORY, None, None, {}),
    "wip": ("ASSET", AssetType.PRODUCTION_INVENTORY, None, None, {}),
    "production inventory": ("ASSET", AssetType.PRODUCTION_INVENTORY, None, None, {}),
    "manufacturing stock": ("ASSET", AssetType.PRODUCTION_INVENTORY, None, None, {}),
    
    "receivable": ("ASSET", AssetType.RECEIVABLE, None, None, {"collectibility": "strong_debt"}),
    "accounts receivable": ("ASSET", AssetType.RECEIVABLE, None, None, {"collectibility": "strong_debt"}),
    "customer debts": ("ASSET", AssetType.RECEIVABLE, None, None, {"collectibility": "strong_debt"}),
    "trade receivables": ("ASSET", AssetType.RECEIVABLE, None, None, {"collectibility": "strong_debt"}),
    
    "fixed asset": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "fixed assets": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "property": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "equipment": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "machinery": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "vehicles": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    "buildings": ("ASSET", AssetType.FIXED_ASSET, None, None, {}),
    
    "intangible asset": ("ASSET", AssetType.INTANGIBLE_ASSET, None, None, {}),
    "intangible assets": ("ASSET", AssetType.INTANGIBLE_ASSET, None, None, {}),
    
    "long-term investment": ("ASSET", AssetType.LONG_TERM_INVESTMENT, None, None, {}),
    "long-term investments": ("ASSET", AssetType.LONG_TERM_INVESTMENT, None, None, {}),
    
    # Liabilities
    "liability": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "liabilities": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "supplier payable": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "supplier payables": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "payables": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "accounts payable": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "short-term liability": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "short-term liabilities": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "accrued expenses": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    "short-term loan": ("LIABILITY", None, "SHORT_TERM_LIABILITY", None, {}),
    
    "long-term loan": ("LIABILITY", None, "LONG_TERM_LIABILITY", None, {}),
    "long-term loans": ("LIABILITY", None, "LONG_TERM_LIABILITY", None, {}),
    "long-term liability": ("LIABILITY", None, "LONG_TERM_LIABILITY", None, {}),
    "long-term liabilities": ("LIABILITY", None, "LONG_TERM_LIABILITY", None, {}),
    "bonds": ("LIABILITY", None, "LONG_TERM_LIABILITY", None, {}),
    
    # Equity
    "capital": ("EQUITY", None, None, "PAID_IN_CAPITAL", {}),
    "share capital": ("EQUITY", None, None, "PAID_IN_CAPITAL", {}),
    "paid-in capital": ("EQUITY", None, None, "PAID_IN_CAPITAL", {}),
    "contributed capital": ("EQUITY", None, None, "PAID_IN_CAPITAL", {}),
    "capital stock": ("EQUITY", None, None, "PAID_IN_CAPITAL", {}),
    
    "retained earnings": ("EQUITY", None, None, "RETAINED_EARNINGS", {}),
    "retained profit": ("EQUITY", None, None, "RETAINED_EARNINGS", {}),
    "accumulated profit": ("EQUITY", None, None, "RETAINED_EARNINGS", {}),
    "reserves": ("EQUITY", None, None, "RETAINED_EARNINGS", {}),
}


def map_category_to_zakat_code(category: str) -> Dict[str, Any]:
    """
    Map Excel category string to zakat classification.
    
    Args:
        category: Excel category string (e.g., "Cash", "Inventory", "Liability")
        
    Returns:
        Dictionary with keys:
        - category: "ASSET", "LIABILITY", or "EQUITY"
        - asset_type: AssetType enum or None
        - liability_code: str or None
        - equity_code: str or None
        - metadata: dict with additional metadata (e.g., collectibility)
        - error: str or None (error message if mapping failed)
    """
    if not category:
        return {
            "category": None,
            "asset_type": None,
            "liability_code": None,
            "equity_code": None,
            "metadata": {},
            "error": "Category is empty"
        }
    
    # Normalize category string: lowercase, strip whitespace
    normalized = category.lower().strip()
    
    # Direct lookup
    if normalized in CATEGORY_MAPPINGS:
        cat, asset_type, liability_code, equity_code, metadata = CATEGORY_MAPPINGS[normalized]
        return {
            "category": cat,
            "asset_type": asset_type,
            "liability_code": liability_code,
            "equity_code": equity_code,
            "metadata": metadata.copy(),
            "error": None
        }
    
    # Try partial matching for common variations
    for key, value in CATEGORY_MAPPINGS.items():
        if key in normalized or normalized in key:
            cat, asset_type, liability_code, equity_code, metadata = value
            return {
                "category": cat,
                "asset_type": asset_type,
                "liability_code": liability_code,
                "equity_code": equity_code,
                "metadata": metadata.copy(),
                "error": None
            }
    
    # No match found
    return {
        "category": None,
        "asset_type": None,
        "liability_code": None,
        "equity_code": None,
        "metadata": {},
        "error": f"Unknown category: {category}. Please use one of: Cash, Inventory, Receivable, Liability, Long-term Loan, Capital, Retained Earnings"
    }
