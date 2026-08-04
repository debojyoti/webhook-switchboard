import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const canonicalDirectory = path.resolve("client/contract");
const mirrorDirectory = path.resolve("server/contract");

const canonicalFiles = await listFiles(canonicalDirectory);
const mirrorFiles = await listFiles(mirrorDirectory);

if (canonicalFiles.join("\n") !== mirrorFiles.join("\n")) {
  throw new Error("Contract mirror files do not match the canonical client contract.");
}

for (const relativePath of canonicalFiles) {
  const [canonicalContents, mirrorContents] = await Promise.all([
    readFile(path.join(canonicalDirectory, relativePath), "utf8"),
    readFile(path.join(mirrorDirectory, relativePath), "utf8"),
  ]);

  if (canonicalContents !== mirrorContents) {
    throw new Error(`Contract mirror differs: ${relativePath}`);
  }
}

console.log("Contract mirror is synchronized.");

async function listFiles(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        return listFiles(directory, relativePath);
      }

      return [relativePath];
    }),
  );

  return files.flat().sort();
}
