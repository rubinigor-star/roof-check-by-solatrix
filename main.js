import './styles.css';

const CONFIG = {
  productionPerKw: 1650,
  buyRate: 0.64,
  sellRate: 0.48,
  installCostPerKw: 2900,
  sqmPerKw: 7,
  panelKw: 0.63,
  defaultPhone: '972547299727'
};

const analysisSteps = [
  'Roof geometry detected',
  'Orientation calculated',
  'Panel layout optimized',
  'Annual production calculated',
  'Financial report generated'
];

const surfacesPreset = [
  { id: 1, name: 'Main south surface', area: 72, orientation: 'South', factor: 1, points: '18,56 78,40 86,78 24,88' },
  { id: 2, name: 'East upper surface', area: 38, orientation: 'East', factor: 0.88, points: '14,18 48,10 52,36 16,46' },
  { id: 3, name: 'West service zone', area: 24, orientation: 'West', factor: 0.82, points: '58,14 86,18 80,38 56,34' }
];

const state = {
  step: 0,
  propertyType: 'home',
  address: '',
  roofType: 'flat',
  monthlyBill: 850,
  activeSurface: 0,
  surfaces: [surfacesPreset[0]],
  obstacles: ['boiler', 'ac'],
  leadSent: false
};

const steps = [
  'Start',
  'Address',
  'Roof',
  'Draw',
  'Obstacles',
  'Analysis',
  'Report'
];

function formatNumber(value) {
  return Math.round(value).toLocaleString('he-IL');
}

function formatMoney(value) {
  return '₪' + formatNumber(value);
}

function calculateSurface(surface) {
  const usableArea = Math.max(surface.area * 0.82, 0);
  const kw = usableArea / CONFIG.sqmPerKw;
  const panels = Math.max(Math.floor(kw / CONFIG.panelKw), 1);
  return { usableArea, kw, panels };
}

function calculateReport() {
  const systemKw = state.surfaces.reduce((sum, surface) => sum + calculateSurface(surface).kw, 0);
  const weightedFactor = state.surfaces.reduce((sum, surface) => sum + surface.factor * calculateSurface(surface).kw, 0) / Math.max(systemKw, 1);
  const annualProduction = systemKw * CONFIG.productionPerKw * weightedFactor;
  const annualConsumption = (Number(state.monthlyBill) * 12) / CONFIG.buyRate;
  const selfConsumed = Math.min(annualProduction * 0.42, annualConsumption);
  const exported = Math.max(annualProduction - selfConsumed, 0);
  const annualSavings = selfConsumed * CONFIG.buyRate + exported * CONFIG.sellRate;
  const cost = systemKw * CONFIG.installCostPerKw;
  const payback = cost / Math.max(annualSavings, 1);
  const profit25 = annualSavings * 25 - cost;
  const panels = state.surfaces.reduce((sum, surface) => sum + calculateSurface(surface).panels, 0);
  return { systemKw, annualProduction, annualSavings, cost, payback, profit25, panels };
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
          <a href="#">שאלות</a>
        </nav>
        <a class="headerCta" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </header>`;
}

function progress() {
  const percent = ((state.step + 1) / steps.length) * 100;
  return `
    <div class="flowMeta">
      <span>${steps[state.step]}</span>
      <span>${state.step + 1}/${steps.length}</span>
    </div>
    <div class="progressBar"><div style="width:${percent}%"></div></div>`;
}

function buttonRow(primary = 'המשך', secondary = 'חזרה') {
  return `
    <div class="buttonRow">
      <button class="primaryBtn" data-action="next">${primary}</button>
      <button class="ghostBtn" data-action="prev">${secondary}</button>
    </div>`;
}

function optionCard(label, text, active, action) {
  return `
    <button class="optionCard ${active ? 'selected' : ''}" data-action="${action}">
      <span class="optionCopy"><b>${label}</b><small>${text}</small></span>
      <span class="optionCheck">${active ? '✓' : '›'}</span>
    </button>`;
}

function mapMock(mode = 'intro') {
  const surfaceShapes = state.surfaces.map((surface, index) => {
    const cls = index === state.activeSurface ? 'surface active' : 'surface complete';
    return `<polygon class="${cls}" points="${surface.points}"></polygon>`;
  }).join('');

  const pins = mode === 'obstacles' ? `
    <g class="obstaclePins">
      <circle cx="42" cy="36" r="3.6"></circle><text x="42" y="34">AC</text>
      <circle cx="66" cy="56" r="3.6"></circle><text x="66" y="54">B</text>
      <circle cx="72" cy="28" r="3.6"></circle><text x="72" y="26">S</text>
    </g>` : '';

  return `
    <div class="mapPanel ${mode}">
      <div class="mapTopline">
        <span>Satellite roof workspace</span>
        <b>GovMap-ready</b>
      </div>
      <svg class="roofCanvas" viewBox="0 0 100 100" role="img" aria-label="Roof drawing mockup">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="100" class="mapBase"></rect>
        <rect x="0" y="0" width="100" height="100" fill="url(#grid)" class="mapGrid"></rect>
        <path class="building" d="M12 14 L86 9 L92 82 L18 90 Z"></path>
        ${surfaceShapes}
        ${pins}
      </svg>
      <div class="mapHint">${mode === 'draw' ? 'Draw each roof surface. Completed surfaces turn Solatrix gold.' : 'High fidelity map mockup. API integration comes next.'}</div>
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
            <div>
              <b>${surface.name}</b>
              <small>${surface.area} m² · ${surface.orientation} · ${calc.panels} panels</small>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function heroScreen() {
  return `
    <section class="heroGrid">
      <div class="heroCopy">
        <div class="eyebrow">Roof Check by Solatrix</div>
        <h1>בדיקת גג סולארית שנראית ומרגישה כמו מוצר פרימיום.</h1>
        <p>המשתמש מסמן את הגג, מקבל הערכת מערכת, ייצור שנתי, חיסכון, החזר השקעה ודוח ראשוני — בממשק שמוכן לחיבור GovMap, PDF ו-CRM.</p>
        <div class="heroActions">
          <button class="primaryBtn large" data-action="next">התחילו בדיקת גג</button>
          <a class="textLink" href="https://wa.me/${CONFIG.defaultPhone}" target="_blank" rel="noreferrer">דברו עם Solatrix</a>
        </div>
        <div class="trustStrip">
          <span>1650 kWh/kWp/year</span>
          <span>2,900 ₪/kW</span>
          <span>25-year report</span>
        </div>
      </div>
      <div class="heroVisual">${mapMock('intro')}</div>
    </section>`;
}

function addressScreen() {
  return `
    <section class="productGrid">
      <div class="productCard">
        ${progress()}
        <div class="eyebrow">Address</div>
        <h2>איפה נמצא הגג?</h2>
        <p>בגרסה הסופית נחבר חיפוש כתובות של ישראל. כרגע הממשק כבר בנוי בדיוק לשלב הזה.</p>
        <label>כתובת בישראל</label>
        <input value="${state.address}" placeholder="לדוגמה: החרמון 10, חיפה" data-field="address" />
        <div class="microNote">Next: GovMap / Israel parcel and satellite layer.</div>
        ${buttonRow('מצא את הגג')}
      </div>
      <div class="sidePanel">${mapMock('address')}</div>
    </section>`;
}

function roofScreen() {
  return `
    <section class="productGrid">
      <div class="productCard">
        ${progress()}
        <div class="eyebrow">Roof profile</div>
        <h2>איזה סוג גג בודקים?</h2>
        <div class="optionsStack">
          ${optionCard('גג שטוח', 'הכי נפוץ בישראל. סימון מהיר של שטח שימושי.', state.roofType === 'flat', 'roof:flat')}
          ${optionCard('גג משופע / לא אחיד', 'כמה משטחים עם כיוונים שונים.', state.roofType === 'sloped', 'roof:sloped')}
          ${optionCard('גג מסחרי גדול', 'שטח גדול, אזורי שירות, הצללות ומכשולים.', state.roofType === 'commercial', 'roof:commercial')}
        </div>
        <label>חשבון חשמל חודשי ממוצע</label>
        <input type="number" value="${state.monthlyBill}" data-field="monthlyBill" />
        ${buttonRow('המשך לסימון הגג')}
      </div>
      <div class="sidePanel metricPanel">
        <div class="metricCard"><span>Estimated roof type</span><b>${state.roofType}</b></div>
        <div class="metricCard"><span>Monthly bill</span><b>${formatMoney(state.monthlyBill)}</b></div>
        <div class="metricCard"><span>Calculation model</span><b>Israel PV</b></div>
      </div>
    </section>`;
}

function drawScreen() {
  const nextSurface = state.surfaces.length < surfacesPreset.length ? surfacesPreset[state.surfaces.length].name : 'All core surfaces completed';
  return `
    <section class="productGrid wideMap">
      <div class="productCard">
        ${progress()}
        <div class="eyebrow">Roof drawing</div>
        <h2>סימון משטחי הגג</h2>
        <p>כל משטח שמסומן הופך לזהב, מקבל ✓, ומציג שטח, כיוון וכמות פאנלים. זה נותן תחושת התקדמות ולא “ציור טכני”.</p>
        ${surfaceList()}
        <div class="nextSurface">Next surface: <b>${nextSurface}</b></div>
        <div class="splitButtons">
          <button class="primaryBtn" data-action="addSurface">הוסף משטח</button>
          <button class="ghostBtn" data-action="removeSurface">בטל אחרון</button>
        </div>
        ${buttonRow('המשך למכשולים')}
      </div>
      <div class="sidePanel">${mapMock('draw')}</div>
    </section>`;
}

function obstaclesScreen() {
  return `
    <section class="productGrid">
      <div class="productCard">
        ${progress()}
        <div class="eyebrow">Obstacles</div>
        <h2>מה נמצא על הגג?</h2>
        <p>בשלב הבא נחשב אזורים לא שמישים: דודים, מזגנים, יציאות גג, צל וקולטים קיימים.</p>
        <div class="obstacleGrid">
          <button class="obstacle selected">AC units</button>
          <button class="obstacle selected">Boiler</button>
          <button class="obstacle">Roof access</button>
          <button class="obstacle">Shade</button>
          <button class="obstacle">Existing solar</button>
          <button class="obstacle">Parapet</button>
        </div>
        ${buttonRow('התחל ניתוח')}
      </div>
      <div class="sidePanel">${mapMock('obstacles')}</div>
    </section>`;
}

function analysisScreen() {
  return `
    <section class="analysisScreen">
      <div class="productCard analysisCard">
        ${progress()}
        <div class="eyebrow">Engineering analysis</div>
        <h2>Solatrix roof engine is working</h2>
        <div class="analysisList">
          ${analysisSteps.map((item, index) => `<div class="analysisStep" style="animation-delay:${index * 180}ms"><span>✓</span><b>${item}</b></div>`).join('')}
        </div>
        <div class="buttonRow delayedActions">
          <button class="primaryBtn" data-action="next">הצג דוח</button>
          <button class="ghostBtn" data-action="prev">חזרה</button>
        </div>
      </div>
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
        <p>המספרים הם הערכה ראשונית לפי שטח מסומן, כיוון, מכשולים ומודל Solatrix לשוק הישראלי.</p>
      </div>
      <div class="reportCards">
        <div class="resultCard"><span>System size</span><b>${report.systemKw.toFixed(1)} kW</b></div>
        <div class="resultCard"><span>Panels</span><b>${report.panels}</b></div>
        <div class="resultCard"><span>Annual production</span><b>${formatNumber(report.annualProduction)} kWh</b></div>
        <div class="resultCard"><span>Annual savings</span><b>${formatMoney(report.annualSavings)}</b></div>
        <div class="resultCard"><span>Payback</span><b>${report.payback.toFixed(1)} years</b></div>
        <div class="resultCard"><span>25-year profit</span><b>${formatMoney(report.profit25)}</b></div>
      </div>
      <div class="leadCard">
        <h3>קבלו PDF מלא ל-WhatsApp או Email</h3>
        <div class="leadFields">
          <input placeholder="שם מלא" />
          <input placeholder="טלפון WhatsApp" />
          <input placeholder="Email" />
        </div>
        <button class="primaryBtn large" data-action="sendLead">שליחת דוח ראשוני</button>
        ${state.leadSent ? '<div class="successToast">Lead captured locally. Next step: CRM, WhatsApp and PDF integration.</div>' : ''}
      </div>
    </section>`;
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
      const value = node.type === 'number' ? Number(node.value) : node.value;
      state[key] = value;
    });
  });
}

render();
