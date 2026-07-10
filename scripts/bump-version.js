/**
 * Custom version bump script.
 *
 * Rules:
 *   patch + 1 >= 10  →  minor += 1, patch = 0
 *   minor + 1 >= 10  →  major += 1, minor = 0, patch = 0
 *
 * Examples:
 *   1.1.9  →  1.2.0
 *   1.2.9  →  1.3.0
 *   1.9.9  →  2.0.0
 */

const fs = require("fs");
const path = require("path");

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

let [major, minor, patch] = pkg.version.split(".").map(Number);

// Increment patch first
patch += 1;

// Roll patch → minor
if (patch >= 10) {
  minor += 1;
  patch = 0;
}

// Roll minor → major
if (minor >= 10) {
  major += 1;
  minor = 0;
  patch = 0;
}

pkg.version = `${major}.${minor}.${patch}`;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`Version bumped to: ${pkg.version}`);
