const calculatorPath = 'roof-check/';
const calculatorKeywords = [
  /roof\s*check/i,
  /check\s*roof/i,
  /בדיקת\s*גג/,
  /בדקו\s*את\s*הגג/,
  /בדקו\s*גג/,
  /הגג\s*שלכם/,
  /בדיקה\s*חכמה/,
  /провер/i,
  /кры/i
];

function isCalculatorPage() {
  return /\/roof-check\/?$/.test(window.location.pathname) || /\/roof-check\//.test(window.location.pathname);
}

function calculatorUrl() {
  return new URL(calculatorPath, window.location.href).href;
}

function textMatchesCalculator(text = '') {
  const clean = text.replace(/\s+/g, ' ').trim();
  return calculatorKeywords.some((pattern) => pattern.test(clean));
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
    if (textMatchesCalculator(label) || hrefMatchesCalculator(href)) {
      link.setAttribute('href', target);
      link.setAttribute('data-solatrix-linked-calculator', 'true');
    }
  });

  document.querySelectorAll('button, [role="button"]').forEach((button) => {
    if (!textMatchesCalculator(button.textContent || '')) return;
    button.setAttribute('data-solatrix-linked-calculator', 'true');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = target;
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', connectRoofCheckLinks);
} else {
  connectRoofCheckLinks();
}
