const PATCH_ID = 'solatrix-govmap-original-skeleton-patch-v1';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const patchState = {
  map: null,
  layerGroup: null,
  currentPoints: [],
  surfaces: [],
  drawing: false,
  initializedPath: '',
  lastLog: ''
};

const CONFIG = {
  productionPerKw: 1650,
  buyRate: 0.64,
  sellRate: 0.48,
  installCostPerKw: 2900,
  sqmPerKw: 7,
  panelKw: 0.63,
  usableRoofFactor: 0.82
};

function injectStyles() {
  if (document.getElementById(`${PATCH_ID}-style`)) return;
  const style = document.createElement('style');
  style.id = `${PATCH_ID}-style`;
  style.textContent = `
    .solatrixRealMapWrap{position:relative;width:100%;height:clamp(360px,52vh,620px);border-radius:30px;overflow:hidden;background:#e8ddd0;box-shadow:inset 0 0 0 1px rgba(47,35,22,.1)}
    .solatrixRealMap{position:absolute;inset:0;z-index:1;direction:ltr}
    .solatrixMapToolbar{position:absolute;z-index:3;right:16px;top:16px;display:flex;flex-wrap:wrap;gap:10px;direction:rtl;max-width:min(460px,calc(100% - 32px))}
    .solatrixMapToolbar button{border:0;border-radius:999px;padding:10px 15px;font-family:inherit;font-weight:900;cursor:pointer;background:#fff;color:#241a10;box-shadow:0 10px 24px rgba(25,18,10,.12)}
    .solatrixMapToolbar button.primary{background:linear-gradient(135deg,var(--orange,#f5a11a),var(--orange2,#ffbd55));color:#17100a}
    .solatrixMapToolbar button.danger{background:#fff1f1;color:#b02b2b}
    .solatrixMapHint{position:absolute;z-index:3;right:16px;bottom:16px;max-width:min(520px,calc(100% - 32px));border-radius:22px;padding:13px 16px;background:rgba(255,255,255,.92);box-shadow:0 12px 28px rgba(30,20,10,.12);font-size:15px;font-weight:800;color:#4a3b2a;direction:rtl}
    .solatrixMapHint.success{background:rgba(232,251,242,.95);color:#16734a}
    .solatrixMapSurfaceList{position:absolute;z-index:3;left:16px;top:16px;display:grid;gap:8px;direction:rtl;max-width:240px}
    .solatrixMapSurfaceList div{border-radius:18px;background:rgba(255,255,255,.92);padding:10px 12px;font-size:14px;font-weight:900;color:#31251a;box-shadow:0 10px 22px rgba(25,18,10,.11)}
    .leaflet-container{font-family:inherit;background:#e8ddd0}
    .solatrixRoofPoint{width:9px!important;height:9px!important;border-radius:50%;background:#0b6fff;border:2px solid #fff;box-shadow:0 0 0 2px rgba(11,111,255,.35),0 4px 12px rgba(0,0,0,.25)}
    .solatrixDrawMode .leaflet-container{cursor:crosshair!important}
    .mapPanel.solatrixMapInjected{background:transparent;padding:0;min-height:360px;overflow:hidden}
    .mapPanel.solatrixMapInjected::before,.mapPanel.solatrixMapInjected .scanPulse,.mapPanel.solatrixMapInjected .roofCanvas,.mapPanel.solatrixMapInjected .mapBadge{display:none!important}
    .markStatus.solatrixPatched{background:#eaf7ff;border:1px solid rgba(11,111,255,.2);color:#145ea8}
    @media(max-width:760px){.solatrixRealMapWrap{height:460px;border-radius:24px}.solatrixMapToolbar{right:10px;left:10px;top:10px}.solatrixMapHint{right:10px;left:10px;bottom:10px}.solatrixMapSurfaceList{left:10px;top:auto;bottom:88px}}
  `;
  document.head.appendChild(style);
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.defer = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getAddressCenter() {
  const address = (document.querySelector('[data-field="address"]')?.value || '').toLowerCase();
  if (address.includes('ירושלים') || address.includes('jerusalem')) return [31.778, 35.225];
  if (address.includes('תל') || address.includes('tel aviv')) return [32.0853, 34.7818];
  if (address.includes('חיפה') || address.includes('haifa') || address.includes('חרמון')) return [32.7937, 34.9892];
  if (address.includes('באר') || address.includes('beer')) return [31.2529, 34.7915];
  return [32.7937, 34.9892];
}

function polygonAreaM2(latlngs) {
  if (!latlngs || latlngs.length < 3) return 0;
  const earth = 6378137;
  const lat0 = latlngs.reduce((sum, p) => sum + p.lat, 0) / latlngs.length * Math.PI / 180;
  const pts = latlngs.map((p) => ({
    x: earth * p.lng * Math.PI / 180 * Math.cos(lat0),
    y: earth * p.lat * Math.PI / 180
  }));
  let sum = 0;
  pts.forEach((p, i) => {
    const n = pts[(i + 1) % pts.length];
    sum += p.x * n.y - n.x * p.y;
  });
  return Math.abs(sum / 2);
}

function surfaceFromLatLngs(latlngs) {
  const area = Math.max(1, polygonAreaM2(latlngs));
  return {
    id: patchState.surfaces.length + 1,
    name: `Roof ${patchState.surfaces.length + 1}`,
    area,
    orientation: 'South',
    factor: 1,
    points: latlngs.map((p) => `${p.lat.toFixed(7)},${p.lng.toFixed(7)}`).join(' '),
    latlngs: latlngs.map((p) => ({ lat: p.lat, lng: p.lng }))
  };
}

function clearCurrentDrawing() {
  patchState.currentPoints = [];
  if (patchState.layerGroup) patchState.layerGroup.clearLayers();
  drawSurfaces();
}

function drawSurfaces() {
  if (!patchState.layerGroup || !window.L) return;
  patchState.layerGroup.clearLayers();
  patchState.surfaces.forEach((surface) => {
    const latlngs = surface.latlngs.map((p) => window.L.latLng(p.lat, p.lng));
    window.L.polygon(latlngs, {
      color: '#0b6fff',
      weight: 2,
      opacity: 0.95,
      fillColor: '#0b6fff',
      fillOpacity: 0.28
    }).addTo(patchState.layerGroup);
    latlngs.forEach((point) => {
      window.L.marker(point, {
        icon: window.L.divIcon({ className: 'solatrixRoofPoint', html: '', iconSize: [9, 9], iconAnchor: [4, 4] })
      }).addTo(patchState.layerGroup);
    });
  });
  patchState.currentPoints.forEach((point) => {
    window.L.marker(point, {
      icon: window.L.divIcon({ className: 'solatrixRoofPoint', html: '', iconSize: [9, 9], iconAnchor: [4, 4] })
    }).addTo(patchState.layerGroup);
  });
  if (patchState.currentPoints.length > 1) {
    window.L.polyline(patchState.currentPoints, { color: '#0b6fff', weight: 2, dashArray: '5,5' }).addTo(patchState.layerGroup);
  }
}

function calculatePatchReport() {
  const roofArea = patchState.surfaces.reduce((sum, surface) => sum + Number(surface.area || 0), 0);
  const usableArea = roofArea * CONFIG.usableRoofFactor;
  const systemKw = usableArea / CONFIG.sqmPerKw;
  const annualProduction = systemKw * CONFIG.productionPerKw;
  const monthlyBill = Number(document.querySelector('[data-field="monthlyBill"]')?.value || 850);
  const annualConsumption = (monthlyBill * 12) / CONFIG.buyRate;
  const selfConsumed = Math.min(annualProduction * 0.45, annualConsumption);
  const exported = Math.max(annualProduction - selfConsumed, 0);
  const annualSavings = selfConsumed * CONFIG.buyRate + exported * CONFIG.sellRate;
  const cost = systemKw * CONFIG.installCostPerKw;
  const payback = cost / Math.max(annualSavings, 1);
  const profit25 = annualSavings * 25 - cost;
  const panels = Math.max(Math.floor(systemKw / CONFIG.panelKw), 1);
  return { roofArea, usableArea, systemKw, annualProduction, annualSavings, cost, payback, profit25, panels };
}

function updateMapText(message, success = false) {
  const hint = document.querySelector('.solatrixMapHint');
  if (hint) {
    hint.textContent = message;
    hint.classList.toggle('success', success);
  }
  const status = document.querySelector('.markStatus');
  if (status) {
    status.classList.add('solatrixPatched');
    status.textContent = patchState.surfaces.length
      ? `סומנו ${patchState.surfaces.length} שטחי גג — ${Math.round(calculatePatchReport().roofArea).toLocaleString('he-IL')} מ״ר בסך הכל`
      : 'עדיין לא סומן שטח גג. התחילו סימון ולחצו על פינות הגג.';
  }
  const nextBtn = document.querySelector('.nextTextBtn[data-action="next"]');
  if (nextBtn && patchState.surfaces.length) nextBtn.removeAttribute('disabled');
  const list = document.querySelector('.solatrixMapSurfaceList');
  if (list) {
    list.innerHTML = patchState.surfaces.map((surface, index) => `<div>שטח ${index + 1}: ${Math.round(surface.area).toLocaleString('he-IL')} מ״ר</div>`).join('');
  }
}

function startDrawing() {
  patchState.drawing = true;
  patchState.currentPoints = [];
  document.body.classList.add('solatrixDrawMode');
  updateMapText('מצב סימון פעיל: לחצו על פינות הגג. הנקודות קטנות והשטח יסומן בכחול.', false);
  drawSurfaces();
}

function finishDrawing() {
  if (patchState.currentPoints.length < 3) {
    updateMapText('צריך לפחות 3 נקודות כדי לסיים שטח.', false);
    return;
  }
  patchState.surfaces.push(surfaceFromLatLngs(patchState.currentPoints));
  patchState.currentPoints = [];
  patchState.drawing = false;
  document.body.classList.remove('solatrixDrawMode');
  drawSurfaces();
  updateMapText('השטח נשמר. אפשר לסמן שטח נוסף או להמשיך לשלב הבא.', true);
}

function removeLastPoint() {
  patchState.currentPoints.pop();
  drawSurfaces();
  updateMapText(`נותרו ${patchState.currentPoints.length} נקודות בסימון הנוכחי.`, false);
}

function clearAll() {
  patchState.surfaces = [];
  patchState.currentPoints = [];
  patchState.drawing = false;
  document.body.classList.remove('solatrixDrawMode');
  drawSurfaces();
  updateMapText('נוקה הסימון. התחילו סימון חדש.', false);
}

function patchReportScreen() {
  if (!patchState.surfaces.length) return;
  const report = calculatePatchReport();
  const reportCard = document.querySelector('.reportCard');
  if (!reportCard || reportCard.dataset.govmapPatched === 'true') return;
  reportCard.dataset.govmapPatched = 'true';
  const title = reportCard.querySelector('h2');
  if (title) title.textContent = `הגג מתאים למערכת של כ-${report.systemKw.toFixed(1)} kW`;
  const hero = reportCard.querySelector('.reportHeroGraphic strong');
  if (hero) hero.textContent = `₪${Math.round(report.annualSavings).toLocaleString('he-IL')}`;
  const cells = [...reportCard.querySelectorAll('.resultsGrid > div')];
  const values = [
    `${Math.round(report.roofArea).toLocaleString('he-IL')} m²`,
    `${Math.round(report.usableArea).toLocaleString('he-IL')} m²`,
    `${report.panels}`,
    `${Math.round(report.annualProduction).toLocaleString('he-IL')} kWh`,
    `₪${Math.round(report.annualSavings).toLocaleString('he-IL')}`,
    `${report.payback.toFixed(1)} שנים`,
    `₪${Math.round(report.profit25).toLocaleString('he-IL')}`
  ];
  cells.forEach((cell, index) => {
    const b = cell.querySelector('b');
    if (b && values[index]) b.textContent = values[index];
  });
  const pdfBtn = reportCard.querySelector('[data-action="generatePdf"]');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>דוח Solatrix</title><style>body{font-family:Assistant,Arial,sans-serif;padding:40px;color:#241a10}h1{font-size:34px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.box{border:1px solid #eadfce;border-radius:18px;padding:18px}b{font-size:24px;color:#0b6fff}</style></head><body><h1>דוח סולארי ראשוני</h1><p>הדוח מבוסס על סימון ידני של שטח הגג במפה.</p><div class="grid"><div class="box">שטח גג<br><b>${Math.round(report.roofArea).toLocaleString('he-IL')} מ״ר</b></div><div class="box">מערכת מומלצת<br><b>${report.systemKw.toFixed(1)} kW</b></div><div class="box">פאנלים<br><b>${report.panels}</b></div><div class="box">ייצור שנתי<br><b>${Math.round(report.annualProduction).toLocaleString('he-IL')} kWh</b></div><div class="box">חיסכון שנתי<br><b>₪${Math.round(report.annualSavings).toLocaleString('he-IL')}</b></div><div class="box">החזר השקעה<br><b>${report.payback.toFixed(1)} שנים</b></div></div><script>window.print()</script></body></html>`);
      win.document.close();
    }, true);
  }
}

async function installMapIntoOriginalScreen() {
  const panel = document.querySelector('.mapPanel.interactiveMap');
  if (!panel || panel.dataset.govmapInstalled === 'true') return;
  injectStyles();
  panel.dataset.govmapInstalled = 'true';
  panel.classList.add('solatrixMapInjected');
  panel.innerHTML = `<div class="solatrixRealMapWrap"><div id="solatrix-real-roof-map" class="solatrixRealMap"></div><div class="solatrixMapToolbar"><button class="primary" data-govmap-action="start">התחל סימון</button><button data-govmap-action="finish">סיים שטח</button><button data-govmap-action="undo">בטל נקודה</button><button class="danger" data-govmap-action="clear">נקה הכל</button></div><div class="solatrixMapSurfaceList"></div><div class="solatrixMapHint">הזיזו וקרבו את המפה. כשתהיו על הגג, לחצו “התחל סימון” ואז סמנו את פינות הגג.</div></div>`;
  const L = await loadLeaflet();
  const center = getAddressCenter();
  patchState.map = L.map('solatrix-real-roof-map', { zoomControl: true, attributionControl: true, maxZoom: 20 }).setView(center, 18);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20,
    attribution: 'Imagery © Esri'
  }).addTo(patchState.map);
  patchState.layerGroup = L.layerGroup().addTo(patchState.map);
  patchState.map.on('click', (event) => {
    if (!patchState.drawing) return;
    patchState.currentPoints.push(event.latlng);
    drawSurfaces();
    updateMapText(`נוספה נקודה ${patchState.currentPoints.length}. המשיכו לסמן או לחצו “סיים שטח”.`, false);
  });
  panel.querySelector('[data-govmap-action="start"]').addEventListener('click', startDrawing);
  panel.querySelector('[data-govmap-action="finish"]').addEventListener('click', finishDrawing);
  panel.querySelector('[data-govmap-action="undo"]').addEventListener('click', removeLastPoint);
  panel.querySelector('[data-govmap-action="clear"]').addEventListener('click', clearAll);
  drawSurfaces();
  updateMapText('המפה הוטענה בתוך העיצוב המקורי. התחילו סימון כשאתם מוכנים.', false);
  setTimeout(() => patchState.map.invalidateSize(), 150);
}

function patchOriginalButtons() {
  document.addEventListener('click', (event) => {
    const markBtn = event.target.closest('[data-action="markRoof"]');
    if (markBtn && document.querySelector('.mapPanel.interactiveMap')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      startDrawing();
    }
  }, true);
}

function tick() {
  const path = window.location.pathname || '';
  if (path.includes('/roof-marking')) installMapIntoOriginalScreen().catch((error) => console.warn('Solatrix map patch failed', error));
  if (path.includes('/report')) patchReportScreen();
}

function watchRouter() {
  const pushState = history.pushState;
  history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    setTimeout(tick, 60);
    return result;
  };
  window.addEventListener('popstate', () => setTimeout(tick, 60));
  setInterval(tick, 700);
}

patchOriginalButtons();
watchRouter();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
else tick();
