"""Financial item validation: duplicate detection (exact, normalized, optional fuzzy)."""

import re
import unicodedata
from dataclasses import dataclass
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.financial_item import FinancialItem


def normalize_item_name(name: str) -> str:
    """
    Normalize item name for comparison: strip, lowercase, remove symbols, normalize unicode.
    Used for duplicate detection (normalized match).
    """
    if not name or not isinstance(name, str):
        return ""
    # Normalize unicode (e.g. different representations of Arabic)
    s = unicodedata.normalize("NFKC", name.strip())
    # Lowercase for case-insensitive comparison
    s = s.lower()
    # Remove common punctuation/symbols; keep letters, numbers, spaces
    s = re.sub(r"[^\w\s]", "", s, flags=re.UNICODE)
    # Collapse multiple spaces
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _similarity_ratio(a: str, b: str) -> float:
    """Return similarity ratio between two strings (0..1) using SequenceMatcher."""
    if not a or not b:
        return 0.0
    from difflib import SequenceMatcher
    return SequenceMatcher(None, a, b).ratio()


@dataclass
class DuplicateCheckResult:
    """Result of duplicate check for a financial item name within a company."""
    is_duplicate: bool
    exact_match_id: Optional[int] = None
    normalized_match_id: Optional[int] = None
    similar_match_ids: Optional[List[int]] = None
    message: Optional[str] = None

    def to_http_detail(self) -> dict:
        """Detail suitable for HTTP 409 response."""
        out = {"message": self.message or "Duplicate or similar financial item detected"}
        if self.exact_match_id is not None:
            out["exact_match_id"] = self.exact_match_id
        if self.normalized_match_id is not None:
            out["normalized_match_id"] = self.normalized_match_id
        if self.similar_match_ids:
            out["similar_match_ids"] = self.similar_match_ids
        return out


def find_duplicate_financial_items(
    db: Session,
    company_id: int,
    name: str,
    exclude_item_id: Optional[int] = None,
    *,
    use_fuzzy: bool = True,
    fuzzy_threshold: float = 0.85,
) -> DuplicateCheckResult:
    """
    Detect duplicated financial items within the same company using:
    - Exact name match
    - Normalized name match (trim, lowercase, remove symbols)
    - Optional fuzzy matching (similar names above threshold)

    Returns DuplicateCheckResult with match ids and message.
    exclude_item_id: when updating an item, exclude that item from duplicate check.
    """
    if not name or not name.strip():
        return DuplicateCheckResult(is_duplicate=False)

    name_stripped = name.strip()
    name_normalized = normalize_item_name(name_stripped)

    query = db.query(FinancialItem).filter(FinancialItem.company_id == company_id)
    if exclude_item_id is not None:
        query = query.filter(FinancialItem.id != exclude_item_id)
    existing = query.all()

    exact_match_id: Optional[int] = None
    normalized_match_id: Optional[int] = None
    similar_match_ids: List[int] = []

    for item in existing:
        if item.name and item.name.strip() == name_stripped:
            exact_match_id = item.id
            break

    if not exact_match_id:
        for item in existing:
            if item.name and normalize_item_name(item.name) == name_normalized:
                normalized_match_id = item.id
                break

    if use_fuzzy and not exact_match_id and not normalized_match_id:
        for item in existing:
            if not item.name:
                continue
            norm = normalize_item_name(item.name)
            if norm and _similarity_ratio(name_normalized, norm) >= fuzzy_threshold:
                similar_match_ids.append(item.id)

    is_dup = exact_match_id is not None or normalized_match_id is not None
    if exact_match_id is not None:
        msg = "A financial item with the same name already exists for this company. Consider merging or using a different name."
    elif normalized_match_id is not None:
        msg = "A financial item with a very similar name (after normalizing) already exists. Consider merging or using a distinct name."
    elif similar_match_ids:
        msg = "Similar item names already exist for this company. Please use a distinct name or merge with an existing item."
        is_dup = True  # Treat fuzzy as duplicate for "prevent" behavior; client can suggest merge
    else:
        msg = None

    return DuplicateCheckResult(
        is_duplicate=is_dup,
        exact_match_id=exact_match_id,
        normalized_match_id=normalized_match_id,
        similar_match_ids=similar_match_ids if similar_match_ids else None,
        message=msg,
    )
