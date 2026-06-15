# Fix local dev / webpack cache errors

## Model Manager uses port 3010

PCSPrototype often runs on 3000. Model Manager uses **3010** to avoid conflicts.

```powershell
cd "c:\Users\b.carson\OneDrive - SportradarAG\New folder\Code\Model.Management"
npm run dev:fresh
```

Open http://localhost:3010

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:fresh` | Kill stale server on 3010, clean `.next`, start dev |
| `npm run dev:clean` | Clean `.next` then start dev |
| `npm run dev` | Start dev on port 3010 |
| `npm run clean` | Delete `.next` only |

### Common errors

**`EBUSY: resource busy or locked` (webpack.js)**  
OneDrive + multiple `next dev` instances locking the same `.next` folder.

Fix:
1. Close other terminals running `npm run dev` (including PCSPrototype on 3000)
2. Run `npm run dev:fresh`

**`GET /_next/static/chunks/... 404` or `500`**  
Stale dev cache, or `next build` overwriting dev `.next` (dev now uses `.next-dev`).

Fix:
1. Run `npm run dev:fresh`
2. Hard refresh (Ctrl+Shift+R) or use incognito
3. Use http://localhost:3010 only
4. Do not run `npm run build` while dev is running

**`EINVAL: invalid argument, readlink` (build)**  
OneDrive symlink issue. Run `npm run clean` then `npm run build`. `next.config.mjs` disables webpack symlinks in dev.

**`e[o] is not a function` (500)**  
Stale `.next` cache mixed with a new build. Run `npm run dev:clean`.

**Wrong app loads**  
You ran `npm run dev` from the parent `Code` folder — that starts **PCSPrototype**, not Model Manager. Always `cd` into `Model.Management` first.

### OneDrive tip

If errors persist, exclude `.next` from OneDrive sync or move the project outside OneDrive.
