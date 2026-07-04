import './styles.css';

const PRICES = {
  productionPerKw: 1650,
  buyRate: 0.64,
  sellRate: 0.48,
  installCostPerKw: 2900
};

const state = {
  step: 1,
  property: 'home',
  roof: 'flat',
  area: 100,
  bill: 700,
  leadSent: false
};

const steps = ['פתיחה', 'סוג נכס', 'כתובת', 'סוג גג', 'שטח', 'חשבון חשמל', 'תוצאה', 'דוח'];

function calc() {
  const usableArea = Math.max(Number(state.area) || 0, 20) * 0.7;
  const panels = Math.floor(usableArea / 3);
  const systemKw = panels * 0.63;
  const annualProd = systemKw * PRICES.productionPerKw;
  const annualConsumption = ((Number(state.bill) || 0) * 12) / PRICES.buyRate;
  const selfConsumed = Math.min(annualProd * 0.4, annualConsumption);
  const exported = Math.max(annualProd - selfConsumed, 0);
  const annualSavings = selfConsumed * PRICES.buyRate + exported * PRICES.sellRate;
  const cost = systemKw * PRICES.installCostPerKw;

  return {
    panels,
    systemKw,
    annualProd,
    annualSavings,
    payback: cost / Math.max(annualSavings, 1),
    profit25: annualSavings * 25 - cost
  };
}

function money(value) {
  return Math.round(value).toLocaleString('he-IL');
}

function setStep(step) {
  state.step = Math.max(1, Math.min(steps.length, step));
  render();
}

function updateField(key, value) {
  state[key] = value;
  render();
}

function option(label, sub, active, onClick) {
  return `<button class="option ${active ? 'active' : ''}" data-action="${onClick}"><span>${label}<small>${sub}</small></span><span class="optionIcon">${active ? '✓' : '›'}</span></button>`;
}

function nav(nextLabel = 'המשך') {
  return `<div class="actions"><button data-action="next">${nextLabel}</button><button class="secondary" data-action="prev">חזרה</button></div>`;
}

function screen(content, visual = 'Roof Check') {
  return `
    <main class="shell">
      <div class="mobileMeta"><span>שלב ${state.step} מתוך ${steps.length}</span><span>פחות מדקה</span></div>
      <div class="progress"><div style="width:${(state.step / steps.length) * 100}%"></div></div>
      <section class="screen">
        <div class="card">${content}</div>
        <div class="desktopVisual"><div class="mapMock"><div class="roofShape">${visual}</div></div></div>
      </section>
    </main>`;
}

function content() {
  if (state.step === 1) {
    return screen(`
      <div class="kicker">Roof Check by Solatrix</div>
      <h1>בדיקת גג חכמה <strong>תוך פחות מדקה</strong></h1>
      <p>סמנו את הגג, הזינו חשבון חשמל וקבלו הערכה ראשונית לגודל מערכת, חיסכון שנתי והחזר השקעה.</p>
      <div class="actions"><button data-action="next">התחילו בבדיקה</button></div>
    `, 'תצוגת גג חכמה');
  }

  if (state.step === 2) {
    return screen(`
      <div class="kicker">סוג נכס</div>
      <h2>איזה נכס נרצה לבדוק?</h2>
      <div class="options">
        ${option('בית פרטי', 'גג ביתי או דו־משפחתי', state.property === 'home', 'property:home')}
        ${option('עסק / מסחרי', 'מבנה תעשייה, משרד או חנות', state.property === 'business', 'property:business')}
        ${option('חקלאות', 'רפת, סככה או מבנה חקלאי', state.property === 'agri', 'property:agri')}
      </div>
      ${nav()}
    `, 'סוג הנכס');
  }

  if (state.step === 3) {
    return screen(`
      <div class="kicker">כתובת</div>
      <h2>בואו נראה את הגג שלכם</h2>
      <p>בשלב הבא נחבר כאן Google Maps / GovMap. כרגע זה מוקאפ שמדמה את חוויית המשתמש.</p>
      <label>כתובת</label>
      <input placeholder="לדוגמה: ויצו 24 חיפה" />
      <div class="mapMock compact"><div class="roofShape">כאן תופיע מפת Google / GovMap</div></div>
      ${nav('זה הבית שלי')}
    `, 'תמונת לוויין של הבית');
  }

  if (state.step === 4) {
    return screen(`
      <div class="kicker">סוג גג</div>
      <h2>איזה גג יש לכם?</h2>
      <p>אם הגג לא אחיד או משופע, נסמן כל חלק בנפרד בהמשך. כרגע החישוב לפי שטח שימושי.</p>
      <div class="options">
        ${option('גג שטוח', 'מסמנים את כל הגג פעם אחת', state.roof === 'flat', 'roof:flat')}
        ${option('גג משופע / לא אחיד', 'כמה משטחים בנפרד', state.roof === 'sloped', 'roof:sloped')}
      </div>
      ${nav()}
    `, 'בחירת סוג גג');
  }

  if (state.step === 5) {
    return screen(`
      <div class="kicker">שטח הגג</div>
      <h2>מה שטח הגג המשוער?</h2>
      <p>בהמשך נחבר ציור אמיתי על מפה. כרגע זה נותן הערכה ראשונית מהירה.</p>
      <label>שטח גג במ״ר</label>
      <input type="number" min="20" value="${state.area}" data-field="area" />
      <div class="surfaceTable"><div><b>שטח שימושי משוער</b><span>${Math.round(state.area * 0.7)} מ״ר</span></div></div>
      ${nav()}
    `, 'חישוב שטח ופאנלים');
  }

  if (state.step === 6) {
    return screen(`
      <div class="kicker">חשבון חשמל</div>
      <h2>כמה אתם משלמים בחשמל בחודש?</h2>
      <p>זה עוזר להעריך כמה מהייצור ייחסך ישירות וכמה יוזרם לרשת.</p>
      <label>חשבון חודשי ממוצע</label>
      <input type="number" min="0" value="${state.bill}" data-field="bill" />
      ${nav('חשב תוצאה')}
    `, 'חישוב כלכלי');
  }

  if (state.step === 7) {
    const r = calc();
    return screen(`
      <div class="kicker">תוצאה ראשונית</div>
      <h2>הגג שלכם יכול לעבוד בשבילכם</h2>
      <div class="results">
        <div class="result"><div class="big">${r.systemKw.toFixed(1)} kW</div><div class="label">גודל מערכת</div></div>
        <div class="result"><div class="big">₪${money(r.annualSavings)}</div><div class="label">חיסכון שנתי</div></div>
        <div class="result"><div class="big">${r.payback.toFixed(1)} שנים</div><div class="label">החזר השקעה</div></div>
        <div class="result"><div class="big">₪${money(r.profit25)}</div><div class="label">רווח 25 שנה</div></div>
      </div>
      <div class="surfaceTable">
        <div><b>פאנלים משוערים</b><span>${r.panels}</span></div>
        <div><b>ייצור שנתי משוער</b><span>${money(r.annualProd)} kWh</span></div>
      </div>
      <div class="actions"><button data-action="next">קבלו את הדוח המלא</button><button class="secondary" data-action="prev">עריכה</button></div>
    `, 'התוצאה שלכם');
  }

  return screen(`
    <div class="kicker">שליחת דוח</div>
    <h2>הדוח הראשוני מוכן. לאן לשלוח?</h2>
    <label>שם</label><input placeholder="שם מלא" />
    <label>טלפון WhatsApp</label><input placeholder="05X-XXXXXXX" />
    <label>אימייל</label><input placeholder="name@email.com" />
    <div class="actions"><button data-action="send">שלחו לי את הדוח</button><button class="secondary" data-action="prev">חזרה</button></div>
    ${state.leadSent ? '<div class="toast visible">הדוח נשמר בסימולציה. בשלב הבא נחבר שליחה אמיתית.</div>' : ''}
  `, 'PDF / WhatsApp / Email');
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="topbarInner">
          <a class="brand" href="#"><svg class="logoSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" aria-label="Solatrix Energy"><path d="M58 120 C20 72 42 18 102 9" fill="none" stroke="#F5A11A" stroke-width="8" stroke-linecap="round"/><circle cx="326" cy="51" r="10" fill="#F5A11A"/><text x="68" y="74" font-family="Assistant,Arial,sans-serif" font-size="58" font-weight="900" letter-spacing="-3" fill="#050505">Solatrix</text><text x="210" y="112" font-family="Assistant,Arial,sans-serif" font-size="17" font-weight="800" letter-spacing="10" fill="#F5A11A">ENERGY</text></svg></a>
          <nav class="desktopNav"><a href="#">דף הבית</a><a href="#">בתים פרטיים</a><a href="#">מחיר שקוף</a><a class="active" href="#">בדיקת גג</a><a href="#">שאלות</a></nav>
          <a class="whatsapp" href="https://wa.me/972547299727" target="_blank" rel="noreferrer"><span>WhatsApp</span></a>
        </div>
      </header>
      ${content()}
    </div>`;

  root.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const action = el.getAttribute('data-action');
      if (action === 'next') setStep(state.step + 1);
      if (action === 'prev') setStep(state.step - 1);
      if (action === 'send') { state.leadSent = true; render(); }
      if (action.startsWith('property:')) { state.property = action.split(':')[1]; render(); }
      if (action.startsWith('roof:')) { state.roof = action.split(':')[1]; render(); }
    });
  });

  root.querySelectorAll('[data-field]').forEach((el) => {
    el.addEventListener('input', () => updateField(el.getAttribute('data-field'), Number(el.value)));
  });
}

render();
