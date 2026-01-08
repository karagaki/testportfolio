import { loadRules, exportAllData, importAllData } from './src/storage.js';

const SITE_NAMES_KEY = 'aps_site_names_v1';

async function loadSiteNames() {
  const r = await chrome.storage.local.get(SITE_NAMES_KEY);
  return r[SITE_NAMES_KEY] || {};
}

async function saveSiteNames(map) {
  await chrome.storage.local.set({ [SITE_NAMES_KEY]: map });
}

const els = {
  btnExport: document.getElementById('btnExport'),
  btnRefresh: document.getElementById('btnRefresh'),
  fileImport: document.getElementById('fileImport'),
  q: document.getElementById('q'),
  stats: document.getElementById('stats'),
  empty: document.getElementById('empty'),
  table: document.getElementById('sitesTable'),
  tbody: document.getElementById('sitesTbody'),
};

function fmtDate(ts) {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    return d.toLocaleString('ja-JP', { hour12: false });
  } catch {
    return '-';
  }
}

function safeHost(scope) {
  return (scope && typeof scope.host === 'string' && scope.host) ? scope.host : '(unknown)';
}

function toOpenableUrl(host, pathPattern) {
  const base = `https://${host}`;
  const p = (pathPattern || '').trim();

  if (!p || p === '/') return base;

  const star = p.indexOf('*');
  const clean = (star >= 0 ? p.slice(0, star) : p).trim();

  if (!clean || clean === '/') return base;
  return clean.startsWith('/') ? (base + clean) : (base + '/' + clean);
}

function summarizeByHost(rules) {
  const map = new Map();
  const siteNames = window.__siteNames || {};

  for (const r of rules || []) {
    const host = safeHost(r?.scope);
    if (!map.has(host)) map.set(host, []);
    map.get(host).push(r);
  }

  const rows = [];
  for (const [host, rs] of map.entries()) {
    const siteName =
      siteNames[host] ||
      rs.find(r => r?.meta?.siteName)?.meta?.siteName ||
      rs.find(r => r?.meta?.title)?.meta?.title ||
      host;
    const total = rs.length;
    const enabled = rs.filter(x => x?.enabled !== false).length;
    const listEnabled = rs.filter(x => x?.enabled !== false && x?.list?.enabled && x?.list?.itemSelector).length;

    const lastUpdated = rs.reduce((acc, x) => {
      const u = x?.meta?.updatedAt || x?.meta?.createdAt || 0;
      return Math.max(acc, u || 0);
    }, 0);

    const paths = Array.from(new Set(
      rs.map(x => x?.scope?.pathPattern).filter(Boolean)
    ));

    rows.push({
      host,
      siteName,
      paths,
      total,
      enabled,
      listEnabled,
      lastUpdated,
      rules: rs,
    });
  }

  rows.sort((a, b) => a.host.localeCompare(b.host));
  return rows;
}

function clearTable() {
  els.tbody.innerHTML = '';
}

function makeCell(tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function makeDetailRow(host, rules) {
  const tr = document.createElement('tr');
  tr.className = 'detail-row';
  tr.dataset.detailFor = host;

  const td = document.createElement('td');
  td.colSpan = 6;

  const wrap = document.createElement('div');
  wrap.className = 'details';

  const sorted = [...rules].sort((a, b) => {
    const au = a?.meta?.updatedAt || a?.meta?.createdAt || 0;
    const bu = b?.meta?.updatedAt || b?.meta?.createdAt || 0;
    return bu - au;
  });

  for (const r of sorted) {
    const box = document.createElement('div');
    box.className = 'r';

    const title = (r?.meta?.title || '').trim() || '(titleなし)';
    const pathPattern = (r?.scope?.pathPattern || '').trim() || '(pathなし)';
    const applyToAll = !!r?.scope?.applyToAllPaths;
    const wildcard = !!r?.scope?.useWildcard;

    const enabled = (r?.enabled !== false);
    const listMode = !!(r?.list?.enabled && r?.list?.itemSelector);

    const line1 = document.createElement('div');
    line1.innerHTML = `<span class="k">ルール</span> <code>${escapeHtml(title)}</code>`;
    box.appendChild(line1);

    const line2 = document.createElement('div');
    line2.innerHTML = `<span class="k">path</span> <code>${escapeHtml(pathPattern)}</code>`;
    box.appendChild(line2);

    const line3 = document.createElement('div');
    line3.innerHTML =
      `<span class="k">状態</span> ` +
      `<span class="badge ${enabled ? 'ok' : 'warn'}">${enabled ? '有効' : '無効'}</span> ` +
      `<span class="badge">${listMode ? 'リスト:ON' : 'リスト:OFF'}</span> ` +
      `<span class="badge">${applyToAll ? '全パス' : '限定パス'}</span> ` +
      `<span class="badge">${wildcard ? 'ワイルドカード' : '通常'}</span>`;
    box.appendChild(line3);

    const line4 = document.createElement('div');
    line4.innerHTML = `<span class="k">更新</span> <code>${escapeHtml(fmtDate(r?.meta?.updatedAt || r?.meta?.createdAt || 0))}</code>`;
    box.appendChild(line4);

    wrap.appendChild(box);
  }

  td.appendChild(wrap);
  tr.appendChild(td);
  tr.hidden = true;
  return tr;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toggleDetails(host) {
  const row = els.tbody.querySelector(`tr.detail-row[data-detail-for="${CSS.escape(host)}"]`);
  if (!row) return;
  row.hidden = !row.hidden;
}

function render(rows, query) {
  clearTable();

  const q = (query || '').trim().toLowerCase();
  const filtered = q ? rows.filter(r => r.host.toLowerCase().includes(q)) : rows;

  const totalSites = filtered.length;
  const totalRules = filtered.reduce((acc, r) => acc + r.total, 0);
  const totalEnabled = filtered.reduce((acc, r) => acc + r.enabled, 0);

  els.stats.textContent = `サイト: ${totalSites} / ルール: ${totalRules} / 有効: ${totalEnabled}`;

  if (!filtered.length) {
    els.table.hidden = true;
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;
  els.table.hidden = false;

  for (const r of filtered) {
    const tr = document.createElement('tr');

    const hostTd = document.createElement('td');

    const nameWrap = document.createElement('div');
    nameWrap.className = 'site-name-wrap';

    const nameInput = document.createElement('input');
    nameInput.className = 'site-name-input';
    nameInput.type = 'text';
    nameInput.value = r.siteName;
    nameInput.placeholder = 'サイト名（自由入力）';

    nameInput.addEventListener('change', async () => {
      const names = await loadSiteNames();
      const v = nameInput.value.trim();
      if (v) {
        names[r.host] = v;
      } else {
        delete names[r.host];
      }
      await saveSiteNames(names);
    });

    nameWrap.appendChild(nameInput);
    hostTd.appendChild(nameWrap);

    const urlsWrap = document.createElement('div');
    urlsWrap.className = 'site-urls';

    const paths = Array.isArray(r.paths) && r.paths.length ? r.paths : ['/'];

    for (const path of paths) {
      const a = document.createElement('a');
      a.className = 'site-link';
      a.href = toOpenableUrl(r.host, path);
      a.textContent = `${r.host}${path.startsWith('/') ? path : '/' + path}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      urlsWrap.appendChild(a);

      const br = document.createElement('div');
      br.style.height = '2px';
      urlsWrap.appendChild(br);
    }

    hostTd.appendChild(urlsWrap);
    tr.appendChild(hostTd);

    tr.appendChild(makeCell('td', String(r.total), 'num'));
    tr.appendChild(makeCell('td', String(r.enabled), 'num'));
    tr.appendChild(makeCell('td', String(r.listEnabled), 'num'));
    tr.appendChild(makeCell('td', fmtDate(r.lastUpdated), ''));

    const btnTd = document.createElement('td');
    btnTd.className = 'num';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'linkbtn';
    btn.textContent = '表示';
    btn.addEventListener('click', () => toggleDetails(r.host));
    btnTd.appendChild(btn);
    tr.appendChild(btnTd);

    els.tbody.appendChild(tr);
    els.tbody.appendChild(makeDetailRow(r.host, r.rules));
  }
}

async function refresh() {
  window.__siteNames = await loadSiteNames();
  const loaded = await loadRules();

  const rules =
    Array.isArray(loaded?.rules)
      ? loaded.rules
      : Array.isArray(loaded?.rules?.rules)
        ? loaded.rules.rules
        : [];
  const rows = summarizeByHost(rules);

  if (!rules || !rules.length) {
    els.stats.textContent = 'サイト: 0 / ルール: 0 / 有効: 0';
    els.table.hidden = true;
    els.empty.hidden = false;
    clearTable();
    return;
  }

  render(rows, els.q.value);
}

els.btnExport.addEventListener('click', async () => {
  const payload = await exportAllData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `aps_backup_${ts}.json`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

els.fileImport.addEventListener('change', async () => {
  const file = els.fileImport.files?.[0];
  els.fileImport.value = '';
  if (!file) return;

  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    alert('JSONの形式が不正です');
    return;
  }

  try {
    await importAllData(payload);
    await refresh();
    alert('インポートしました');
  } catch (e) {
    console.error(e);
    alert('インポートに失敗しました（Console を確認）');
  }
});

els.btnRefresh.addEventListener('click', refresh);
els.q.addEventListener('input', () => refresh());

refresh();
