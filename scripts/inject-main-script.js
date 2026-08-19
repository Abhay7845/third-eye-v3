const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "../build");
const indexPath = path.join(buildDir, "index.html");
const manifestPath = path.join(buildDir, "asset-manifest.json");
const staticJsDir = path.join(buildDir, "static/js");
const publicPath = "/ThirdEye";
const startMarker = "// BUILD_MAIN_SCRIPT_LOADER_START";
const endMarker = "// BUILD_MAIN_SCRIPT_LOADER_END";

if (!fs.existsSync(indexPath)) {
  throw new Error(`Build index not found: ${indexPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const mainScriptFromManifest = manifest.files && manifest.files["main.js"];
const mainScriptFromDisk = fs
  .readdirSync(staticJsDir)
  .find((fileName) => /^main\.[^.]+\.js$/.test(fileName));
const scriptSrc =
  mainScriptFromManifest || `${publicPath}/static/js/${mainScriptFromDisk}`;

if (
  !scriptSrc ||
  !/^\/ThirdEye\/static\/js\/main\.[^.]+\.js$/.test(scriptSrc)
) {
  throw new Error(
    "Could not resolve build-generated main.*.js from asset-manifest.json",
  );
}

const escapedPublicPath = publicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const autoMainScriptTag = new RegExp(
  `\\s*<script\\b(?=[^>]*\\bsrc=["']${escapedPublicPath}/static/js/main\\.[^"']+\\.js["'])(?=[^>]*\\bdefer(?:=["']defer["'])?)[^>]*><\\/script>`,
  "g",
);
const manualMainScriptLoader = new RegExp(
  `\\s*window\\.addEventListener\\(["']DOMContentLoaded["'],\\s*\\(\\)\\s*=>\\s*\\{[\\s\\S]*?script\\.src\\s*=\\s*["']${escapedPublicPath}/static/js/main\\.[^"']+\\.js["'];[\\s\\S]*?document\\.head\\.appendChild\\(script\\);[\\s\\S]*?\\}\\);`,
  "g",
);
const cspBootstrapScript =
  /(<script\b[^>]*>[\s\S]*?document\.querySelector\(["']#csp-meta["']\)[\s\S]*?)(\s*<\/script>)/;

const loaderBlock = `${startMarker}\n      window.addEventListener("DOMContentLoaded", () => {\n        const script = document.createElement("script");\n        script.src = "${scriptSrc}";\n        script.defer = true;\n        script.setAttribute("nonce", nonce);\n        document.head.appendChild(script);\n      });\n      ${endMarker}`;

let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(autoMainScriptTag, "");
html = html.replace(manualMainScriptLoader, "");

const existingLoader = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "m");

if (existingLoader.test(html)) {
  html = html.replace(existingLoader, loaderBlock);
} else {
  if (!cspBootstrapScript.test(html)) {
    throw new Error("Could not find CSP bootstrap script in build/index.html");
  }

  html = html.replace(cspBootstrapScript, `$1\n      ${loaderBlock}$2`);
}

fs.writeFileSync(indexPath, html);
