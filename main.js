import './styles.css';
import { buildFullPdfReport } from './src/pdfReport.js';
import { getLeads, saveLead, updateLeadStatus, LEAD_STATUSES } from './src/leadsStore.js';

const CONFIG = { productionPerKw: 1650, buyRate: 0.64, sellRate: 0.48, installCostPerKw: 2900, sqmPerKw: 7, panelKw: 0.63, usableRoofFactor: 0.82, yearlyTariffGrowth: 0.04, yearlyPanelDegradation: 0.005, defaultPhone: '972547299727' };
const LOGO_SRC = 'https://static.wixstatic.com/media/e34422_f461fb2e8382455e8d0d7ba9d71eca1e~mv2.png/v1/fill/w_298,h_194,al_c,q_90,enc_avif,quality_auto/Solatrix%20Logo%20Sait%20Main.png';
const shapePresets = [
  { points: '17,58 77,42 86,78 24,88', area: 74, orientation: 'South', factor: 1 },
  { points: '14,18 48,10 52,36 16,46', area: 36, orientation: 'East', factor: 0.88 },
  { points: '58,14 86,18 80,38 56,34', area: 22, orientation: 'West', factor: 0.82 },
  { points: '28,42 55,35 63,58 35,66', area: 29, orientation: 'South-East', factor: 0.94 },
  { points: '48,62 82,56 86,77 52,84', area: 31, orientation: 'South-West', factor: 0.9 }
];
const state = { step: 0, address: '', monthlyBill: 850, roofType: '', leadName: '', leadPhone: '', surfaces: [], obstacles: [], leadSent: false, menuOpen: false, analysisTimer: null, selectedLeadId: null };
const steps = ['Start', 'Address', 'Roof', 'Draw', 'Obstacles', 'Analysis', 'Report', 'Admin'];

function formatNumber(value) { return Math.round(value).toLocaleString('he-IL'); }
function formatMoney(value) { return '₪' + formatNumber(value); }
function createSurface(index) { return { id: index + 1, name: `Side ${index + 1}`, ...shapePresets[index % shapePresets.length] }; }
function calculateSurface(surface) { const usableArea = Math.max(surface.area * CONFIG.usableRoofFactor, 0); const kw = usableArea / CONFIG.sqmPerKw; return { usableArea, kw, panels: Math.max(Math.floor(kw / CONFIG.panelKw), 1) }; }
function ensureDefaultSurface() { if (!state.surfaces.length) state.surfaces = [createSurface(0)]; }
function calculateReport() {
  ensureDefaultSurface();
  const systemKw = state.surfaces.reduce((sum, s) => sum + calculateSurface(s).kw, 0);
  const weightedFactor = state.surfaces.reduce((sum, s) => sum + s.factor * calculateSurface(s).kw, 0) / Math.max(systemKw, 1);
  const annualProduction = systemKw * CONFIG.productionPerKw * weightedFactor;
  const annualConsumption = (Number(state.monthlyBill || 0) * 12) / CONFIG.buyRate;
  const selfConsumed = Math.min(annualProduction * 0.45, annualConsumption);
  const exported = Math.max(annualProduction - selfConsumed, 0);
  const annualSavings = selfConsumed * CONFIG.buyRate + exported * CONFIG.sellRate;
  const effectiveTariff = annualSavings / Math.max(annualProduction, 1);
  const selfUseShare = selfConsumed / Math.max(annualProduction, 1) * 100;
  const cost = systemKw * CONFIG.installCostPerKw;
  const payback = cost / Math.max(annualSavings, 1);
  const profit25 = annualSavings * 25 - cost;
  const panels = state.surfaces.reduce((sum, s) => sum + calculateSurface(s).panels, 0);
  const roofArea = state.surfaces.reduce((sum, s) => sum + s.area, 0);
  const usableArea = state.surfaces.reduce((sum, s) => sum + calculateSurface(s).usableArea, 0);
  return { systemKw, annualProduction, annualConsumption, selfConsumed, exported, annualSavings, effectiveTariff, selfUseShare, cost, payback, profit25, panels, roofArea, usableArea };
}
function createCurrentLead(report = calculateReport()) {
  return saveLead({
    name: state.leadName || 'ללא שם', phone: state.leadPhone || '', address: state.address || '', monthlyBill: state.monthlyBill,
    roofType: state.roofType, surfaces: state.surfaces, obstacles: state.obstacles,
    systemKw: report.systemKw, annualProduction: report.annualProduction, annualSavings: report.annualSavings, payback: report.payback, profit25: report.profit25,
    status: 'חדש'
  });
}
function setStep(step) { clearTimeout(state.analysisTimer); state.menuOpen = false; state.step = Math.max(0, Math.min(steps.length - 1, step)); render(); if (state.step === 5) state.analysisTimer = setTimeout(() => setStep(6), 1800); }
function selectRoofType(type) { state.roofType = type; state.surfaces = []; render(); }
function markRoof() { state.roofType === 'sloped' ? state.surfaces.push(createSurface(state.surfaces.length)) : state.surfaces = [createSurface(state.surfaces.length ? state.surfaces[0].id : 0)]; render(); }
function removeRoofSide() { state.surfaces.pop(); render(); }
function toggleObstacle(value) { state.obstacles = state.obstacles.includes(value) ? state.obstacles.filter((x) => x !== value) : [...state.obstacles, value]; render(); }
function toggleMenu() { state.menuOpen = !state.menuOpen; render(); }
function closeMenu() { if (state.menuOpen) { state.menuOpen = false; render(); } }
function logo() { return `<div class="logoMark" aria-label="Solatrix Energy"><img class="logoImage" src="${LOGO_SRC}" alt="Solatrix Energy" /></div>`; }
function header() { return `<header class="siteHeader ${state.menuOpen ? 'menuOpen' : ''}"><div class="headerInner"><a class="brand" href="#" data-action="step:0">${logo()}</a><div class="headerActions"><a class="headerCta" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">WhatsApp</a><button class="menuBtn" data-action="toggleMenu">${state.menuOpen ? '×' : '☰'}</button></div></div><nav class="mobileMenu"><button data-action="step:0">ראשי</button><button data-action="step:1">כתובת וחשבון</button><button data-action="step:3">סימון גג</button><button data-action="step:6">דוח</button><button data-action="step:7">לידים</button><a href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">WhatsApp</a></nav></header>`; }
function progress() { return state.step === 0 || state.step === 7 ? '' : `<div class="progressDots">${steps.slice(1, 7).map((_, i) => `<span class="${i + 1 <= state.step ? 'done' : ''}"></span>`).join('')}</div>`; }
function actions(primary) { return `<div class="actions"><button class="primaryBtn" data-action="next">${primary}</button>${state.step > 1 ? '<button class="ghostBtn" data-action="prev">חזרה</button>' : ''}</div>`; }
function floatingDecor() { return `<div class="floatingDecor" aria-hidden="true"><span>☀️</span><span>⚡</span><span>🏠</span><span>📍</span></div>`; }
function cardDecor() { return `<div class="cardDecor" aria-hidden="true"><i></i><i></i><i></i></div>`; }
function miniSolarGraphic() { return `<div class="miniSolarGraphic" aria-hidden="true"><div class="graphicSun">☀️</div><div class="graphicRoof"><span></span><span></span><span></span><span></span></div><div class="graphicBeam"></div></div>`; }
function mapMock(interactive = false) {
  const surfaceShapes = state.surfaces.map((s, i) => `<polygon class="surface ${i === state.surfaces.length - 1 ? 'active' : ''}" points="${s.points}"></polygon>`).join('');
  const pins = state.obstacles.map((_, i) => { const c = [[42,36], [66,56], [72,28], [35,64], [58,24]][i % 5]; return `<circle cx="${c[0]}" cy="${c[1]}" r="3.8"></circle>`; }).join('');
  return `<div class="mapPanel ${interactive ? 'interactiveMap' : ''}" ${interactive ? 'data-action="markRoof"' : ''}><div class="mapBadge">${state.surfaces.length ? 'Roof marked' : 'Tap to mark'}</div>${interactive ? '<div class="markHint">לחצו על המפה כדי לסמן את שטח הגג</div>' : ''}<div class="scanPulse"></div><svg class="roofCanvas" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" /></pattern></defs><rect x="0" y="0" width="100" height="100" class="mapBase"></rect><rect x="0" y="0" width="100" height="100" fill="url(#grid)" class="mapGrid"></rect><path class="sunRay" d="M5 15 L35 42 M4 38 L34 52 M12 60 L42 62"></path><path class="building" d="M12 14 L86 9 L92 82 L18 90 Z"></path>${surfaceShapes}<g class="obstaclePins">${pins}</g></svg></div>`;
}
function heroScreen() { return `<section class="screen heroScreen">${floatingDecor()}<div class="heroGrid"><div class="card centerCard heroCard">${cardDecor()}<div class="eyebrow">Roof Check by Solatrix</div><h1>בדיקת גג סולארית</h1><p class="heroText">תוך דקה מקבלים הערכה ראשונית: שטח שימושי, כמות פאנלים, ייצור שנתי ורווח צפוי.</p><div class="featureChips"><span>☀️ חישוב מהיר</span><span>📍 לפי כתובת</span><span>📄 דוח PDF מלא</span></div><button class="primaryBtn large" data-action="next">התחילו בדיקת גג</button></div><div class="visualCard"><div class="orbit orbitOne"></div><div class="orbit orbitTwo"></div><div class="miniRoof"><div class="roofTop"></div><div class="panelRows"><span></span><span></span><span></span><span></span></div></div><div class="visualStats"><b>CRM</b><span>לידים נשמרים</span></div><div class="visualStats second"><b>☀️</b><span>חישוב מהיר</span></div></div></div></section>`; }
function addressScreen() { return `<section class="screen">${floatingDecor()}<div class="card focusCard">${cardDecor()}${miniSolarGraphic()}${progress()}<div class="screenIcon">📍</div><h2>כתובת וחשבון חשמל</h2><p class="subText">החשבון החודשי עוזר לחשב כמה מהייצור יחסוך קנייה ב־₪${CONFIG.buyRate} וכמה יימכר ב־₪${CONFIG.sellRate}.</p><div class="fieldGroup"><label>כתובת הגג</label><input value="${state.address}" placeholder="לדוגמה: החרמון 10, חיפה" data-field="address" /></div><div class="fieldGroup"><label>חשבון חשמל חודשי משוער</label><input value="${state.monthlyBill}" inputmode="numeric" data-field="monthlyBill" /></div>${actions('מצא את הגג')}</div></section>`; }
function roofScreen() { return `<section class="screen">${floatingDecor()}<div class="card focusCard">${cardDecor()}${progress()}<div class="screenIcon">🏠</div><h2>איזה סוג גג?</h2><div class="roofOptions"><button class="roofOption ${state.roofType === 'flat' ? 'selected' : ''}" data-action="roof:flat"><span>▰</span><b>גג שטוח</b><small>הכי פשוט לסימון מהיר</small></button><button class="roofOption ${state.roofType === 'sloped' ? 'selected' : ''}" data-action="roof:sloped"><span>◭</span><b>גג לא אחיד / כמה צדדים</b><small>נסמן כל צד בנפרד</small></button><button class="roofOption ${state.roofType === 'commercial' ? 'selected' : ''}" data-action="roof:commercial"><span>▦</span><b>גג מסחרי</b><small>שטח גדול, פוטנציאל גבוה</small></button></div>${actions('המשך לסימון')}</div></section>`; }
function drawScreen() { const count = state.surfaces.length; const isSloped = state.roofType === 'sloped'; return `<section class="screen mapScreen"><div class="card mapCard">${cardDecor()}${progress()}<div class="screenIcon">✏️</div><h2>${isSloped ? 'סמנו כל צד של הגג' : 'סמנו את שטח הגג'}</h2>${mapMock(true)}<div class="markStatus">${count ? `סומנו ${count} שטחי גג` : 'עדיין לא סומן שטח. לחצו על המפה או על הכפתור.'}</div><div class="drawFooter"><div class="actions compactActions"><button class="primaryBtn" data-action="markRoof">${isSloped ? '+ סמן צד נוסף' : 'סמן גג'}</button>${count > 0 ? '<button class="ghostBtn" data-action="removeSide">בטל אחרון</button>' : ''}</div><button class="nextTextBtn" data-action="next" ${count === 0 ? 'disabled' : ''}>סיימתי</button></div></div></section>`; }
function obstaclesScreen() { const items = [['ac','מזגן','❄️'],['boiler','דוד','💧'],['shade','צל','🌳'],['access','יציאה לגג','🚪'],['solar','קולטים קיימים','☀️']]; return `<section class="screen mapScreen"><div class="card mapCard">${cardDecor()}${progress()}<div class="screenIcon">🧩</div><h2>מה נמצא על הגג?</h2>${mapMock()}<div class="obstacleGrid">${items.map(([key,label,icon]) => `<button class="obstacle ${state.obstacles.includes(key) ? 'selected' : ''}" data-action="obstacle:${key}"><span>${icon}</span>${label}</button>`).join('')}</div>${actions('המשך')}</div></section>`; }
function analysisScreen() { return `<section class="screen">${floatingDecor()}<div class="card centerCard analysisCard">${cardDecor()}<div class="loader"></div><h2>מנתחים את הגג...</h2><p class="subText">בודקים שטח שימושי, כיוונים, צריכה עצמית, מכירה לרשת והחזר השקעה.</p><div class="analysisBadges"><span>שטח</span><span>ייצור</span><span>תעריף משולב</span><span>ROI</span></div></div></section>`; }
function tariffMix(report) { const selfWidth = Math.max(8, Math.min(92, report.selfUseShare)); const exportWidth = Math.max(8, 100 - selfWidth); return `<div class="tariffMix"><div class="mixHead"><b>תמהיל חיסכון ומכירה</b><span>תעריף אפקטיבי: ₪${report.effectiveTariff.toFixed(2)} לקוט״ש</span></div><div class="mixBar"><i style="width:${selfWidth}%"></i><em style="width:${exportWidth}%"></em></div><div class="mixLegend"><span><i></i>צריכה עצמית: ${formatNumber(report.selfConsumed)} kWh לפי ₪${CONFIG.buyRate}</span><span><em></em>מכירה לרשת: ${formatNumber(report.exported)} kWh לפי ₪${CONFIG.sellRate}</span></div></div>`; }
function reportScreen() { const report = calculateReport(); return `<section class="screen reportScreen">${floatingDecor()}<div class="card reportCard">${cardDecor()}<div class="eyebrow">דוח סולארי ראשוני</div><h2>הגג מתאים למערכת של כ-${report.systemKw.toFixed(1)} kW</h2><div class="reportHeroGraphic"><div><strong>${formatMoney(report.annualSavings)}</strong><span>חיסכון/הכנסה שנתית משוערת</span></div><div class="sparkLine"><i style="height:36%"></i><i style="height:54%"></i><i style="height:68%"></i><i style="height:80%"></i><i style="height:92%"></i></div></div>${tariffMix(report)}<div class="resultsGrid"><div><span>שטח גג</span><b>${formatNumber(report.roofArea)} m²</b></div><div><span>שטח שימושי</span><b>${formatNumber(report.usableArea)} m²</b></div><div><span>פאנלים</span><b>${report.panels}</b></div><div><span>ייצור שנתי</span><b>${formatNumber(report.annualProduction)} kWh</b></div><div><span>חיסכון/הכנסה שנתית</span><b>${formatMoney(report.annualSavings)}</b></div><div><span>החזר השקעה</span><b>${report.payback.toFixed(1)} שנים</b></div><div><span>רווח 25 שנים</span><b>${formatMoney(report.profit25)}</b></div></div><div class="leadFields"><input placeholder="שם מלא" value="${state.leadName}" data-field="leadName" /><input placeholder="טלפון WhatsApp" value="${state.leadPhone}" data-field="leadPhone" /></div><button class="primaryBtn large" data-action="generatePdf">קבלו דוח PDF מלא</button>${state.leadSent ? '<div class="successToast">הדוח נפתח והליד נשמר בלוח הבקרה.</div>' : ''}</div></section>`; }
function adminScreen() {
  const leads = getLeads();
  const selected = state.selectedLeadId ? leads.find((lead) => lead.id === state.selectedLeadId) : leads[0];
  const cards = [['סה״כ לידים', leads.length], ['חדשים', leads.filter((l) => l.status === 'חדש').length], ['סיורים', leads.filter((l) => l.status === 'נקבע סיור').length], ['עסקאות', leads.filter((l) => l.status === 'עסקה').length]];
  return `<section class="screen adminScreen"><div class="card adminCard">${cardDecor()}<div class="eyebrow">Solatrix CRM</div><h2>לוח בקרה לידים</h2><div class="adminStats">${cards.map(([k,v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div><div class="adminLayout"><div class="leadsTable"><table><thead><tr><th>שם</th><th>טלפון</th><th>כתובת</th><th>מערכת</th><th>סטטוס</th></tr></thead><tbody>${leads.length ? leads.map((lead) => `<tr data-action="selectLead:${lead.id}"><td>${lead.name}</td><td>${lead.phone || '-'}</td><td>${lead.address || '-'}</td><td>${Number(lead.systemKw || 0).toFixed(1)} kW</td><td>${lead.status}</td></tr>`).join('') : '<tr><td colspan="5">אין עדיין לידים. צור דוח PDF כדי לשמור ליד ראשון.</td></tr>'}</tbody></table></div>${selected ? `<div class="leadDetail"><h3>${selected.name}</h3><p>${selected.address || 'אין כתובת'}<br/>${selected.phone || 'אין טלפון'}</p><div class="resultsGrid"><div><span>מערכת</span><b>${Number(selected.systemKw || 0).toFixed(1)} kW</b></div><div><span>חיסכון שנתי</span><b>${formatMoney(selected.annualSavings || 0)}</b></div><div><span>החזר</span><b>${Number(selected.payback || 0).toFixed(1)} שנים</b></div></div><label class="fieldGroup"><span>סטטוס</span><select data-lead-status="${selected.id}">${LEAD_STATUSES.map((status) => `<option ${status === selected.status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>${mapMock(false)}</div>` : ''}</div></div></section>`;
}
function generatePdfReport() { const report = calculateReport(); createCurrentLead(report); const html = buildFullPdfReport({ report, state, config: CONFIG, logoSrc: LOGO_SRC, formatNumber, formatMoney }); const win = window.open('', '_blank'); if (!win) return; win.document.open(); win.document.write(html); win.document.close(); state.leadSent = true; render(); }
function renderScreen() { if (state.step === 0) return heroScreen(); if (state.step === 1) return addressScreen(); if (state.step === 2) return roofScreen(); if (state.step === 3) return drawScreen(); if (state.step === 4) return obstaclesScreen(); if (state.step === 5) return analysisScreen(); if (state.step === 7) return adminScreen(); return reportScreen(); }
function render() {
  const root = document.getElementById('root');
  root.innerHTML = `${header()}<main class="appShell" data-action="closeMenu">${renderScreen()}</main>`;
  root.querySelectorAll('[data-action]').forEach((node) => node.addEventListener('click', (event) => {
    const action = node.getAttribute('data-action'); if (action !== 'closeMenu') event.preventDefault(); if (node.disabled) return;
    if (action === 'toggleMenu') toggleMenu(); if (action === 'closeMenu') closeMenu(); if (action === 'next') setStep(state.step + 1); if (action === 'prev') setStep(state.step - 1); if (action === 'markRoof') markRoof(); if (action === 'removeSide') removeRoofSide(); if (action === 'generatePdf') generatePdfReport(); if (action && action.startsWith('step:')) setStep(Number(action.split(':')[1])); if (action && action.startsWith('roof:')) selectRoofType(action.split(':')[1]); if (action && action.startsWith('obstacle:')) toggleObstacle(action.split(':')[1]); if (action && action.startsWith('selectLead:')) { state.selectedLeadId = action.split(':')[1]; render(); }
  }));
  root.querySelectorAll('[data-field]').forEach((node) => node.addEventListener('input', () => { state[node.getAttribute('data-field')] = node.value; }));
  root.querySelectorAll('[data-lead-status]').forEach((node) => node.addEventListener('change', () => { updateLeadStatus(node.getAttribute('data-lead-status'), node.value); render(); }));
}
render();
