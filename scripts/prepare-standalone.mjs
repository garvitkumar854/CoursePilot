import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(target) {
    try {
        await stat(target);
        return true;
    } catch {
        return false;
    }
}

if (process.env.VERCEL) {
    console.log("Vercel build detected — skipping standalone asset preparation.");
} else if (await exists(standalone)) {
    const staticSource = path.join(root, ".next", "static");
    const staticTarget = path.join(standalone, ".next", "static");
    const publicSource = path.join(root, "public");
    const publicTarget = path.join(standalone, "public");

    await mkdir(path.dirname(staticTarget), { recursive: true });

    if (await exists(staticSource)) {
        await cp(staticSource, staticTarget, { recursive: true, force: true });
    }

    if (await exists(publicSource)) {
        await cp(publicSource, publicTarget, { recursive: true, force: true });
    }

    console.log("Prepared standalone output with static and public assets.");
}
