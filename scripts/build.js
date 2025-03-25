import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import chokidar from "chokidar";
import liveServer from "live-server";
import specmd from "spec-md";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootFolder = path.resolve(__dirname, "..");
const specFolder = path.resolve(rootFolder, "spec");
const buildFolder = path.resolve(rootFolder, "build");

const metadataPath = path.resolve(specFolder, "metadata.json");

let metadata = readMetadata();
let specPaths = refreshSpecPaths();

// make sure our build folder exists
if (!existsSync(buildFolder)) {
  mkdirSync(buildFolder);
}

// run a full build
(async function() {
  await Promise.all((await specPaths).map(async specPath => await buildSpec(specPath, await metadata)));
})().catch((error) => logError("Full Build", error));

// start our watcher
if (process.argv.length > 1 && process.argv.reduce((acc, argv) => acc || argv === "--watch" || argv === "-w", false)) {
  chokidar.watch(specFolder, { ignoreInitial: true })
    .on("all", (event, eventPath) => {
      switch (path.extname(eventPath)) {
        case ".md":
          (async function() {
            process.stderr.write(`Change Detected: ${path.relative(rootFolder, eventPath)} @ ${event}\n`);
            if (event === "add" || event === "unlink") {
              process.stderr.write("Refreshing Specs\n");
              specPaths = refreshSpecPaths();
            }
            if (event !== "unlink") {
              await buildSpec(eventPath, await metadata);
            }
          })().catch((error) => {
            logError(`${path.relative(rootFolder, eventPath)}:${event}`, error);
          });
          break;
        case ".json":
          (async function() {
            process.stderr.write(`Change Detected: ${path.relative(rootFolder, eventPath)} @ ${event}\n`);
            metadata = readMetadata();
            await Promise.all(
              (await specPaths)
                .map(async specPath => await buildSpec(specPath, await metadata))
            );
          })().catch((error) => {
            logError(`${path.relative(rootFolder, eventPath)}:${event}`, error);
          });
          break;
      }
    });

  liveServer.start({
    host: "localhost",
    root: buildFolder,
    open: false,
    logLevel: 2
  });
}

async function readMetadata() {
  return JSON.parse(await readFile(metadataPath));
}

async function refreshSpecPaths() {
  const specPaths = (await readdir(specFolder))
    .filter(file => path.extname(file) === ".md")
    .reduce((results, specFile) => {
      const version = /v(\d+)/.exec(specFile);
      if (version != null) {
        results.push({
          version: parseInt(version[1]),
          specPath: path.resolve(specFolder, specFile),
          basename: path.basename(specFile, ".md")
        });
      }
      return results;
    }, [])
    .sort(({ version: a }, { version: b }) => b - a);

  let latest = true;
  const specsTable = specPaths.map(({ version, basename }) => {
    const row = `<tr>
      <td>${(latest) ? "<em>Latest Release</em>" : ""}</td>
      <td><a href="${basename}.html" keep-hash>Version ${version}</a></td>
    </tr>`;
    latest = false;
    return row;
  }).join("\n");

  const indexHtml = `<html>
  <head>
    <title>GraphQL Multipart Request Specification Versions</title>
    <style>
      body {
        color: #333333;
        font: 13pt/18pt Cambria, 'Palatino Linotype', Palatino, 'Liberation Serif', serif;
        margin: 6rem auto 3rem;
        max-width: 780px;
      }
      @media (min-width: 1240px) {
        body {
          padding-right: 300px;
        }
      }
      a {
        color: #3B5998;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      h1 {
        font-size: 1.5em;
        margin: 8rem 0 2em;
      }
      td {
        padding-bottom: 5px;
      }
      td + td {
        padding-left: 2ch;
      }
    </style>
  </head>
  <body>
    <h1>GraphQL Multipart Request</h1>
    <table>
      ${specsTable}
    </table>
    <script>
      const links = document.getElementsByTagName('a');
      for (const link of links) {
        if (link.hasAttribute('keep-hash')) {
          link.href += location.hash;
          link.removeAttribute('keep-hash');
        }
      }
    </script>
  </body>
</html>`;

  const indexPath = path.resolve(buildFolder, "index.html");
  await writeFile(indexPath, indexHtml);
  process.stderr.write(`Built ${path.relative(rootFolder, indexPath)}\n`);

  return specPaths
    .map(({ specPath }) => specPath);
}

async function buildSpec(specPath, options) {
  try {
    const outputPath = path.resolve(buildFolder, `${path.basename(specPath, ".md")}.html`);
    const result = specmd.html(specPath, options);
    await writeFile(outputPath, result);
    process.stderr.write(`Built ${path.relative(rootFolder, specPath)} -> ${path.relative(rootFolder, outputPath)}\n`);

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

function logError(context, error) {
  process.stderr.write(`${context}\n`);
  process.stderr.write(error.location ? error.message : (error.stack || error) + "\n");
}

