const REPO_ROOT = '/roof-check-by-solatrix/';
const WRONG_CALC_ROOT = '/roof-check/';

function isGitHubPages() {
  return window.location.hostname.endsWith('github.io');
}

function shouldUseRepoRoot() {
  return isGitHubPages() || window.location.pathname.includes(REPO_ROOT);
}

function rewritePath(url) {
  if (!shouldUseRepoRoot() || !url) return url;
  if (typeof url !== 'string') return url;
  if (url.startsWith(REPO_ROOT)) return url;
  if (url.startsWith(WRONG_CALC_ROOT)) return `${REPO_ROOT.replace(/\/$/, '')}${url}`;
  return url;
}

if (shouldUseRepoRoot() && window.location.pathname.startsWith(WRONG_CALC_ROOT) && !window.location.pathname.startsWith(REPO_ROOT)) {
  window.location.replace(`${REPO_ROOT.replace(/\/$/, '')}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

const originalPushState = window.history.pushState.bind(window.history);
const originalReplaceState = window.history.replaceState.bind(window.history);

window.history.pushState = function patchedPushState(state, title, url) {
  return originalPushState(state, title, rewritePath(url));
};

window.history.replaceState = function patchedReplaceState(state, title, url) {
  return originalReplaceState(state, title, rewritePath(url));
};
