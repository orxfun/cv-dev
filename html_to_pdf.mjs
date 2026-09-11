#!/usr/bin/env node
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const [, , inputArg, outputArg] = process.argv;

function printUsage() {
    console.log(`Usage:
  node html_to_pdf.mjs <input.html> [output.pdf]

Examples:
  npm run pdf:or
  npm run pdf:sw
  node html_to_pdf.mjs cv_or.html
  node html_to_pdf.mjs cv_sw.html ugur_arikan_cv_sw.pdf`);
}

if (!inputArg || inputArg === "--help" || inputArg === "-h") {
    printUsage();
    process.exit(inputArg ? 0 : 1);
}

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

const inputPath = path.resolve(inputArg);
const defaultOutput = inputPath.replace(/\.html?$/i, ".pdf");
const outputPath = path.resolve(outputArg || defaultOutput);

if (!/\.html?$/i.test(inputPath)) {
    console.error(`Input must be an HTML file: ${inputArg}`);
    process.exit(1);
}

if (!(await fileExists(inputPath))) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

let chromium;
try {
    ({ chromium } = await import("playwright-chromium"));
} catch (error) {
    console.error("Missing dependency: playwright-chromium");
    console.error("Run `npm install` in this folder, then try again.");
    console.error(error.message);
    process.exit(1);
}

await mkdir(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
    await page.goto(pathToFileURL(inputPath).href, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    console.log(`Created ${outputPath}`);
} finally {
    await browser.close();
}
