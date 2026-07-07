const ROOT = '/roof-check-by-solatrix/';
const PHONE = '972547299727';
const LOGO_SRC = 'https://static.wixstatic.com/media/e34422_f461fb2e8382455e8d0d7ba9d71eca1e~mv2.png/v1/fill/w_298,h_194,al_c,q_90,enc_avif,quality_auto/Solatrix%20Logo%20Sait%20Main.png';

const navItems = [
  ['דף הבית', 'index.html'],
  ['בתים פרטיים', 'private-homes.html'],
  ['מחיר שקוף', 'solar-price.html'],
  ['בדיקת גג', 'roof-check/'],
  ['אגירה', 'storage.html'],
  ['עסקים ומסחר', 'business.html'],
  ['חקלאות', 'agriculture.html'],
  ['שאלות', 'faq.html']
];

function rootUrl(path = '') {
  return new URL(path, `${window.location.origin}${ROOT}`).href;
}

function navLink([label, path]) {
  const href = rootUrl(path);
  const active = path === 'roof-check/' ? ' active' : '';
  return `<a class="${active.trim()}" href="${href}">${label}</a>`;
}

function installStyles() {
  if (document.getElementById('solatrix-roof-header-bridge-style')) return;
  const style = document.createElement('style');
  style.id = 'solatrix-roof-header-bridge-style';
  style.textContent = `
    .siteHeader.solatrixPublicHeader { background: rgba(255,250,241,.94); border-bottom: 1px solid rgba(42,33,24,.08); }
    .siteHeader.solatrixPublicHeader .headerInner { width: min(1180px, calc(100% - 52px)); min-height: 84px; }
    .siteHeader.solatrixPublicHeader .brand { height: auto; min-width: 0; }
    .siteHeader.solatrixPublicHeader .logoMark { width: 190px; height: 74px; justify-content: center; }
    .siteHeader.solatrixPublicHeader .logoImage { width: 178px; max-height: 70px; object-fit: contain; object-position: center; }
    .siteHeader.solatrixPublicHeader .desktopNav { display: flex; align-items: center; justify-content: center; gap: 22px; flex: 1; font-weight: 900; color: #342a20; }
    .siteHeader.solatrixPublicHeader .desktopNav a { text-decoration: none; border: 0; padding: 8px 0; border-radius: 0; color: inherit; opacity: .82; white-space: nowrap; background: transparent; }
    .siteHeader.solatrixPublicHeader .desktopNav a:hover, .siteHeader.solatrixPublicHeader .desktopNav a.active { opacity: 1; color: #111; background: transparent; }
    .siteHeader.solatrixPublicHeader .headerCta { background: #25D366; border-radius: 999px; padding: 15px 30px; color: #fff; font-weight: 950; box-shadow: 0 16px 34px rgba(37,211,102,.24); }
    .siteHeader.solatrixPublicHeader .mobileMenu a { background: rgba(255,255,255,.92); color: #071b2f; text-align: center; }
    .siteHeader.solatrixPublicHeader .mobileMenu a.whatsappMobile { background: #25D366; color: #fff; }
    @media (max-width: 980px) {
      .siteHeader.solatrixPublicHeader .desktopNav { display: none; }
      .siteHeader.solatrixPublicHeader .headerInner { width: min(100% - 28px, 1180px); min-height: 72px; }
      .siteHeader.solatrixPublicHeader .logoMark { width: 150px; height: 58px; }
      .siteHeader.solatrixPublicHeader .logoImage { width: 146px; max-height: 54px; }
      .siteHeader.solatrixPublicHeader .headerCta { padding: 11px 18px; }
    }
  `;
  document.head.appendChild(style);
}

function patchHeader() {
  const header = document.querySelector('.siteHeader');
  if (!header || header.dataset.solatrixPublicHeader === 'true') return;
  installStyles();
  header.dataset.solatrixPublicHeader = 'true';
  header.classList.add('solatrixPublicHeader');
  header.innerHTML = `
    <div class="headerInner">
      <a class="brand" href="${rootUrl('index.html')}" aria-label="Solatrix Energy דף הבית">
        <div class="logoMark"><img class="logoImage" src="${LOGO_SRC}" alt="Solatrix Energy" loading="eager" /></div>
      </a>
      <nav class="desktopNav" aria-label="ניווט ראשי">${navItems.map(navLink).join('')}</nav>
      <div class="headerActions">
        <a class="headerCta" href="https://wa.me/${PHONE}" target="_blank" rel="noreferrer">וואטסאפ</a>
        <button class="menuBtn" type="button" aria-label="Menu">☰</button>
      </div>
    </div>
    <nav class="mobileMenu" aria-label="ניווט מובייל">
      ${navItems.map(navLink).join('')}
      <a class="whatsappMobile" href="https://wa.me/${PHONE}" target="_blank" rel="noreferrer">וואטסאפ</a>
    </nav>
  `;
  const menuButton = header.querySelector('.menuBtn');
  menuButton?.addEventListener('click', () => {
    header.classList.toggle('menuOpen');
    menuButton.textContent = header.classList.contains('menuOpen') ? '×' : '☰';
  });
}

const observer = new MutationObserver(() => patchHeader());

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    patchHeader();
    observer.observe(document.body, { childList: true, subtree: true });
  });
} else {
  patchHeader();
  observer.observe(document.body, { childList: true, subtree: true });
}
