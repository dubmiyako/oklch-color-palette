const fs = require('fs');

// app.js のロジックのシミュレーション
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
function rgbToOklab(r, g, b) {
  const s2l = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = s2l(r), lg = s2l(g), lb = s2l(b);
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_c = Math.cbrt(l_), m_c = Math.cbrt(m_), s_c = Math.cbrt(s_);
  return { l: 0.2104542553 * l_c + 0.7936177850 * m_c - 0.0040720468 * s_c, a: 1.9779984951 * l_c - 2.4285922050 * m_c + 0.4505937099 * s_c, b: 0.0259040371 * l_c + 0.7827717662 * m_c - 0.8086757660 * s_c };
}
function rgbToOklch({ r, g, b }) {
  const lab = rgbToOklab(r, g, b), c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI); if (h < 0) h += 360;
  return { l: lab.l, c, h };
}

// テスト用データ（T1系のバリエーションの色コードをいくつか抽出・模倣）
const hexes = [
  "#38bdf8", // Original
  "#7acaf8", // Light+
  "#007ab8", // Dark-
  "#ecf5fb", // Pastel
  "#143b4f", // Deep
];

const arr = hexes.map(hex => ({ hex, l: rgbToOklch(hexToRgb(hex)).l }));
console.log("Before sort:");
arr.forEach(c => console.log(c.hex, c.l));

arr.sort((a, b) => b.l - a.l);
console.log("\nAfter sort (L descending):");
arr.forEach(c => console.log(c.hex, c.l));
