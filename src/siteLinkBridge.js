const calculatorPath = 'roof-check/';
const calculatorKeywords = [
  /roof\s*check/i,
  /check\s*roof/i,
  /בדיקת\s*גג/,
  /בדקו\s*את\s*הגג/,
  /בדקו\s*גג/,
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

function siteRootUrl() {
  const path = window.location.pathname;
  const marker = '/roof-check-by-solatrix/';
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) return `${window.location.origin}${path.slice(0, markerIndex + marker.length)}`;
  if (path.includes('/roof-check/')) return new URL('../', window.location.href).href;
  return new URL('./', window.location.href).href;
}

function calculatorUrl() {
  return new URL(calculatorPath, siteRootUrl()).href;
}

function textMatches(text = '', patterns = calculatorKeywords) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return patterns.some((pattern) => pattern.test(clean));
}

function hrefMatchesCalculator(href = '') {
  return /roof-check\.html/i.test(href) || /#.*roof/i.test(href) || /#.*גג/i.test(href);
}

function connectRoofCheckLinks() {
  if (isCalculatorPage()) return;

  const target = calculatorUrl();

  document.querySelectorAll('a').forEach((link) => {
    const label = link.textContent || '';
    const href = link.getAttribute('href') || '';
    if (textMatches(label) || hrefMatchesCalculator(href)) {
      link.setAttribute('href', target);
      link.setAttribute('data-solatrix-linked-calculator', 'true');
    } else if (textMatches(label, contactKeywords) && !/wa\.me|whatsapp/i.test(href)) {
      link.setAttribute('href', '#lead-form');
      link.setAttribute('data-solatrix-open-lead-form', 'true');
    }
  });

  document.querySelectorAll('button, [role="button"]').forEach((button) => {
    const label = button.textContent || '';
    if (textMatches(label)) {
      button.setAttribute('data-solatrix-linked-calculator', 'true');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = target;
      });
    } else if (textMatches(label, contactKeywords)) {
      button.setAttribute('data-solatrix-open-lead-form', 'true');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', connectRoofCheckLinks);
} else {
  connectRoofCheckLinks();
}
