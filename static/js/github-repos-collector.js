/**
 * GitHub Repos Collector
 * Constantine Universe — The Hidden Network
 * Fetches and displays GitHub repositories via the public API.
 */

const GITHUB_API = 'https://api.github.com';
const PER_PAGE = 100; // maximum allowed per request

const state = {
  repos: [],
  currentPage: 1,
  reposPerPage: 12,
  filterText: '',
  sortBy: 'stars',
  sortDir: 'desc',
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form         = document.getElementById('collector-form');
const usernameIn   = document.getElementById('github-username');
const typeSelect   = document.getElementById('repo-type');
const sortSelect   = document.getElementById('sort-by');
const filterIn     = document.getElementById('filter-repos');
const resultsEl    = document.getElementById('repo-results');
const statusEl     = document.getElementById('collector-status');
const paginationEl = document.getElementById('pagination');
const totalEl      = document.getElementById('total-count');

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchAllRepos(username, type) {
  let allRepos = [];
  let page = 1;

  setStatus('CONNECTING…', 'info');

  while (true) {
    const url =
      `${GITHUB_API}/users/${encodeURIComponent(username)}/repos` +
      `?type=${type}&per_page=${PER_PAGE}&page=${page}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (res.status === 404) throw new Error(`User "${username}" not found.`);
    if (res.status === 403) throw new Error('API rate limit exceeded. Try again later.');
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    allRepos = allRepos.concat(batch);
    if (batch.length < PER_PAGE) break;
    page++;
  }

  return allRepos;
}

// ── Sorting & filtering ───────────────────────────────────────────────────────
function applyFiltersAndSort(repos) {
  let list = repos.slice();

  const q = state.filterText.toLowerCase().trim();
  if (q) {
    list = list.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.language && r.language.toLowerCase().includes(q))
    );
  }

  const { sortBy, sortDir } = state;
  list.sort((a, b) => {
    let va, vb;
    if (sortBy === 'stars')        { va = a.stargazers_count;     vb = b.stargazers_count; }
    else if (sortBy === 'forks')   { va = a.forks_count;          vb = b.forks_count; }
    else if (sortBy === 'updated') { va = new Date(a.updated_at); vb = new Date(b.updated_at); }
    else                           { va = a.name.toLowerCase();   vb = b.name.toLowerCase(); }

    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  return list;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function languageColor(lang) {
  const colors = {
    JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5',
    Java: '#b07219',  'C++': '#f34b7d', C: '#555555', CSS: '#563d7c',
    HTML: '#e34c26',  Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584',
    PHP: '#4F5D95', Shell: '#89e051', Swift: '#F05138', Kotlin: '#F18E33',
  };
  return colors[lang] || '#8b949e';
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30.44);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRepoCard(repo) {
  const lang = repo.language || '—';
  const desc = repo.description
    ? escapeHtml(repo.description)
    : '<span class="no-desc">// no description</span>';

  return `
    <div class="repo-card">
      <div class="repo-card-header">
        <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h7A2.5 2.5 0 0 1 14 2.5v11.25a.75.75 0 0
              1-1.035.69l-2.965-1.334-2.965 1.334A.75.75 0 0 1 6 13.75V2.5A1 1 0 0 0
              5 1.5H4.5a1 1 0 0 0-1 1v11.25A.75.75 0 0 1 2 14V2.5z"/>
          </svg>
          ${escapeHtml(repo.name)}
        </a>
        ${repo.fork ? '<span class="badge fork-badge">fork</span>' : ''}
        ${repo.archived ? '<span class="badge archived-badge">archived</span>' : ''}
        ${repo.private
          ? '<span class="badge private-badge">private</span>'
          : '<span class="badge public-badge">public</span>'}
      </div>
      <p class="repo-desc">${desc}</p>
      <div class="repo-meta">
        ${lang !== '—'
          ? `<span class="lang-dot" style="background:${languageColor(lang)}"></span>
             <span class="lang-label">${escapeHtml(lang)}</span>`
          : ''}
        <span class="meta-stat" title="Stars">&#9733; ${repo.stargazers_count.toLocaleString()}</span>
        <span class="meta-stat" title="Forks">&#9906; ${repo.forks_count.toLocaleString()}</span>
        <span class="meta-stat" title="Open issues">&#9679; ${repo.open_issues_count.toLocaleString()}</span>
        <span class="meta-updated" title="Last updated">&#8635; ${relativeTime(repo.updated_at)}</span>
      </div>
      ${repo.topics && repo.topics.length
        ? `<div class="repo-topics">${repo.topics
            .map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`)
            .join('')}</div>`
        : ''}
    </div>`;
}

function renderPage() {
  const filtered = applyFiltersAndSort(state.repos);
  const total    = filtered.length;
  const pages    = Math.ceil(total / state.reposPerPage);
  const start    = (state.currentPage - 1) * state.reposPerPage;
  const slice    = filtered.slice(start, start + state.reposPerPage);

  totalEl.textContent = `${total.toLocaleString()} repo${total !== 1 ? 's' : ''}`;

  if (total === 0) {
    resultsEl.innerHTML    = '<div class="no-results">// no repositories matched</div>';
    paginationEl.innerHTML = '';
    return;
  }

  resultsEl.innerHTML = slice.map(renderRepoCard).join('');
  renderPagination(pages);
}

function renderPagination(pages) {
  if (pages <= 1) { paginationEl.innerHTML = ''; return; }

  const cur  = state.currentPage;
  const btns = [];

  btns.push(pageBtn('&laquo;', 1, cur === 1));
  btns.push(pageBtn('&lsaquo;', cur - 1, cur === 1));

  for (const p of pageRange(cur, pages)) {
    if (p === '…') {
      btns.push('<span class="pg-ellipsis">…</span>');
    } else {
      btns.push(pageBtn(p, p, false, p === cur));
    }
  }

  btns.push(pageBtn('&rsaquo;', cur + 1, cur === pages));
  btns.push(pageBtn('&raquo;', pages, cur === pages));

  paginationEl.innerHTML = btns.join('');
}

function pageBtn(label, target, disabled, active = false) {
  const cls = ['pg-btn', disabled ? 'pg-disabled' : '', active ? 'pg-active' : '']
    .filter(Boolean)
    .join(' ');
  return `<button class="${cls}" data-page="${target}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function pageRange(cur, pages) {
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, cur - delta); i <= Math.min(pages - 1, cur + delta); i++) {
    range.push(i);
  }
  if (cur - delta > 2)         range.unshift('…');
  if (cur + delta < pages - 1) range.push('…');
  range.unshift(1);
  if (pages > 1) range.push(pages);
  return range;
}

function setStatus(msg, type = 'info') {
  statusEl.textContent = msg;
  statusEl.className   = `collector-status status-${type}`;
}

// ── Event handlers ────────────────────────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();
  const username = usernameIn.value.trim();
  if (!username) return;

  const type = typeSelect.value;
  state.repos       = [];
  state.currentPage = 1;
  resultsEl.innerHTML    = '';
  paginationEl.innerHTML = '';
  totalEl.textContent    = '';

  try {
    setStatus(`FETCHING repos for @${username}…`, 'info');
    const repos = await fetchAllRepos(username, type);
    state.repos = repos;

    const s = repos.length;
    setStatus(`COLLECTED ${s} repo${s !== 1 ? 's' : ''} ✓`, 'success');
    renderPage();
  } catch (err) {
    setStatus(`ERROR — ${err.message}`, 'error');
    resultsEl.innerHTML =
      `<div class="no-results error-msg">// ${escapeHtml(err.message)}</div>`;
  }
});

sortSelect.addEventListener('change', () => {
  const [by, dir] = sortSelect.value.split('-');
  state.sortBy      = by;
  state.sortDir     = dir;
  state.currentPage = 1;
  renderPage();
});

filterIn.addEventListener('input', () => {
  state.filterText  = filterIn.value;
  state.currentPage = 1;
  renderPage();
});

paginationEl.addEventListener('click', e => {
  const btn = e.target.closest('.pg-btn');
  if (!btn || btn.disabled) return;
  state.currentPage = parseInt(btn.dataset.page, 10);
  renderPage();
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
