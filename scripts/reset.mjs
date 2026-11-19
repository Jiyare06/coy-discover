// Deletes the local JSON database; it is re-seeded automatically on next request.
import { rmSync } from "node:fs";
rmSync(new URL("../data/db.json", import.meta.url), { force: true });
console.log("Local data reset. It will be re-seeded on the next request.");
