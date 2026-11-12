/* Сборка: вшивает assets/thor.svg в index.html + добавляет canvas для молний.
   Запуск: node tools/build-hero.js */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "assets", "thor.svg");
const htmlPath = path.join(root, "index.html");

const svg = fs.readFileSync(svgPath, "utf8").trim();
let html = fs.readFileSync(htmlPath, "utf8");

const START = '<svg class="thor"';
const END = "</svg>";
const CANVAS = '<canvas class="bolt" id="boltCanvas" aria-hidden="true"></canvas>';

const s = html.indexOf(START);
if (s < 0) {
  console.error("Не найден инлайн-SVG в index.html");
  process.exit(1);
}
const e = html.indexOf(END, s) + END.length;

const block = "        <div class=\"piece__frame\">\n          " + svg + "\n          " + CANVAS + "\n        </div>";

html = html.slice(0, s) + block + html.slice(e);
fs.writeFileSync(htmlPath, html);
console.log("hero собран: SVG вшит, canvas молний добавлен");
