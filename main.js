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

const surfacesPreset = [
  { id: 1, name: 'Main south roof', area: 74, orientation: 'South', factor: 1, points: '18,56 78,40 86,78 24,88' },
  { id: 2, name: 'East wing', area: 36, orientation: 'East', factor: 0.88, points: '14,18 48,10 52,36 16,46' },
  { id: 3, name: 'West service strip', area: 22, orientation: 'West', factor: 0.82, points: '58,14 86,18 80,38 56,34' }
];

const scanSteps = [
  'Satellite image loaded',
  'Roof edges detected',
  'Usable area calculated automatically',
  'Obstacles excluded',
  'Solar estimate prepared'
];

const state = {
  step: 0,
  address: '',
  roofType: 'flat',
  surfaces: [surfacesPreset[0]],
  activeSurface: 0,
  leadSent: false
};

const steps = ['Start', 'Address', 'Roof type', 'Auto scan', 'Obstacles', 'Report'];

function formatNumber(value) {
  return Math.round(value).toLocaleString('he-IL');
}

function formatMoney(value) {
  return '₪' + formatNumber(value);
}

function calculateSurface(surface) {
  const usableArea = Math.max(surface.area * CONFIG.usableRoofFactor, 0);
  const kw = usableArea / CONFIG.sqmPerKw;
  const panels = Math.max(Math.floor(kw / CONFIG.panelKw), 1);
  return { usableArea, kw, panels };
}

function calculateReport() {
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
  return { systemKw, annualProduction, annualRevenue, cost, payback, profit25, panels, roofArea, usableArea };
}

function setStep(step) {
  state.step = Math.max(0, Math.min(steps.length - 1, step));
  render();
}

function setField(key, value) {
  state[key] = value;
  render();
}

function addSurface() {
  if (state.surfaces.length < surfacesPreset.length) {
    state.surfaces.push(surfacesPreset[state.surfaces.length]);
    state.activeSurface = state.surfaces.length - 1;
    render();
  }
}

function removeLastSurface() {
  if (state.surfaces.length > 1) {
    state.surfaces.pop();
    state.activeSurface = state.surfaces.length - 1;
    render();
  }
}

function logo() {
  return `
    <div class="logoMark" aria-label="Solatrix Energy">
      <div class="solarArc"></div>
      <div class="logoText"><strong>Solatrix</strong><span>ENERGY</span></div>
      <div class="sunDot"></div>
    </div>`;
}

function header() {
  return `
    <header class="siteHeader">
      <div class="headerInner">
        <a class="brand" href="#" data-action="step:0">${logo()}</a>
        <nav class="mainNav" aria-label="Main navigation">
          <a href="#">דף הבית</a>
          <a href="#">בתים פרטיים</a>
          <a href="#">מסחרי</a>
          <a href="#" class="active">בדיקת גג</a>
        </nav>
        <a class="headerCta" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </header>`;
}

function progress() {
  const percent = ((state.step + 1) / steps.length) * 100;
  return `
    <div class="flowMeta"><span>${steps[state.step]}</span><span>${state.step + 1}/${steps.length}</span></div>
    <div class="progressBar"><div style="width:${percent}%"></div></div>`;
}

function buttonRow(primary = 'המשך', secondary = 'חזרה') {
  return `
    <div class="buttonRow">
      <button class="primaryBtn" data-action="next">${primary}</button>
      <button class="ghostBtn" data-action="prev">${secondary}</button>
    </div>`;
}

function optionCard(icon, label, text, active, action) {
  return `
    <button class="optionCard ${active ? 'selected' : ''}" data-action="${action}">
      <span class="optionIcon">${icon}</span>
      <span class="optionCopy"><b>${label}</b><small>${text}</small></span>
      <span class="optionCheck">${active ? '✓' : '›'}</span>
    </button>`;
}

function mapMock(mode = 'intro') {
  const surfaceShapes = state.surfaces.map((surface, index) => {
    const cls = index === state.activeSurface ? 'surface active' : 'surface complete';
    return `<polygon class="${cls}" points="${surface.points}"></polygon>`;
  }).join('');

  const pins = mode === 'obstacles' || mode === 'scan' ? `
    <g class="obstaclePins">
      <circle cx="42" cy="36" r="3.6"></circle><text x="42" y="34">AC</text>
      <circle cx="66" cy="56" r="3.6"></circle><text x="66" y="54">B</text>
      <circle cx="72" cy="28" r="3.6"></circle><text x="72" y="26">S</text>
    </g>` : '';

  const rays = `
    <g class="sunRays">
      <line x1="6" y1="8" x2="28" y2="27"></line>
      <line x1="2" y1="25" x2="25" y2="39"></line>
      <line x1="10" y1="44" x2="31" y2="52"></line>
    </g>`;

  return `
    <div class="mapPanel ${mode}">
      <div class="mapTopline"><span>Satellite roof workspace</span><b>Auto area</b></div>
      <svg class="roofCanvas" viewBox="0 0 100 100" role="img" aria-label="Roof drawing mockup">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" /></pattern>
        </defs>
        <rect x="0" y="0" width="100" height="100" class="mapBase"></rect>
        <rect x="0" y="0" width="100" height="100" fill="url(#grid)" class="mapGrid"></rect>
        ${rays}
        <path class="building" d="M12 14 L86 9 L92 82 L18 90 Z"></path>
        ${surfaceShapes}
        ${pins}
      </svg>
      <div class="mapHint">${mode === 'scan' ? 'המערכת מחשבת את שטח הגג אוטומטית מתוך הסימון על המפה.' : 'המשתמש לא מקליד שטח — הוא מסמן גג והממשק מחשב לבד.'}</div>
    </div>`;
}

function statPills() {
  const report = calculateReport();
  return `
    <div class="statPills">
      <div><span>Roof area</span><b>${formatNumber(report.roofArea)} m²</b></div>
      <div><span>Usable area</span><b>${formatNumber(report.usableArea)} m²</b></div>
      <div><span>Panels</span><b>${report.panels}</b></div>
    </div>`;
}

function surfaceList() {
  return `
    <div class="surfaceList">
      ${state.surfaces.map((surface, index) => {
        const calc = calculateSurface(surface);
        return `
          <div class="surfaceItem ${index === state.activeSurface ? 'current' : ''}">
            <div class="surfaceStatus">✓</div>
            <div><b>${surface.name}</b><small>${surface.area} m² detected · ${surface.orientation} · ${calc.panels} panels</small></div>
          </div>`;
      }).join('')}
    </div>`;
}

function heroScreen() {
  return `
    <section class="heroGrid">
      <div class="heroCopy">
        <div class="eyebrow">Roof Check by Solatrix</div>
        <h1>בדיקת גג סולארית מהירה, ויזואלית וחכמה.</h1>
        <p>כל מסך עושה פעולה אחת בלבד: כתובת, סוג גג, סימון על מפה, מכשולים ודוח. בלי שאלות מיותרות על חשבון חשמל ובלי הקלדת שטח ידנית.</p>
        <div class="heroActions">
          <button class="primaryBtn large" data-action="next">התחילו בדיקת גג</button>
          <a class="textLink" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">דברו עם Solatrix</a>
        </div>
        <div class="trustStrip"><span>Auto roof area</span><span>No battery questions</span><span>Visual solar report</span></div>
      </div>
      <div class="heroVisual">${mapMock('intro')}</div>
    </section>`;
}

function addressScreen() {
  return `
    <section class="singleFocus">
      <div class="productCard focusCard">
        ${progress()}
        <div class="screenIcon">⌖</div>
        <div class="eyebrow">Step 1</div>
        <h2>מה הכתובת של הגג?</h2>
        <p>בשלב הזה יש רק פעולה אחת: למצוא את הנכס על המפה.</p>
        <input value="${state.address}" placeholder="לדוגמה: החרמון 10, חיפה" data-field="address" />
        ${buttonRow('מצא את הגג')}
      </div>
      <div class="sidePanel visualOnly">${mapMock('address')}</div>
    </section>`;
}

function roofScreen() {
  return `
    <section class="singleFocus">
      <div class="productCard focusCard">
        ${progress()}
        <div class="screenIcon">⌂</div>
        <div class="eyebrow">Step 2</div>
        <h2>איזה גג אנחנו רואים?</h2>
        <p>בחירה אחת בלבד, כדי שהמפה תתאים את צורת הסימון. אין כאן חשבון חשמל ואין כאן סוללות.</p>
        <div class="optionsStack">
          ${optionCard('▣', 'גג שטוח', 'סימון מהיר של שטח שימושי.', state.roofType === 'flat', 'roof:flat')}
          ${optionCard('◭', 'גג משופע', 'כמה משטחים וכיוונים.', state.roofType === 'sloped', 'roof:sloped')}
          ${optionCard('▦', 'גג מסחרי', 'שטח גדול ואזורי שירות.', state.roofType === 'commercial', 'roof:commercial')}
        </div>
        ${buttonRow('המשך לסריקה')}
      </div>
      <div class="sidePanel graphicPanel">
        <div class="bigGraphic roofGraphic"><span></span><b>${state.roofType}</b></div>
      </div>
    </section>`;
}

function scanScreen() {
  const nextSurface = state.surfaces.length < surfacesPreset.length ? surfacesPreset[state.surfaces.length].name : 'All core surfaces completed';
  return `
    <section class="productGrid wideMap">
      <div class="productCard">
        ${progress()}
        <div class="screenIcon">◈</div>
        <div class="eyebrow">Step 3</div>
        <h2>סימון הגג על המפה</h2>
        <p>המשתמש מסמן על התמונה. שטח הגג, שטח שימושי וכמות פאנלים מחושבים אוטומטית.</p>
        ${surfaceList()}
        ${statPills()}
        <div class="nextSurface">Next detected surface: <b>${nextSurface}</b></div>
        <div class="splitButtons">
          <button class="primaryBtn" data-action="addSurface">הוסף משטח</button>
          <button class="ghostBtn" data-action="removeSurface">בטל אחרון</button>
        </div>
        ${buttonRow('המשך למכשולים')}
      </div>
      <div class="sidePanel">${mapMock('scan')}</div>
    </section>`;
}

function obstaclesScreen() {
  return `
    <section class="productGrid wideMap">
      <div class="productCard">
        ${progress()}
        <div class="screenIcon">⊙</div>
        <div class="eyebrow">Step 4</div>
        <h2>מה צריך להוריד מהשטח?</h2>
        <p>פעולה אחת: סימון מכשולים על הגג. הם יורדים מהשטח השימושי אוטומטית.</p>
        <div class="obstacleGrid">
          <button class="obstacle selected">מזגנים</button>
          <button class="obstacle selected">דוד</button>
          <button class="obstacle">יציאה לגג</button>
          <button class="obstacle">צל</button>
          <button class="obstacle">קולטים קיימים</button>
          <button class="obstacle">מעקה</button>
        </div>
        ${buttonRow('חשב דוח')}
      </div>
      <div class="sidePanel">${mapMock('obstacles')}</div>
    </section>`;
}

function reportScreen() {
  const report = calculateReport();
  return `
    <section class="reportGrid">
      <div class="reportHero">
        ${logo()}
        <div class="eyebrow">Preliminary solar report</div>
        <h2>הגג מתאים למערכת של כ-${report.systemKw.toFixed(1)} kW</h2>
        <p>הדוח מבוסס על שטח הגג שזוהה במפה, כיוונים, מכשולים ומודל ייצור סולארי בישראל. בלי המלצת סוללות בשלב הזה.</p>
        <div class="scanTimeline">
          ${scanSteps.map((item) => `<div><span>✓</span>${item}</div>`).join('')}
        </div>
      </div>
      <div class="reportCards">
        <div class="resultCard"><span>Roof area detected</span><b>${formatNumber(report.roofArea)} m²</b></div>
        <div class="resultCard"><span>Usable solar area</span><b>${formatNumber(report.usableArea)} m²</b></div>
        <div class="resultCard"><span>System size</span><b>${report.systemKw.toFixed(1)} kW</b></div>
        <div class="resultCard"><span>Panels</span><b>${report.panels}</b></div>
        <div class="resultCard"><span>Annual production</span><b>${formatNumber(report.annualProduction)} kWh</b></div>
        <div class="resultCard"><span>Annual income estimate</span><b>${formatMoney(report.annualRevenue)}</b></div>
        <div class="resultCard"><span>Payback</span><b>${report.payback.toFixed(1)} years</b></div>
        <div class="resultCard"><span>25-year profit</span><b>${formatMoney(report.profit25)}</b></div>
      </div>
      <div class="leadCard">
        <h3>קבלו PDF מלא ל-WhatsApp או Email</h3>
        <div class="leadFields"><input placeholder="שם מלא" /><input placeholder="טלפון WhatsApp" /><input placeholder="Email" /></div>
        <button class="primaryBtn large" data-action="sendLead">שליחת דוח ראשוני</button>
        ${state.leadSent ? '<div class="successToast">הפרטים נשמרו לדוגמה. השלב הבא: CRM, WhatsApp ו-PDF.</div>' : ''}
      </div>
    </section>`;
}

function renderScreen() {
  if (state.step === 0) return heroScreen();
  if (state.step === 1) return addressScreen();
  if (state.step === 2) return roofScreen();
  if (state.step === 3) return scanScreen();
  if (state.step === 4) return obstaclesScreen();
  return reportScreen();
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `${header()}<main class="appShell">${renderScreen()}</main>`;

  root.querySelectorAll('[data-action]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      const action = node.getAttribute('data-action');
      if (action === 'next') setStep(state.step + 1);
      if (action === 'prev') setStep(state.step - 1);
      if (action === 'addSurface') addSurface();
      if (action === 'removeSurface') removeLastSurface();
      if (action === 'sendLead') { state.leadSent = true; render(); }
      if (action && action.startsWith('step:')) setStep(Number(action.split(':')[1]));
      if (action && action.startsWith('roof:')) setField('roofType', action.split(':')[1]);
    });
  });

  root.querySelectorAll('[data-field]').forEach((node) => {
    node.addEventListener('input', () => {
      const key = node.getAttribute('data-field');
      state[key] = node.value;
    });
  });
}

render();