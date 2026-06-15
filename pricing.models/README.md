# Pricing models (local clone)

This folder holds a local clone of the internal GitLab repo:

`PremiumCricket/pcs.lib.pricing`

**Models path:** `PremiumCricket.Lib.Pricing/PricingModels`

## Clone (one-time)

From the project root, in a terminal where you are logged into `gitlab.sportradar.ag`:

```powershell
.\scripts\clone-pricing-models.ps1
```

Or manually:

```powershell
git clone https://gitlab.sportradar.ag/PremiumCricket/pcs.lib.pricing.git pricing.models
```

This folder is gitignored — it is not pushed to the public Model-manager GitHub repo.

After cloning, tell Cursor the folder is ready and we can map Lambda inputs/outputs to the Excel workbook registry.
