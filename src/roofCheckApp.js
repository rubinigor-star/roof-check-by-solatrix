import '../styles.css';
import './router.css';
import { buildFullPdfReport } from './pdfReport.js';
import { calculateFinancialModel, FINANCIAL_DEFAULTS } from './financialModel.js';
import { getLeads, saveLead, updateLeadStatus, LEAD_STATUSES } from './leadsStore.js';

const CONFIG = {
  ...FINANCIAL_DEFAULTS,
  defaultPhone: '972547299727'
};

const LOGO_SRC = 'https://static.wixstatic.com/media/e34422_f461fb2e8382455e8d0d7ba9d71eca1e~mv2.png/v1/fill/w_298,h_194,al_c,q_90,enc_avif,quality_auto/Solatrix%20Logo%20Sait%20Main.png';
const BASE_PATH = '/roof-check';
const routes = ['', 'address', 'roof-type', 'roof-marking', 'obstacles', 'analysis', 'report', 'admin'];
const labels = ['ראשי', 'כתובת וחשבון', 'סוג גג', 'סימון גג', 'מכשולים', 'ניתוח', 'דוח', 'Admin'];

const state = {
  step: 0,
  address: '',
  monthlyBill: 850,
  roofType: 'flat',
  leadName: '',
  leadPhone: '',
  points: [],
  surfaces: [],
  obstacles: [],
  leadSent: false,
  menuOpen: false,
  timer: null
};

function stepFromPath() {
  const pathname = location.pathname.replace(/\/$/, '');
  const index = routes.findIndex((slug) => slug && pathname.endsWith(`/${slug}`));
  return index > 0 ? index : (location.hash === '#admin' ? 7 : 0);
}
state.step = stepFromPath();

function path(slug) {
  return slug ? `${BASE_PATH}/${slug}` : `${BASE_PATH}/`;
}

function go(step) {
  state.step = Math.max(0, Math.min(7, Number(step)));
  history.pushState({ step: state.step }, '', path(routes[state.step]));
  render();
  if (state.step === 5) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => go(6), 900);
  }
}

function fmt(value) {
  return Math.round(Number(value) || 0).toLocaleString('he-IL');
}

function money(value) {
  return `₪${fmt(value)}`;
}

function logo() {
  return `<div class="logoMark"><img class="logoImage" src="${LOGO_SRC}" alt="Solatrix" /></div>`;
}

function header() {
  const menu = [0, 1, 2, 3, 4, 6]
    .map((index) => `<a href="${path(routes[index])}" data-action="step:${index}" class="${state.step === index ? 'active' : ''}">${labels[index]}</a>`)
    .join('');
  return `<header class="siteHeader ${state.menuOpen ? 'menuOpen' : ''}"><div class="headerInner"><a class="brand" href="/">${logo()}</a><div class="headerActions"><a class="headerCta" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank">WhatsApp</a><button class="menuBtn" data-action="menu">${state.menuOpen ? '×' : '☰'}</button></div></div><nav class="mobileMenu">${menu}</nav></header>`;
}

function dots() {
  return state.step && state.step < 7
    ? `<div class="progressDots">${[1, 2, 3, 4, 5, 6].map((index) => `<span class="${index <= state.step ? 'done' : ''}"></span>`).join('')}</div>`
    : '';
}

function decor() {
  return '<div class="cardDecor"><i></i><i></i><i></i></div>';
}

function floats() {
  return '<div class="floatingDecor"><span>☀️</span><span>⚡</span><span>🏠</span><span>📍</span></div>';
}

function actions(title) {
  return `<div class="actions"><button class="primaryBtn" data-action="next">${title}</button>${state.step > 1 ? '<button class="ghostBtn" data-action="prev">חזרה</button>' : ''}</div>`;
}

function pointString(points = state.points) {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

function polygonArea(points) {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.max(20, Math.round(Math.abs(sum / 2) * 0.045));
}

function currentSurface() {
  return state.points.length >= 3
    ? { points: pointString(), area: polygonArea(state.points), factor: 1 }
    : null;
}

function allSurfaces() {
  const surfaces = [...state.surfaces];
  const draft = currentSurface();
  if (draft) surfaces.push(draft);
  return surfaces.length
    ? surfaces
    : [{ points: '17,58 77,42 86,78 24,88', area: 74, factor: 1 }];
}

function addPoint(event, node) {
  const rect = node.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * 100;
  const y = (event.clientY - rect.top) / rect.height * 100;
  state.points.push({
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  });
  render();
}

function finishSide() {
  const draft = currentSurface();
  if (draft) {
    state.surfaces.push(draft);
    state.points = [];
  }
}

function calculateReport() {
  const surfaces = allSurfaces();
  const roofArea = surfaces.reduce((sum, surface) => sum + surface.area, 0);
  const usableArea = roofArea * CONFIG.usableRoofFactor;
  const roofPotentialKwp = usableArea / CONFIG.sqmPerKwp;
  const dcCapacityKwp = state.roofType === 'commercial'
    ? roofPotentialKwp
    : Math.min(roofPotentialKwp, CONFIG.residentialLimitKwp);
  const annualConsumptionKwh = (Number(state.monthlyBill || 0) * 12) / CONFIG.residentialBuyRate;
  const financial = calculateFinancialModel({ dcCapacityKwp, annualConsumptionKwh });

  return {
    ...financial,
    systemKw: dcCapacityKwp,
    roofPotentialKw: roofPotentialKwp,
    roofArea,
    usableArea,
    panels: Math.max(Math.floor(dcCapacityKwp / CONFIG.panelKwp), 1)
  };
}

function map(interactive = false) {
  const surfaces = allSurfaces();
  const polygons = surfaces
    .map((surface, index) => `<polygon class="surface ${index === surfaces.length - 1 ? 'active' : ''}" points="${surface.points}"></polygon>`)
    .join('');
  const line = state.points.length > 1 ? `<polyline class="draftLine" points="${pointString()}"></polyline>` : '';
  const points = state.points
    .map((point, index) => `<g class="draftPoint"><circle cx="${point.x}" cy="${point.y}" r="3"></circle><text x="${point.x}" y="${point.y - 4}" text-anchor="middle">${index + 1}</text></g>`)
    .join('');
  return `<div class="mapPanel ${interactive ? 'interactiveMap' : ''}" ${interactive ? 'data-action="mapPoint"' : ''}><div class="mapBadge">${interactive ? (state.points.length ? `${state.points.length} נקודות` : 'Tap to mark') : 'Roof marked'}</div><div class="scanPulse"></div><svg class="roofCanvas" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" /></pattern></defs><rect width="100" height="100" class="mapBase"></rect><rect width="100" height="100" fill="url(#grid)" class="mapGrid"></rect><path class="sunRay" d="M5 15 L35 42 M4 38 L34 52 M12 60 L42 62"></path><path class="building" d="M12 14 L86 9 L92 82 L18 90 Z"></path>${polygons}${line}${points}</svg></div>`;
}

function hero() {
  return `<section class="screen heroScreen">${floats()}<div class="heroGrid"><div class="card centerCard heroCard">${decor()}<div class="eyebrow">Roof Check by Solatrix</div><h1>בדיקת גג סולארית</h1><p class="heroText">תוך דקה מקבלים הערכה ראשונית.</p><div class="featureChips"><span>☀️ חישוב מהיר</span><span>📍 לפי כתובת</span><span>📄 דוח PDF מלא</span></div><button class="primaryBtn large" data-action="next">התחילו בדיקת גג</button></div><div class="visualCard"><div class="orbit orbitOne"></div><div class="miniRoof"><div class="roofTop"></div><div class="panelRows"><span></span><span></span><span></span><span></span></div></div><div class="visualStats"><b>PDF</b><span>דוח מלא</span></div></div></div></section>`;
}

function address() {
  return `<section class="screen">${floats()}<div class="card focusCard">${decor()}${dots()}<div class="screenIcon">📍</div><h2>כתובת וחשבון חשמל</h2><div class="fieldGroup"><label>כתובת הגג</label><input value="${state.address}" data-field="address" placeholder="לדוגמה: החרמון 10, חיפה" /></div><div class="fieldGroup"><label>חשבון חשמל חודשי</label><input value="${state.monthlyBill}" data-field="monthlyBill" inputmode="numeric" /></div>${actions('מצא את הגג')}</div></section>`;
}

function roof() {
  return `<section class="screen">${floats()}<div class="card focusCard">${decor()}${dots()}<div class="screenIcon">🏠</div><h2>איזה סוג גג?</h2><div class="roofOptions"><button class="roofOption ${state.roofType === 'flat' ? 'selected' : ''}" data-action="roof:flat"><span>▰</span><b>גג שטוח</b><small>עד 22.5 kWp ביתי</small></button><button class="roofOption ${state.roofType === 'sloped' ? 'selected' : ''}" data-action="roof:sloped"><span>◭</span><b>כמה צדדים</b><small>נסמן כל צד</small></button><button class="roofOption ${state.roofType === 'commercial' ? 'selected' : ''}" data-action="roof:commercial"><span>▦</span><b>גג תעשייתי</b><small>מעל 22.5 kWp לפי ₪0.39</small></button></div>${actions('המשך לסימון')}</div></section>`;
}

function draw() {
  const count = state.points.length;
  return `<section class="screen mapScreen"><div class="card mapCard">${decor()}${dots()}<div class="screenIcon">✏️</div><h2>סמנו את שטח הגג</h2><p class="subText">לחצו על פינות הגג לפי הסדר. כל לחיצה מוסיפה נקודה קטנה וקו כחול.</p>${map(true)}<div class="markStatus">${count ? `סומנו ${count} נקודות${count >= 3 ? ' - אפשר להמשיך' : ''}` : 'לחצו על פינות הגג כדי להתחיל סימון.'}</div><div class="drawFooter"><div class="actions compactActions"><button class="ghostBtn" data-action="undoPoint" ${!count ? 'disabled' : ''}>בטל נקודה</button><button class="ghostBtn" data-action="clearRoof">נקה סימון</button>${state.roofType === 'sloped' && count >= 3 ? '<button class="primaryBtn" data-action="finishSide">סיים צד והוסף עוד</button>' : ''}</div><button class="nextTextBtn" data-action="next" ${count < 3 && !state.surfaces.length ? 'disabled' : ''}>סיימתי</button></div></div></section>`;
}

function obstacles() {
  const items = [['ac', 'מזגן', '❄️'], ['boiler', 'דוד', '💧'], ['shade', 'צל', '🌳'], ['access', 'יציאה לגג', '🚪'], ['solar', 'קולטים קיימים', '☀️']];
  return `<section class="screen mapScreen"><div class="card mapCard">${decor()}${dots()}<div class="screenIcon">🧩</div><h2>מה נמצא על הגג?</h2>${map()}<div class="obstacleGrid">${items.map(([key, label, icon]) => `<button class="obstacle ${state.obstacles.includes(key) ? 'selected' : ''}" data-action="obstacle:${key}"><span>${icon}</span>${label}</button>`).join('')}</div>${actions('המשך')}</div></section>`;
}

function analysis() {
  return `<section class="screen">${floats()}<div class="card centerCard analysisCard">${decor()}<div class="loader"></div><h2>מנתחים את הגג...</h2><p class="subText">בודקים שטח, ייצור, מסלול תעריף והחזר השקעה.</p></div></section>`;
}

function tariffExplanation(report) {
  if (report.isResidential) {
    return `חישוב ביתי: ${Math.round(report.selfUseShare * 100)}% צריכה עצמית לפי ₪${CONFIG.residentialBuyRate.toFixed(2)}, והיתרה נמכרת לפי ₪${CONFIG.residentialExportRate.toFixed(2)}.`;
  }
  return `חישוב תעשייתי: כל הייצור מחושב לפי תעריף ממוצע של ₪${CONFIG.industrialExportRate.toFixed(2)} לקוט״ש.`;
}

function report() {
  const result = calculateReport();
  return `<section class="screen reportScreen">${floats()}<div class="card reportCard">${decor()}<div class="eyebrow">דוח סולארי ראשוני</div><h2>הגג מתאים למערכת של כ-${result.systemKw.toFixed(1)} kWp</h2><div class="reportHeroGraphic"><div><strong>${money(result.annualSavings)}</strong><span>ערך שנתי בשנה הראשונה</span></div><div><strong>${result.paybackWithVat.toFixed(1)}</strong><span>החזר כולל מע״מ</span></div></div><div class="successToast">${tariffExplanation(result)} ירידת תפוקה: 0.4% בכל שנה החל משנה 2.</div><div class="resultsGrid"><div><span>סוג חישוב</span><b>${result.isResidential ? 'ביתי' : 'תעשייתי'}</b></div><div><span>עלות לפני מע״מ</span><b>${money(result.costBeforeVat)}</b></div><div><span>עלות כולל מע״מ</span><b>${money(result.costWithVat)}</b></div><div><span>ייצור שנה 1</span><b>${fmt(result.annualProduction)} kWh</b></div><div><span>ערך קוט״ש ממוצע</span><b>₪${result.effectiveTariff.toFixed(3)}</b></div><div><span>החזר לפני מע״מ</span><b>${result.paybackBeforeVat.toFixed(1)} שנים</b></div><div><span>ייצור מצטבר 25 שנים</span><b>${fmt(result.totalProduction25)} kWh</b></div><div><span>רווח 25 שנים כולל מע״מ</span><b>${money(result.profit25WithVat)}</b></div></div><div class="leadFields"><input placeholder="שם מלא" value="${state.leadName}" data-field="leadName" /><input placeholder="טלפון WhatsApp" value="${state.leadPhone}" data-field="leadPhone" /></div><button class="primaryBtn large" data-action="generatePdf">קבלו דוח PDF מלא</button>${state.leadSent ? '<div class="successToast">הדוח נפתח והפנייה נשמרה.</div>' : ''}</div></section>`;
}

function admin() {
  const leads = getLeads();
  return `<section class="screen adminScreen"><div class="card adminCard"><h2>Solatrix CRM</h2><p>${leads.length} לידים</p><p style="display:none">${LEAD_STATUSES.join(',')} ${updateLeadStatus ? '' : ''}</p></div></section>`;
}

function save(result) {
  saveLead({
    name: state.leadName || 'ללא שם',
    phone: state.leadPhone || '',
    address: state.address,
    monthlyBill: state.monthlyBill,
    roofType: state.roofType,
    surfaces: allSurfaces(),
    obstacles: state.obstacles,
    systemKw: result.systemKw,
    annualProduction: result.annualProduction,
    annualSavings: result.annualSavings,
    payback: result.paybackWithVat,
    profit25: result.profit25WithVat,
    calculationMode: result.calculationMode,
    status: 'חדש'
  });
}

function pdf() {
  finishSide();
  const result = calculateReport();
  save(result);
  const html = buildFullPdfReport({
    report: result,
    state,
    config: CONFIG,
    logoSrc: LOGO_SRC,
    formatNumber: fmt,
    formatMoney: money
  });
  const popup = open('', '_blank');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  state.leadSent = true;
  render();
}

function screen() {
  return [hero, address, roof, draw, obstacles, analysis, report, admin][state.step]();
}

function act(action, node, event) {
  if (node.disabled) return;
  if (action === 'menu') {
    state.menuOpen = !state.menuOpen;
    render();
  } else if (action === 'next') {
    if (state.step === 3) finishSide();
    go(state.step + 1);
  } else if (action === 'prev') {
    go(state.step - 1);
  } else if (action === 'mapPoint') {
    addPoint(event, node);
  } else if (action === 'undoPoint') {
    state.points.pop();
    render();
  } else if (action === 'clearRoof') {
    state.points = [];
    state.surfaces = [];
    render();
  } else if (action === 'finishSide') {
    finishSide();
    render();
  } else if (action === 'generatePdf') {
    pdf();
  } else if (action.startsWith('step:')) {
    go(action.split(':')[1]);
  } else if (action.startsWith('roof:')) {
    state.roofType = action.split(':')[1];
    state.points = [];
    state.surfaces = [];
    render();
  } else if (action.startsWith('obstacle:')) {
    const value = action.split(':')[1];
    state.obstacles = state.obstacles.includes(value)
      ? state.obstacles.filter((item) => item !== value)
      : [...state.obstacles, value];
    render();
  }
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `${header()}<main class="appShell">${screen()}</main>`;
  root.querySelectorAll('[data-action]').forEach((node) => node.addEventListener('click', (event) => {
    event.preventDefault();
    act(node.dataset.action, node, event);
  }));
  root.querySelectorAll('[data-field]').forEach((node) => node.addEventListener('input', () => {
    state[node.dataset.field] = node.value;
  }));
}

addEventListener('popstate', () => {
  state.step = stepFromPath();
  render();
});

render();
