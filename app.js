// OKLCH Engine & Industrial Pro UI Logic
const toast = document.getElementById('toast');
const themePicker1 = document.getElementById('themePicker1');
const themePicker2 = document.getElementById('themePicker2');
const accentPicker = document.getElementById('accentPicker');
const harmonyPattern = document.getElementById('harmonyPattern');
const skinBasePicker = document.getElementById('skinBasePicker');
const skinPaletteDisplay = document.getElementById('skinPaletteDisplay');
const variationGrid = document.getElementById('variationGrid');

const btnExportPng = document.getElementById('btnExportPng');
const btnExportCls = document.getElementById('btnExportCls');
const themeToggle = document.getElementById('themeToggle');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');

const lchDisplay1 = document.getElementById('lch1');
const lchDisplay2 = document.getElementById('lch2');
const lchDisplayA = document.getElementById('lchA');

const wheelCanvas = document.getElementById('wheelCanvas');
const wheelHandles = document.getElementById('wheelHandles');
const lightnessSlider = document.getElementById('lightnessSlider');
const btnResetWheel = document.getElementById('btnResetWheel');
const htmlEl = document.documentElement;

const skinBases = [
  { name: 'Pale', hex: '#fff1e5' },
  { name: 'Fair', hex: '#ffe4d1' },
  { name: 'Warm', hex: '#ffd8bc' },
  { name: 'Tan', hex: '#e8b999' },
  { name: 'Deep', hex: '#8d5524' }
];

let state = {
  theme1: '#38bdf8',
  theme2: '#818cf8',
  accent: '#fbbf24',
  l: 0.7,
  harmony: 'triadic',
  skinBase: skinBases[1].hex
};

let activeHandle = null;
const MAX_CHROMA = 0.37;

// --- Initialization ---
function init() {
  htmlEl.setAttribute('data-theme', 'light');
  renderSkinBaseOptions();
  applyHarmony();
  drawColorWheel();
  updateUI();
  // Sync icons for light mode (show moon to switch to dark)
  themeIconSun.classList.add('hidden');
  themeIconMoon.classList.remove('hidden');

  // Pickers
  themePicker1.addEventListener('input', (e) => {
    state.theme1 = e.target.value;
    const lch = rgbToOklch(hexToRgb(state.theme1));
    state.l = lch.l;
    lightnessSlider.value = state.l;
    if (state.harmony !== 'manual') applyHarmony();
    drawColorWheel();
    updateUI();
  });

  themePicker2.addEventListener('input', (e) => {
    state.theme2 = e.target.value;
    state.harmony = 'manual';
    harmonyPattern.value = 'manual';
    updateUI();
  });

  accentPicker.addEventListener('input', (e) => {
    state.accent = e.target.value;
    state.harmony = 'manual';
    harmonyPattern.value = 'manual';
    updateUI();
  });

  harmonyPattern.addEventListener('change', (e) => {
    state.harmony = e.target.value;
    if (state.harmony !== 'manual') applyHarmony();
    updateUI();
  });

  lightnessSlider.addEventListener('input', (e) => {
    state.l = parseFloat(e.target.value);
    const lch1 = rgbToOklch(hexToRgb(state.theme1));
    const lch2 = rgbToOklch(hexToRgb(state.theme2));
    const lchA = rgbToOklch(hexToRgb(state.accent));

    state.theme1 = oklchToHex(state.l, lch1.c, lch1.h);
    state.theme2 = oklchToHex(state.l, lch2.c, lch2.h);
    state.accent = oklchToHex(Math.min(1, state.l * 1.1), lchA.c, lchA.h);
    
    drawColorWheel();
    updateUI();
  });

  // Wheel Interactions
  wheelHandles.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', () => { activeHandle = null; updateUI(); });

  themeToggle.addEventListener('click', toggleTheme);
  btnExportPng.addEventListener('click', exportAsPng);
  btnExportCls.addEventListener('click', exportAsCls);
  btnResetWheel.addEventListener('click', resetWheel);
}

function resetWheel() {
  state.theme1 = '#38bdf8';
  state.theme2 = '#818cf8';
  state.accent = '#fbbf24';
  state.l = 0.7;
  lightnessSlider.value = 0.7;
  state.harmony = 'triadic';
  harmonyPattern.value = 'triadic';
  applyHarmony();
  drawColorWheel();
  updateUI();
  showToast('SYSTEM: WHEEL_INITIALIZED');
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
  themeIconSun.classList.toggle('hidden', next === 'light');
  themeIconMoon.classList.toggle('hidden', next === 'dark');
  drawColorWheel();
}

function renderSkinBaseOptions() {
  skinBasePicker.innerHTML = '';
  skinBases.forEach(skin => {
    const wrapper = document.createElement('div');
    wrapper.className = 'skin-chip-wrapper';
    wrapper.onclick = () => { state.skinBase = skin.hex; updateUI(); };
    wrapper.innerHTML = `<div class="skin-chip" style="background-color: ${skin.hex}"></div><div class="skin-label">${skin.name}</div>`;
    skinBasePicker.appendChild(wrapper);
  });
}

function updateUI() {
  themePicker1.value = state.theme1;
  themePicker2.value = state.theme2;
  accentPicker.value = state.accent;

  const lch1 = rgbToOklch(hexToRgb(state.theme1));
  const lch2 = rgbToOklch(hexToRgb(state.theme2));
  const lchA = rgbToOklch(hexToRgb(state.accent));

  lchDisplay1.textContent = `L:${lch1.l.toFixed(2)} C:${lch1.c.toFixed(2)} H:${lch1.h.toFixed(0)}`;
  lchDisplay2.textContent = `L:${lch2.l.toFixed(2)} C:${lch2.c.toFixed(2)} H:${lch2.h.toFixed(0)}`;
  lchDisplayA.textContent = `L:${lchA.l.toFixed(2)} C:${lchA.c.toFixed(2)} H:${lchA.h.toFixed(0)}`;

  renderSkinPalette();
  renderVariationGrid();
  renderWheelHandles(lch1, lch2, lchA);

  Array.from(skinBasePicker.querySelectorAll('.skin-chip-wrapper')).forEach(wrap => {
    const chipHex = rgbToHex(...wrap.querySelector('.skin-chip').style.backgroundColor.match(/\d+/g).map(Number));
    wrap.style.borderColor = (chipHex.toLowerCase() === state.skinBase.toLowerCase()) ? 'var(--accent-primary)' : 'var(--border-main)';
  });
}

// --- Wheel Operations ---
function drawColorWheel() {
  const ctx = wheelCanvas.getContext('2d');
  const w = wheelCanvas.width, h = wheelCanvas.height;
  const cx = w / 2, cy = h / 2, radius = cx - 10;
  const imgData = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * w + x) * 4;
      if (dist <= radius) {
        const h = Math.atan2(dy, dx) * (180 / Math.PI);
        const c = (dist / radius) * MAX_CHROMA;
        const rgb = oklchToRgb(state.l, c, h);
        imgData.data[idx] = Math.max(0, Math.min(255, rgb.r));
        imgData.data[idx + 1] = Math.max(0, Math.min(255, rgb.g));
        imgData.data[idx + 2] = Math.max(0, Math.min(255, rgb.b));
        imgData.data[idx + 3] = 255;
      } else { imgData.data[idx + 3] = 0; }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function renderWheelHandles(lch1, lch2, lchA) {
  wheelHandles.innerHTML = '';
  const cx = 50, cy = 50;
  const positions = [
    { id: 'h1', lch: lch1, color: state.theme1, main: true },
    { id: 'h2', lch: lch2, color: state.theme2 },
    { id: 'hA', lch: lchA, color: state.accent }
  ];
  positions.forEach(p => {
    const angleRad = p.lch.h * (Math.PI / 180);
    const distPercent = (p.lch.c / MAX_CHROMA) * 50 * 0.95;
    const x = cx + Math.cos(angleRad) * distPercent, y = cy + Math.sin(angleRad) * distPercent;
    const line = document.createElement('div'); line.className = 'handle-line';
    line.style.width = `${distPercent}%`; line.style.transform = `rotate(${angleRad}rad)`;
    wheelHandles.appendChild(line);
    const handle = document.createElement('div');
    handle.className = 'handle' + (p.main ? ' main' : '');
    handle.id = p.id; handle.style.left = `${x}%`; handle.style.top = `${y}%`;
    handle.style.backgroundColor = p.color; handle.title = p.id;
    wheelHandles.appendChild(handle);
  });
}

function startDrag(e) { if (e.target.classList.contains('handle')) { activeHandle = e.target.id; e.preventDefault(); } }
function drag(e) {
  if (!activeHandle) return;
  const rect = wheelCanvas.getBoundingClientRect();
  const dx = (e.clientX - rect.left) - rect.width / 2, dy = (e.clientY - rect.top) - rect.height / 2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let h = Math.atan2(dy, dx) * (180 / Math.PI); if (h < 0) h += 360;
  const c = Math.min(MAX_CHROMA, (dist / (rect.width / 2 * 0.95)) * MAX_CHROMA);
  if (activeHandle === 'h1') { state.theme1 = oklchToHex(state.l, c, h); if (state.harmony !== 'manual') applyHarmony(); }
  else if (activeHandle === 'h2') { state.theme2 = oklchToHex(state.l, c, h); state.harmony = 'manual'; harmonyPattern.value = 'manual'; }
  else if (activeHandle === 'hA') { state.accent = oklchToHex(state.l, c, h); state.harmony = 'manual'; harmonyPattern.value = 'manual'; }
  updateUI();
}

function applyHarmony() {
  const lch = rgbToOklch(hexToRgb(state.theme1));
  let h2, hA;
  switch (state.harmony) {
    case 'complementary': h2 = hA = (lch.h + 180) % 360; break;
    case 'split': h2 = (lch.h + 150) % 360; hA = (lch.h + 210) % 360; break;
    case 'triadic': h2 = (lch.h + 120) % 360; hA = (lch.h + 240) % 360; break;
    case 'analogous': h2 = (lch.h - 30 + 360) % 360; hA = (lch.h + 30) % 360; break;
    default: return;
  }
  state.theme2 = oklchToHex(lch.l, lch.c, h2);
  state.accent = oklchToHex(Math.min(1, lch.l * 1.1), lch.c, hA);
}

// --- Color Conversion ---
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
function rgbToHex(r, g, b) {
  const f = x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
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
function oklchToRgb(l, c, h) {
  const h_rad = h * (Math.PI / 180), a = c * Math.cos(h_rad), b = c * Math.sin(h_rad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b, m_ = l - 0.1055613458 * a - 0.0638541728 * b, s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_;
  const r_l = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3, g_l = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3, b_l = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  const l2s = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  return { r: l2s(r_l) * 255, g: l2s(g_l) * 255, b: l2s(b_l) * 255 };
}
function oklchToHex(l, c, h) { const rgb = oklchToRgb(l, c, h); return rgbToHex(rgb.r, rgb.g, rgb.b); }

// --- Renderers ---
function renderSkinPalette() {
  const skinLch = rgbToOklch(hexToRgb(state.skinBase)), env1Lch = rgbToOklch(hexToRgb(state.theme1)), env2Lch = rgbToOklch(hexToRgb(state.theme2));
  const lerp = (h1, h2, t) => { let d = (h2 - h1 + 360) % 360; if (d > 180) d -= 360; return (h1 + d * t + 360) % 360; };
  const palette = [
    { name: 'Base', hex: state.skinBase },
    { name: 'S1 (Env1)', hex: oklchToHex(Math.max(0, skinLch.l - 0.15), skinLch.c + 0.05, lerp(skinLch.h, env1Lch.h, 0.2)) },
    { name: 'S2 (Env2)', hex: oklchToHex(Math.max(0, skinLch.l - 0.25), skinLch.c + 0.08, lerp(skinLch.h, env2Lch.h, 0.3)) },
    { name: 'Blush', hex: oklchToHex(skinLch.l + 0.05, skinLch.c + 0.08, lerp(skinLch.h, 15, 0.5)) },
    { name: 'Highlight', hex: oklchToHex(Math.min(1, skinLch.l + 0.1), skinLch.c - 0.05, lerp(skinLch.h, env1Lch.h, 0.1)) }
  ];
  skinPaletteDisplay.innerHTML = '';
  palette.forEach(c => skinPaletteDisplay.appendChild(createSkinChip(c.hex, c.name)));
}

function renderVariationGrid() {
  variationGrid.innerHTML = '';
  const sources = [
    { name: 'PRIMARY (T1)', hex: state.theme1 },
    { name: 'AMBIENT (T2)', hex: state.theme2 },
    { name: 'ACCENT (AC)', hex: state.accent }
  ];
  sources.forEach(src => {
    const col = document.createElement('div'); col.className = 'variation-column';
    col.innerHTML = `<div class="column-header">${src.name}</div>`;
    const lch = rgbToOklch(hexToRgb(src.hex));
    const vars = [
      { n: 'Original', l: lch.l, c: lch.c, h: lch.h },
      { n: 'Light+', l: Math.min(1, lch.l + 0.2), c: lch.c, h: lch.h },
      { n: 'Dark-', l: Math.max(0, lch.l - 0.2), c: lch.c, h: lch.h },
      { n: 'Saturation+', l: lch.l, c: Math.min(MAX_CHROMA, lch.c + 0.1), h: lch.h },
      { n: 'Saturation-', l: lch.l, c: Math.max(0, lch.c - 0.1), h: lch.h },
      { n: 'Hue+15', l: lch.l, c: lch.c, h: (lch.h + 15) % 360 },
      { n: 'Hue-15', l: lch.l, c: lch.c, h: (lch.h - 15 + 360) % 360 },
      { n: 'Pastel', l: 0.9, c: 0.05, h: lch.h },
      { n: 'Deep', l: 0.4, c: 0.2, h: lch.h },
      { n: 'Ambient Mix', l: lch.l * 0.8, c: lch.c, h: (lch.h + 30) % 360 },
      { n: 'Low-C Light', l: 0.95, c: 0.02, h: lch.h },
      { n: 'Cold Mix', l: lch.l, c: lch.c, h: (lch.h + 180) % 360 }
    ];

    // Originalを先頭に固定し、残りを明度順（降順）でソート
    const original = vars.shift();
    vars.sort((a, b) => b.l - a.l);
    const sortedVars = [original, ...vars];

    sortedVars.forEach(v => col.appendChild(createMiniChip(oklchToHex(v.l, v.c, v.h), v.n)));
    variationGrid.appendChild(col);
  });
}

function createSkinChip(hex, label) {
  const w = document.createElement('div'); w.className = 'skin-chip-wrapper';
  w.onclick = () => copyToClipboard(hex);
  w.innerHTML = `<div class="skin-chip" style="background-color: ${hex}"></div><div class="skin-label">${label}<br>${hex.toUpperCase()}</div>`;
  return w;
}

function createMiniChip(hex, label) {
  const w = document.createElement('div'); w.className = 'mini-color-group';
  w.onclick = () => copyToClipboard(hex);
  w.innerHTML = `<div class="mini-chip" style="background-color: ${hex}"></div><div class="mini-label">${label}</div>`;
  return w;
}

function copyToClipboard(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => showToast(`COPIED: ${text.toUpperCase()}`));
  else { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); showToast(`COPIED: ${text.toUpperCase()}`); }
}
function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1500); }

// Exports
// Exports
// Exports
async function exportAsPng() {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  const W = 600; 
  let curY = 0;
  
  canvas.width = W; 
  canvas.height = 1000; 
  
  function getContrastColor(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  }

  function drawTiledChip(x, y, w, h, hex, label) {
    ctx.fillStyle = hex; ctx.fillRect(x, y, w, h);
    // Overlay Hex
    ctx.fillStyle = getContrastColor(hex);
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(hex.toUpperCase(), x + w/2, y + h - 15);
    if (label) {
      ctx.font = '7px monospace';
      ctx.fillText(label.toUpperCase(), x + w/2, y + h - 6);
    }
  }

  function getHex(el) {
    const rgbStr = window.getComputedStyle(el).backgroundColor;
    const rgb = rgbStr.match(/\d+/g).map(Number);
    return rgbToHex(...rgb);
  }

  // Header Area (Compact)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = '#FF0000'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
  ctx.fillText('INDUSTRIAL PALETTE - TILED GRID', 15, 25);
  curY = 40;

  // --- SOURCE COLORS (3 across) ---
  const sourceHexes = [state.theme1, state.theme2, state.accent];
  const sLabels = ['PRIMARY(T1)', 'AMBIENT(T2)', 'ACCENT(AC)'];
  sourceHexes.forEach((hex, i) => drawTiledChip(i * 200, curY, 200, 100, hex, sLabels[i]));
  curY += 100;

  // --- ATMOSPHERIC_SKIN (5 across) ---
  const skinTargetNodes = document.querySelectorAll('#skinPaletteDisplay .skin-chip');
  const skinLabels = ['BASE', 'S1(ENV1)', 'S2(ENV2)', 'BLUSH', 'HIGHLIGHT'];
  skinTargetNodes.forEach((el, i) => {
    if (i < 5) drawTiledChip(i * 120, curY, 120, 80, getHex(el), skinLabels[i]);
  });
  curY += 80;

  // --- VARIATIONS (3 columns x 10 rows) ---
  const columns = document.querySelectorAll('#variationGrid .variation-column');
  const colW = 200;
  const rowH = 65;
  columns.forEach((col, colIdx) => {
    const chips = Array.from(col.querySelectorAll('.mini-chip'));
    chips.forEach((cEl, rowIdx) => {
      const hex = getHex(cEl);
      const label = cEl.nextElementSibling?.textContent || '';
      drawTiledChip(colIdx * colW, curY + rowIdx * rowH, colW, rowH, hex, label);
    });
  });

  // Dynamic Height Adjustment based on final Y
  const finalH = curY + (10 * rowH);
  if (canvas.height !== finalH) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width; tempCanvas.height = finalH;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0);
    const link = document.createElement('a'); link.download = 'industrial-palette-tiled.png'; link.href = tempCanvas.toDataURL('image/png'); link.click();
  } else {
    const link = document.createElement('a'); link.download = 'industrial-palette-tiled.png'; link.href = canvas.toDataURL('image/png'); link.click();
  }
}

async function exportAsCls() {
  const getGroupColors = (selector) => {
    const arr = [];
    document.querySelectorAll(selector).forEach(chip => {
      const rgbStr = window.getComputedStyle(chip).backgroundColor;
      let match = [];
      const tmp = rgbStr.replace(/[^0-9,]/g, '').split(',');
      if (tmp.length >= 3) {
        match = [tmp[0], tmp[1], tmp[2]];
      }
      if (!match || match.length < 3) return;
      const rgb = match.map(Number);
      const hex = rgbToHex(...rgb);
      const lch = rgbToOklch(hexToRgb(hex));
      if (!arr.some(c => c.hex === hex)) {
        arr.push({ hex, rgb, l: lch.l });
      }
    });
    // Sort by lightness descending (brightest to darkest)
    return arr.sort((a, b) => b.l - a.l);
  };

  // Group 1: Skin, Group 2: T1 Variations, Group 3: T2 Variations, Group 4: AC Variations
  const colors = [
    ...getGroupColors('#skinPaletteDisplay .skin-chip'),
    ...getGroupColors('#variationGrid .variation-column:nth-child(1) .mini-chip'),
    ...getGroupColors('#variationGrid .variation-column:nth-child(2) .mini-chip'),
    ...getGroupColors('#variationGrid .variation-column:nth-child(3) .mini-chip')
  ];

  if (colors.length === 0) return showToast('ERROR: NO_COLORS_FOUND');

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const paletteName = `OKLCH_${capitalize(state.harmony)}_${state.theme1.substring(1).toUpperCase()}`;
  
  const asciiName = paletteName;
  const utf8Name = paletteName;

  const encoder = new TextEncoder();
  const asciiBytes = encoder.encode(asciiName);
  const utf8Bytes = encoder.encode(utf8Name);

  const metaLen = asciiBytes.length + utf8Bytes.length + 8;
  const headerSize = 4 + 2 + 4 + 2 + asciiBytes.length + 4 + 2 + utf8Bytes.length + 4 + 4 + 4;
  const colorDataSize = colors.length * 12;
  const buffer = new ArrayBuffer(headerSize + colorDataSize);
  const view = new DataView(buffer);
  let off = 0;

  view.setUint8(off++, 83); // 'S'
  view.setUint8(off++, 76); // 'L'
  view.setUint8(off++, 67); // 'C'
  view.setUint8(off++, 67); // 'C'

  view.setUint16(off, 256, true); off += 2;
  view.setUint32(off, metaLen, true); off += 4;
  
  view.setUint16(off, asciiBytes.length, true); off += 2;
  for(let i = 0; i < asciiBytes.length; i++) view.setUint8(off++, asciiBytes[i]);
  
  view.setUint32(off, 0, true); off += 4;
  
  view.setUint16(off, utf8Bytes.length, true); off += 2;
  for(let i = 0; i < utf8Bytes.length; i++) view.setUint8(off++, utf8Bytes[i]);
  
  view.setUint32(off, 4, true); off += 4; // channels (RGBA)
  view.setUint32(off, colors.length, true); off += 4;
  view.setUint32(off, colorDataSize, true); off += 4;

  colors.forEach(c => {
    view.setUint32(off, 8, true); off += 4;
    view.setUint8(off++, c.rgb[0]);
    view.setUint8(off++, c.rgb[1]);
    view.setUint8(off++, c.rgb[2]);
    view.setUint8(off++, 255);
    view.setUint32(off, 0, true); off += 4;
  });

  const blob = new Blob([buffer], { type: 'application/octet-stream' }); 
  const link = document.createElement('a'); 
  link.download = `${paletteName}.cls`; 
  link.href = URL.createObjectURL(blob); 
  link.click();
  showToast('SYSTEM: CLS_EXPORT_SUCCESS');
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
