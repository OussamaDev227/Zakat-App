# Test script for Zakat Calculation API
# Run this in PowerShell after starting the server

$baseUrl = "http://localhost:8000"

Write-Host "=== Testing Corporate Zakat Calculation API ===" -ForegroundColor Green
Write-Host ""

# 1. Test Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "   Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# 2. Create a Company
Write-Host "2. Creating a Company..." -ForegroundColor Yellow
$companyData = @{
    name = "شركة المثال للتجارة"
    legal_type = "LLC"
    fiscal_year_start = "2024-01-01"
    fiscal_year_end = "2024-12-31"
} | ConvertTo-Json

$company = Invoke-RestMethod -Uri "$baseUrl/companies" -Method Post -Body $companyData -ContentType "application/json; charset=utf-8"
$companyId = $company.id
Write-Host "   Company created with ID: $companyId" -ForegroundColor Green
Write-Host "   Name: $($company.name)" -ForegroundColor Green
Write-Host ""

# 3. Add Financial Items (Assets)
Write-Host "3. Adding Financial Items (Assets)..." -ForegroundColor Yellow

# Cash Asset
$cashItem = @{
    company_id = $companyId
    name = "النقدية في البنك"
    category = "ASSET"
    asset_code = "CASH"
    amount = 100000.00
    metadata = @{}
} | ConvertTo-Json

$cash = Invoke-RestMethod -Uri "$baseUrl/financial-items" -Method Post -Body $cashItem -ContentType "application/json; charset=utf-8"
Write-Host "   ✓ Cash added: $($cash.amount)" -ForegroundColor Green

# Inventory Asset
$inventoryItem = @{
    company_id = $companyId
    name = "المخزون السلعي"
    category = "ASSET"
    asset_code = "INVENTORY"
    amount = 50000.00
    metadata = @{
        intent = "trade"
        trade_percentage = 100
    }
} | ConvertTo-Json

$inventory = Invoke-RestMethod -Uri "$baseUrl/financial-items" -Method Post -Body $inventoryItem -ContentType "application/json; charset=utf-8"
Write-Host "   ✓ Inventory added: $($inventory.amount)" -ForegroundColor Green

# Receivable Asset
$receivableItem = @{
    company_id = $companyId
    name = "الذمم المدينة"
    category = "ASSET"
    asset_code = "RECEIVABLE"
    amount = 30000.00
    metadata = @{
        collectibility = "strong"
    }
} | ConvertTo-Json

$receivable = Invoke-RestMethod -Uri "$baseUrl/financial-items" -Method Post -Body $receivableItem -ContentType "application/json; charset=utf-8"
Write-Host "   ✓ Receivable added: $($receivable.amount)" -ForegroundColor Green
Write-Host ""

# 4. Add Financial Items (Liabilities)
Write-Host "4. Adding Financial Items (Liabilities)..." -ForegroundColor Yellow

# Short-term Liability
$liabilityItem = @{
    company_id = $companyId
    name = "الدائنين التجاريين"
    category = "LIABILITY"
    liability_code = "SHORT_TERM_LIABILITY"
    amount = 20000.00
    metadata = @{}
} | ConvertTo-Json

$liability = Invoke-RestMethod -Uri "$baseUrl/financial-items" -Method Post -Body $liabilityItem -ContentType "application/json; charset=utf-8"
Write-Host "   ✓ Short-term Liability added: $($liability.amount)" -ForegroundColor Green
Write-Host ""

# 5. Calculate Zakat
Write-Host "5. Calculating Zakat..." -ForegroundColor Yellow
$zakatResult = Invoke-RestMethod -Uri "$baseUrl/zakat/calculate/$companyId" -Method Post
Write-Host ""
Write-Host "   === ZAKAT CALCULATION RESULT ===" -ForegroundColor Cyan
Write-Host "   Zakat Base: $($zakatResult.zakat_base)" -ForegroundColor White
Write-Host "   Zakat Amount (2.5%): $($zakatResult.zakat_amount)" -ForegroundColor White
Write-Host ""
Write-Host "   Items Breakdown:" -ForegroundColor Cyan
foreach ($item in $zakatResult.items) {
    $status = if ($item.included) { "✓ INCLUDED" } else { "✗ EXCLUDED" }
    $color = if ($item.included) { "Green" } else { "Red" }
    Write-Host "   - $($item.item_name): $status" -ForegroundColor $color
    Write-Host "     Amount: $($item.included_amount)" -ForegroundColor Gray
    Write-Host "     Explanation: $($item.explanation_ar)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Green
