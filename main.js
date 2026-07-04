import './styles.css';

const CONFIG = {
  productionPerKw: 1650,
  sellRate: 0.48,
  installCostPerKw: 2900,
  sqmPerKw: 7,
  panelKw: 0.63,
  usableRoofFactor: 0.82,
  defaultPhone: '972547299727'
};

const shapePresets = [
  { points: '17,58 77,42 86,78 24,88', area: 74, orientation: 'South', factor: 1 },
  { points: '14,18 48,10 52,36 16,46', area: 36, orientation: 'East', factor: 0.88 },
  { points: '58,14 86,18 80,38 56,34', area: 22, orientation: 'West', factor: 0.82 },
  { points: '28,42 55,35 63,58 35,66', area: 29, orientation: 'South-East', factor: 0.94 },
  { points: '48,62 82,56 86,77 52,84', area: 31, orientation: 'South-West', factor: 0.9 }
];

const state = {
  step: 0,
  address: '',
  roofType: '',
  surfaces: [],
  obstacles: [],
  leadSent: false,
  analysisTimer: null
};

const steps = ['Start', 'Address', 'Roof', 'Draw', 'Obstacles', 'Analysis', 'Report'];

function formatNumber(value) { return Math.round(value).toLocaleString('he-IL'); }
function formatMoney(value) { return '₪' + formatNumber(value); }

function createSurface(index) {
  const preset = shapePresets[index % shapePresets.length];
  return { id: index + 1, name: `Side ${index + 1}`, ...preset };
}

function calculateSurface(surface) {
  const usableArea = Math.max(surface.area * CONFIG.usableRoofFactor, 0);
  const kw = usableArea / CONFIG.sqmPerKw;
  const panels = Math.max(Math.floor(kw / CONFIG.panelKw), 1);
  return { usableArea, kw, panels };
}

function ensureDefaultSurface() {
  if (!state.surfaces.length) state.surfaces = [createSurface(0)];
}

function calculateReport() {
  ensureDefaultSurface();
  const systemKw = state.surfaces.reduce((sum, surface) => sum + calculateSurface(surface).kw, 0);
  const weightedFactor = state.surfaces.reduce((sum, surface) => sum + surface.factor * calculateSurface(surface).kw, 0) / Math.max(systemKw, 1);
  const annualProduction = systemKw * CONFIG.productionPerKw * weightedFactor;
  const annualRevenue = annualProduction * CONFIG.sellRate;
  const cost = systemKw * CONFIG.installCostPerKw;
  const payback = cost / Math.max(annualRevenue, 1);
  const profit25 = annualRevenue * 25 - cost;
  const panels = state.surfaces.reduce((sum, surface) => sum + calculateSurface(surface).panels, 0);
  const roofArea = state.surfaces.reduce((sum, surface) => sum + surface.area, 0);
  const usableArea = state.surfaces.reduce((sum, surface) => sum + calculateSurface(surface).usableArea, 0);
  return { systemKw, annualProduction, annualRevenue, payback, profit25, panels, roofArea, usableArea };
}

function setStep(step) {
  clearTimeout(state.analysisTimer);
  state.step = Math.max(0, Math.min(steps.length - 1, step));
  render();
  if (state.step === 5) state.analysisTimer = setTimeout(() => setStep(6), 1800);
}

function selectRoofType(type) {
  state.roofType = type;
  state.surfaces = [];
  render();
}

function addRoofSide() { state.surfaces.push(createSurface(state.surfaces.length)); render(); }
function removeRoofSide() { state.surfaces.pop(); render(); }

function toggleObstacle(value) {
  state.obstacles = state.obstacles.includes(value) ? state.obstacles.filter((item) => item !== value) : [...state.obstacles, value];
  render();
}

function logo() {
  const src = 'https://static.wixstatic.com/media/e34422_f461fb2e8382455e8d0d7ba9d71eca1e~mv2.png/v1/fill/w_298,h_194,al_c,q_90,enc_avif,quality_auto/Solatrix%20Logo%20Sait%20Main.png';
  return `<div class="logoMark" aria-label="Solatrix Energy"><img class="logoImage" src="${src}" alt="Solatrix Energy" /></div>`;
}

function header() {
  return `<header class="siteHeader"><div class="headerInner"><a class="brand" href="#" data-action="step:0">${logo()}</a><div class="headerActions"><a class="headerCta" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">WhatsApp</a><button class="menuBtn" aria-label="Menu">☰</button></div></div></header>`;
}

function progress() {
  if (state.step === 0) return '';
  return `<div class="progressDots">${steps.slice(1).map((_, index) => `<span class="${index + 1 <= state.step ? 'done' : ''}"></span>`).join('')}</div>`;
}

function actions(primary) {
  return `<div class="actions"><button class="primaryBtn" data-action="next">${primary}</button>${state.step > 1 ? '<button class="ghostBtn" data-action="prev">חזרה</button>' : ''}</div>`;
}

function floatingDecor() {
  return `<div class="floatingDecor" aria-hidden="true"><span>☀️</span><span>⚡</span><span>🏠</span><span>📍</span></div>`;
}

function mapMock() {
  const surfaceShapes = state.surfaces.map((surface, index) => `<polygon class="surface ${index === state.surfaces.length - 1 ? 'active' : ''}" points="${surface.points}"></polygon>`).join('');
  const pins = state.obstacles.map((_, index) => {
    const coords = [[42,36], [66,56], [72,28], [35,64], [58,24]][index % 5];
    return `<circle cx="${coords[0]}" cy="${coords[1]}" r="3.8"></circle>`;
  }).join('');
  return `<div class="mapPanel"><div class="mapBadge">Satellite scan</div><svg class="roofCanvas" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" /></pattern></defs><rect x="0" y="0" width="100" height="100" class="mapBase"></rect><rect x="0" y="0" width="100" height="100" fill="url(#grid)" class="mapGrid"></rect><path class="building" d="M12 14 L86 9 L92 82 L18 90 Z"></path>${surfaceShapes}<g class="obstaclePins">${pins}</g></svg></div>`;
}

function heroScreen() {
  return `<section class="screen heroScreen">${floatingDecor()}<div class="heroGrid"><div class="card centerCard heroCard"><div class="eyebrow">Roof Check by Solatrix</div><h1>בדיקת גג סולארית</h1><p class="heroText">תוך דקה מקבלים הערכה ראשונית: שטח שימושי, כמות פאנלים, ייצור שנתי ורווח צפוי.</p><button class="primaryBtn large" data-action="next">התחילו בדיקת גג</button></div><div class="visualCard"><div class="miniRoof"><div class="roofTop"></div><div class="panelRows"><span></span><span></span><span></span><span></span></div></div><div class="visualStats"><b>25+</b><span>שנות רווח</span></div><div class="visualStats second"><b>☀️</b><span>חישוב מהיר</span></div></div></div></section>`;
}

function addressScreen() {
  return `<section class="screen">${floatingDecor()}<div class="card focusCard">${progress()}<div class="screenIcon">📍</div><h2>מה כתובת הגג?</h2><p class="subText">נאתר את הגג ונכין בסיס לסימון שטח הפאנלים.</p><input value="${state.address}" placeholder="לדוגמה: החרמון 10, חיפה" data-field="address" />${actions('מצא את הגג')}</div></section>`;
}

function roofScreen() {
  return `<section class="screen">${floatingDecor()}<div class="card focusCard">${progress()}<div class="screenIcon">🏠</div><h2>איזה סוג גג?</h2><div class="roofOptions"><button class="roofOption ${state.roofType === 'flat' ? 'selected' : ''}" data-action="roof:flat"><span>▰</span>גג שטוח</button><button class="roofOption ${state.roofType === 'sloped' ? 'selected' : ''}" data-action="roof:sloped"><span>◭</span>גג לא אחיד / כמה צדדים</button><button class="roofOption ${state.roofType === 'commercial' ? 'selected' : ''}" data-action="roof:commercial"><span>▦</span>גג מסחרי</button></div>${actions('המשך לסימון')}</div></section>`;
}

function drawScreen() {
  const isSloped = state.roofType === 'sloped';
  if (!isSloped && !state.surfaces.length) ensureDefaultSurface();
  const count = state.surfaces.length;
  return `<section class="screen mapScreen"><div class="card mapCard">${progress()}<div class="screenIcon">✏️</div><h2>${isSloped ? 'סמנו כל צד של הגג' : 'סמנו את שטח הגג'}</h2>${mapMock()}<div class="drawFooter">${isSloped ? `<div class="sideCount">${count} צדדים סומנו</div>` : ''}<div class="actions compactActions">${isSloped ? '<button class="primaryBtn" data-action="addSide">+ הוסף צד</button>' : '<button class="primaryBtn" data-action="setSingleRoof">סמן גג</button>'}${isSloped && count > 0 ? '<button class="ghostBtn" data-action="removeSide">בטל אחרון</button>' : ''}</div><button class="nextTextBtn" data-action="next" ${isSloped && count === 0 ? 'disabled' : ''}>סיימתי</button></div></div></section>`;
}

function obstaclesScreen() {
  const items = [['ac', 'מזגן', '❄️'], ['boiler', 'דוד', '💧'], ['shade', 'צל', '🌳'], ['access', 'יציאה לגג', '🚪'], ['solar', 'קולטים קיימים', '☀️']];
  return `<section class="screen mapScreen"><div class="card mapCard">${progress()}<div class="screenIcon">🧩</div><h2>מה נמצא על הגג?</h2>${mapMock()}<div class="obstacleGrid">${items.map(([key, label, icon]) => `<button class="obstacle ${state.obstacles.includes(key) ? 'selected' : ''}" data-action="obstacle:${key}"><span>${icon}</span>${label}</button>`).join('')}</div>${actions('המשך')}</div></section>`;
}

function analysisScreen() {
  return `<section class="screen">${floatingDecor()}<div class="card centerCard analysisCard"><div class="loader"></div><h2>מנתחים את הגג...</h2><p class="subText">בודקים שטח שימושי, כיוונים, הצללות ופוטנציאל ייצור.</p></div></section>`;
}

function reportScreen() {
  const report = calculateReport();
  return `<section class="screen reportScreen">${floatingDecor()}<div class="card reportCard"><div class="eyebrow">Solar report</div><h2>הגג מתאים למערכת של כ-${report.systemKw.toFixed(1)} kW</h2><div class="resultsGrid"><div><span>שטח גג</span><b>${formatNumber(report.roofArea)} m²</b></div><div><span>שטח שימושי</span><b>${formatNumber(report.usableArea)} m²</b></div><div><span>פאנלים</span><b>${report.panels}</b></div><div><span>ייצור שנתי</span><b>${formatNumber(report.annualProduction)} kWh</b></div><div><span>הכנסה שנתית</span><b>${formatMoney(report.annualRevenue)}</b></div><div><span>החזר השקעה</span><b>${report.payback.toFixed(1)} שנים</b></div><div><span>רווח 25 שנים</span><b>${formatMoney(report.profit25)}</b></div></div><div class="leadFields"><input placeholder="שם מלא" /><input placeholder="טלפון WhatsApp" /></div><button class="primaryBtn large" data-action="sendLead">קבלו PDF</button>${state.leadSent ? '<div class="successToast">הפרטים נשמרו.</div>' : ''}</div></section>`;
}

function renderScreen() {
  if (state.step === 0) return heroScreen();
  if (state.step === 1) return addressScreen();
  if (state.step === 2) return roofScreen();
  if (state.step === 3) return drawScreen();
  if (state.step === 4) return obstaclesScreen();
  if (state.step === 5) return analysisScreen();
  return reportScreen();
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `${header()}<main class="appShell">${renderScreen()}</main>`;
  root.querySelectorAll('[data-action]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      if (node.disabled) return;
      const action = node.getAttribute('data-action');
      if (action === 'next') setStep(state.step + 1);
      if (action === 'prev') setStep(state.step - 1);
      if (action === 'addSide') addRoofSide();
      if (action === 'removeSide') removeRoofSide();
      if (action === 'setSingleRoof') { state.surfaces = [createSurface(0)]; render(); }
      if (action === 'sendLead') { state.leadSent = true; render(); }
      if (action && action.startsWith('step:')) setStep(Number(action.split(':')[1]));
      if (action && action.startsWith('roof:')) selectRoofType(action.split(':')[1]);
      if (action && action.startsWith('obstacle:')) toggleObstacle(action.split(':')[1]);
    });
  });
  root.querySelectorAll('[data-field]').forEach((node) => node.addEventListener('input', () => { state[node.getAttribute('data-field')] = node.value; }));
}

render();
