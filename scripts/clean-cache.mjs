import { rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = join(root, ".next");
const devNextDir = join(root, ".next-dev");
const webpackCache = join(root, "node_modules", ".cache");
function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* wait for OneDrive / file locks */
  }
}

function removeWithRetry(path, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    try {
      rmSync(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return true;
    } catch (err) {
      const retryable =
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err.code === "EBUSY" ||
          err.code === "EPERM" ||
          err.code === "ENOTEMPTY" ||
          err.code === "EINVAL");
      if (!retryable || i === attempts - 1) {
        console.warn(`Could not remove ${path}:`, err.message);
        return false;
      }
      sleep(750);
    }
  }
  return false;
}

let ok = true;
if (!removeWithRetry(nextDir)) ok = false;
if (!removeWithRetry(devNextDir)) ok = false;
if (!removeWithRetry(webpackCache)) ok = false;

if (ok) {
  console.log("Removed .next, .next-dev, and webpack cache");
} else {
  console.warn("Partial cache cleanup - stop other dev servers and retry");
}