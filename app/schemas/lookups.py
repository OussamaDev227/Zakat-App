"""Lookups API response schemas."""
from pydantic import BaseModel
from typing import List


class AssetTypeLookup(BaseModel):
    """Asset type lookup item for dropdowns."""
    code: str
    label_ar: str
    zakatable_default: bool


class AssetTypesResponse(BaseModel):
    """Response for GET /lookups/asset-types endpoint."""
    asset_types: List[AssetTypeLookup]
