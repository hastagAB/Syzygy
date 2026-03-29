# Syzygy Quality Gate
# Run all checks that must pass before a slice is committed.
# Usage: .\scripts\vibe-check.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== SYZYGY VIBE CHECK ===" -ForegroundColor Cyan
Write-Host ""

# 1. TypeScript type check
Write-Host "[1/4] Type check..." -ForegroundColor Yellow
pnpm tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: Type check failed" -ForegroundColor Red
    exit 1
}
Write-Host "  PASS" -ForegroundColor Green

# 2. Lint
Write-Host "[2/4] Lint..." -ForegroundColor Yellow
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: Lint failed" -ForegroundColor Red
    exit 1
}
Write-Host "  PASS" -ForegroundColor Green

# 3. Format check
Write-Host "[3/4] Format check..." -ForegroundColor Yellow
pnpm prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: Format check failed. Run 'pnpm prettier --write' to fix." -ForegroundColor Red
    exit 1
}
Write-Host "  PASS" -ForegroundColor Green

# 4. Tests with coverage
Write-Host "[4/4] Tests..." -ForegroundColor Yellow
pnpm vitest run --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: Tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "  PASS" -ForegroundColor Green

Write-Host ""
Write-Host "=== ALL CHECKS PASSED ===" -ForegroundColor Green
