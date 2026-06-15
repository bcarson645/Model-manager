# Clone PremiumCricket pricing library into pricing.models/
# Run this in a terminal where you are logged into gitlab.sportradar.ag

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root "pricing.models"
$repo = "https://gitlab.sportradar.ag/PremiumCricket/pcs.lib.pricing.git"

if (Test-Path (Join-Path $dest ".git")) {
    Write-Host "pricing.models already cloned. Pulling latest..."
    Set-Location $dest
    git pull
    exit 0
}

if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
}

Write-Host "Cloning into $dest ..."
git clone --depth 1 $repo $dest

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Models are at: pricing.models/PremiumCricket.Lib.Pricing/PricingModels"
} else {
    Write-Host "Clone failed. Ensure you are authenticated with GitLab (token or SSO)."
    exit 1
}
