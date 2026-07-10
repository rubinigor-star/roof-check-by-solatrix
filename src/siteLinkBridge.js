const CALCULATOR_MASTER_VERSION = 'roof-check-master-v1';
const calculatorPath = 'roof-check/';
const calculatorKeywords = [
  /roof\s*check/i,
  /check\s*roof/i,
  /בדיקת\s*גג/,
  /בדקו\s*את\s*הגג/,
  /בדקו\s*גג/,
  /התחילו\s*בבדיקת\s*הגג/,
  /הגג\s*שלכם/,
  /בדיקה\s*חכמה/,
  /חישוב\s*גג/,
  /קבלו\s*בדיקה/,
  /ראו\s*את\s*הגג/,
  /תראו\s*את\s*הגג/,
  /צפו\s*בגג/,
  /בדקו\s*התאמה/,
  /расч[её]т/i,
  /посмотр/i,
  /провер/i,
  /кры/i
];

const contactKeywords = [
  /צור\s*קשר/,
  /השאירו\s*פרטים/,
  /קבלו\s*הצעה/,
  /השארת\s*פרטים/,
  /консульта/i,
  /заяв/i
];

function isCalculatorPage() {
  return /\/roof-check\/?$/.test(window.location.pathname) || /\/roof-check\//.test(window.location.pathname);
}

function isHomePage() {
  const path = window.location.pathname.replace(/\/index\.html$/, '/');
  return path.endsWith('/roof-check-by-solatrix/') || path === '/' || path.endsWith('/');
}

function siteRootUrl() {
  const path = window.location.pathname;
  const marker = '/roof-check-by-solatrix/';
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) return `${window.location.origin}${path.slice(0, markerIndex + marker.length)}`;
  if (path.includes('/roof-check/')) return new URL('../', window.location.href).href;
  return new URL('./', window.location.href).href;
}

function calculatorUrl() {
  const url = new URL(calculatorPath, siteRootUrl());
  url.searchParams.set('v', CALCULATOR_MASTER_VERSION);
  return url.href;
}

function textMatches(text = '', patterns = calculatorKeywords) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return patterns.some((pattern) => pattern.test(clean));
}

function hrefMatchesCalculator(href = '') {
  return /roof-check(?:\.html|\/)?/i.test(href) || /#.*roof/i.test(href) || /#.*גג/i.test(href);
}

function injectDecisionBlockStyles() {
  if (document.getElementById('solatrix-price-truth-block-style')) return;
  const style = document.createElement('style');
  style.id = 'solatrix-price-truth-block-style';
  style.textContent = `
    #decision .price-truth-grid{display:grid;grid-template-columns:.92fr 1.08fr;gap:72px;align-items:start}
    #decision .price-truth-eyebrow{font-weight:950;letter-spacing:.06em;color:#b66d00;margin-bottom:12px}
    #decision .price-truth-title{font-size:clamp(40px,4.8vw,64px);line-height:.96;letter-spacing:-.045em;margin:0;color:#17120d}
    #decision .price-truth-card{background:linear-gradient(180deg,#fff,#fff7eb);border:1px solid var(--line);border-radius:34px;padding:44px;box-shadow:0 22px 60px rgba(42,33,24,.06)}
    #decision .price-truth-lead{font-size:22px;line-height:1.55;margin:0 0 24px;color:#3b332b;font-weight:720}
    #decision .price-anchor{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;margin:26px 0;padding:28px;border-radius:30px;background:linear-gradient(135deg,#17120d,#3c2f22);color:#fff;box-shadow:0 24px 58px rgba(42,33,24,.16)}
    #decision .price-anchor span{display:block;color:#ffd18a;font-weight:950;margin-bottom:6px}
    #decision .price-anchor b{display:block;font-size:clamp(34px,5vw,58px);line-height:.92;letter-spacing:-.04em;direction:ltr;text-align:left;color:#fff}
    #decision .price-anchor small{display:block;color:rgba(255,255,255,.72);font-weight:800;margin-top:7px}
    #decision .price-pill{display:inline-flex;align-items:center;justify-content:center;width:92px;height:92px;border-radius:28px;background:linear-gradient(135deg,var(--orange),var(--orange2));color:#17120d;font-size:34px;font-weight:950;box-shadow:0 16px 34px rgba(245,161,26,.26)}
    #decision .price-truth-points{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:24px 0 22px}
    #decision .price-truth-point{background:#fff;border:1px solid var(--line);border-radius:24px;padding:20px 18px;box-shadow:0 14px 34px rgba(42,33,24,.045)}
    #decision .price-truth-point b{display:block;font-size:19px;line-height:1.15;color:#17120d;margin-bottom:8px}
    #decision .price-truth-point p{margin:0;font-size:16px;line-height:1.45;color:#5f564c;font-weight:720}
    #decision .price-truth-bottom{display:grid;gap:16px;margin-top:20px}
    #decision .price-truth-note{background:#fff3df;border:1px solid #f1d0a0;border-radius:22px;padding:20px 22px;font-size:19px;line-height:1.55;font-weight:850;color:#3a2b19}
    #decision .price-truth-cta{display:inline-flex;align-items:center;justify-content:center;width:max-content;max-width:100%;border-radius:999px;padding:15px 26px;background:linear-gradient(135deg,var(--orange),var(--orange2));color:#16100a;font-weight:950;text-decoration:none;box-shadow:0 16px 34px rgba(245,161,26,.22)}
    @media(max-width:900px){#decision .price-truth-grid{grid-template-columns:1fr;gap:34px}#decision .price-truth-card{padding:26px 22px;border-radius:28px}#decision .price-anchor{grid-template-columns:1fr;padding:22px}#decision .price-pill{width:68px;height:68px;border-radius:22px;font-size:26px}#decision .price-truth-points{grid-template-columns:1fr}#decision .price-truth-cta{width:100%}}
  `;
  document.head.appendChild(style);
}

function replaceDecisionBlock() {
  if (!isHomePage()) return;
  const section = document.getElementById('decision');
  if (!section || section.dataset.solatrixPriceTruth === 'true') return;
  section.dataset.solatrixPriceTruth = 'true';
  injectDecisionBlockStyles();
  section.innerHTML = `
    <div class="container price-truth-grid">
      <div class="sticky-title">
        <div class="price-truth-eyebrow">מחיר בסיס שקוף</div>
        <h2 class="price-truth-title">למה מחיר של מערכת סולארית לא צריך להיות סוד?</h2>
      </div>
      <div class="price-truth-card">
        <p class="price-truth-lead">הרבה חברות מתחילות ב״נחזור אליכם עם הצעה״. אנחנו מעדיפים לתת לכם נקודת התחלה ברורה כבר באתר — כדי שתוכלו להבין אם המספרים בכלל מתאימים לכם לפני פגישה.</p>
        <div class="price-anchor">
          <div>
            <span>מחיר בסיס לתכנון ראשוני</span>
            <b>₪2,900</b>
            <small>לקילוואט לפני מע״מ. המחיר הסופי תלוי בגג, חשמל, קונסטרוקציה וציוד.</small>
          </div>
          <div class="price-pill">₪</div>
        </div>
        <div class="price-truth-points">
          <div class="price-truth-point"><b>קודם סדר גודל</b><p>לא חייבים לחכות להצעת מחיר כדי להבין אם הפרויקט בכיוון נכון.</p></div>
          <div class="price-truth-point"><b>אחר כך בדיקת גג</b><p>Roof Check מחבר שטח גג, ייצור, צריכה עצמית ומכירה לרשת.</p></div>
          <div class="price-truth-point"><b>בלי הבטחות ריקות</b><p>הדוח מציג גם את המספרים וגם את ההנחות שמאחוריהם.</p></div>
        </div>
        <div class="price-truth-bottom">
          <div class="price-truth-note">השלב הבא הוא לבדוק את הגג שלכם בפועל: מסמנים את הגג, מקבלים הערכה ראשונית ומורידים דוח מסודר.</div>
          <a class="price-truth-cta" href="${calculatorUrl()}" data-solatrix-master-roof-check="true">בדקו את הגג שלכם</a>
        </div>
      </div>
    </div>
  `;
}

function connectRoofCheckLinks() {
  if (isCalculatorPage()) return;

  const target = calculatorUrl();

  document.querySelectorAll('a').forEach((link) => {
    const label = link.textContent || '';
    const href = link.getAttribute('href') || '';
    if (textMatches(label) || hrefMatchesCalculator(href)) {
      link.setAttribute('href', target);
      link.setAttribute('data-solatrix-linked-calculator', CALCULATOR_MASTER_VERSION);
    } else if (textMatches(label, contactKeywords) && !/wa\.me|whatsapp/i.test(href)) {
      link.setAttribute('href', '#lead-form');
      link.setAttribute('data-solatrix-open-lead-form', 'true');
    }
  });

  document.querySelectorAll('button, [role="button"]').forEach((button) => {
    const label = button.textContent || '';
    if (textMatches(label)) {
      button.setAttribute('data-solatrix-linked-calculator', CALCULATOR_MASTER_VERSION);
      button.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = target;
      });
    } else if (textMatches(label, contactKeywords)) {
      button.setAttribute('data-solatrix-open-lead-form', 'true');
    }
  });
}

function initSolatrixSiteLinks() {
  replaceDecisionBlock();
  connectRoofCheckLinks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSolatrixSiteLinks);
} else {
  initSolatrixSiteLinks();
}
