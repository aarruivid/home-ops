/**
 * FinanzOps SPA v3 — 8-view hash router with Charts, Tabs, Analytics
 */

// ── Global State ────────────────────────────────────────────────
const appState = { users: [], categories: [], budgets: [], charts: {} };

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n) => {
    const num = typeof n === 'number' ? n : parseFloat(n) || 0;
    return num.toFixed(2) + '\u20AC';
};

const fmtDate = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDateShort = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const categoryColors = [
    '#4f46e5', '#3b82f6', '#16a34a', '#d97706', '#dc2626',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#d946ef', '#84cc16', '#fb923c', '#a78bfa'
];

function getCatColor(i) { return categoryColors[i % categoryColors.length]; }

function budgetClass(pct) {
    if (pct >= 100) return 'red';
    if (pct >= 80) return 'yellow';
    return 'green';
}

function budgetColorVar(pct) {
    if (pct >= 100) return 'var(--red)';
    if (pct >= 80) return 'var(--yellow)';
    return 'var(--green)';
}

function setLoading() {
    document.getElementById('app').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>`;
}

function showError(msg) {
    document.getElementById('app').innerHTML = `
        <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>${msg}</p>
        </div>`;
}

function esc(str) {
    if (!str) return '';
    const el = document.createElement('span');
    el.textContent = String(str);
    return el.innerHTML;
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

function getUserName(userId) {
    const u = appState.users.find(u => u.id === userId);
    return u ? u.name : 'Unknown';
}

function getShortName(userId) {
    const name = getUserName(userId);
    if (name === 'Isabela') return 'Bela';
    return name;
}

// SVG icons
const icons = {
    chevronDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
};

// ── Chart Helpers ────────────────────────────────────────────────
function getChartColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        text: style.getPropertyValue('--text').trim() || '#0f172a',
        muted: style.getPropertyValue('--muted').trim() || '#64748b',
        border: style.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.08)',
        surface2: style.getPropertyValue('--surface2').trim() || '#f1f5f9',
    };
}

function destroyChart(key) {
    if (appState.charts[key]) {
        appState.charts[key].destroy();
        delete appState.charts[key];
    }
}

function destroyAllCharts() {
    Object.keys(appState.charts).forEach(destroyChart);
}

function renderDonutChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const c = getChartColors();
    destroyChart(canvasId);
    appState.charts[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: 'var(--surface)',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: c.text, font: { size: 11, family: 'Inter' }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
                },
                tooltip: {
                    callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)}` },
                },
            },
        },
    });
}

function renderBarChart(canvasId, labels, datasets) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const c = getChartColors();
    destroyChart(canvasId);
    appState.charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { labels: { color: c.text, font: { size: 11, family: 'Inter' } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.x)}` } },
            },
            scales: {
                x: {
                    ticks: { color: c.muted, font: { size: 10 }, callback: (v) => fmt(v) },
                    grid: { color: c.border },
                },
                y: {
                    ticks: { color: c.muted, font: { size: 11 } },
                    grid: { display: false },
                },
            },
        },
    });
}

function renderLineChart(canvasId, labels, datasets) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const c = getChartColors();
    destroyChart(canvasId);
    appState.charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: c.text, font: { size: 11, family: 'Inter' }, usePointStyle: true } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
            },
            scales: {
                x: {
                    ticks: { color: c.muted, font: { size: 10 }, maxRotation: 0 },
                    grid: { color: c.border },
                },
                y: {
                    ticks: { color: c.muted, font: { size: 10 }, callback: (v) => fmt(v) },
                    grid: { color: c.border },
                    beginAtZero: true,
                },
            },
        },
    });
}

// ── Theme Toggle ────────────────────────────────────────────────
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('portal_theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (sun && moon) {
        sun.style.display = theme === 'dark' ? 'none' : 'block';
        moon.style.display = theme === 'dark' ? 'block' : 'none';
    }
}

// ── Toast ────────────────────────────────────────────────────────
function toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Modal System ────────────────────────────────────────────────
function openModal(title, bodyHtml, footerHtml) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <span class="modal-title">${esc(title)}</span>
                <button class="modal-close" onclick="closeModal()" aria-label="Close">${icons.x}</button>
            </div>
            <div class="modal-body" id="modal-body">${bodyHtml}</div>
            ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>`;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ── Router ──────────────────────────────────────────────────────
const routes = { home, groceries, categorias, empresa, pendientes, presupuestos, historial, analytics };

function navigateTo(view) {
    location.hash = view;
}

function navigate() {
    const hash = location.hash.slice(1) || 'home';
    const viewFn = routes[hash];

    destroyAllCharts();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === hash);
    });

    if (viewFn) viewFn();
    else home();

    updatePendingBadge();
}

let _pendingBadgeCache = { ts: 0, count: null };
async function updatePendingBadge() {
    const now = Date.now();
    if (_pendingBadgeCache.count !== null && now - _pendingBadgeCache.ts < 30000) {
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.textContent = _pendingBadgeCache.count;
            badge.style.display = _pendingBadgeCache.count > 0 ? '' : 'none';
        }
        return;
    }
    try {
        const data = await api.pendingExpenses();
        const items = data.expenses || [];
        const count = items.length;
        _pendingBadgeCache = { ts: now, count };
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        }
    } catch { /* silent */ }
}

// ── Init ────────────────────────────────────────────────────────
async function initApp() {
    updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');
    try {
        const [usersData, catsData, budgetsData] = await Promise.all([
            api.users(), api.categories(), api.budgets(),
        ]);
        appState.users = usersData.users || [];
        appState.categories = catsData.categories || [];
        appState.budgets = budgetsData.budgets || [];
    } catch { /* will retry per-view */ }
    navigate();
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', initApp);

// ── Per-Person Expense Section Builder ──────────────────────────
function renderPersonSections(expenses, options = {}) {
    const { showCategory = true, showDate = true, editable = false, onEdit, onDelete } = options;

    const byUser = {};
    appState.users.forEach(u => { byUser[u.id] = { user: u, items: [], total: 0 }; });

    expenses.forEach(e => {
        const uid = e.user_id;
        if (!byUser[uid]) byUser[uid] = { user: { id: uid, name: e.user_name || 'Unknown' }, items: [], total: 0 };
        byUser[uid].items.push(e);
        byUser[uid].total += e.amount || 0;
    });

    const sections = Object.values(byUser);
    const grandTotal = sections.reduce((s, sec) => s + sec.total, 0);

    let html = '';
    sections.forEach(sec => {
        if (sec.items.length === 0 && sections.length > 1) return;
        const shortName = sec.user.name === 'Isabela' ? 'Bela' : sec.user.name;
        html += `
        <div class="person-section">
            <div class="person-header">
                <span class="person-name">${esc(shortName)}</span>
                <span class="person-total">${fmt(sec.total)}</span>
            </div>
            <div class="person-body">
                ${sec.items.length > 0 ? `<div class="expense-list">
                    ${sec.items.map(e => renderExpenseRow(e, { showCategory, showDate, editable })).join('')}
                </div>` : '<p class="text-muted text-center mt-8" style="padding:12px">No expenses</p>'}
            </div>
        </div>`;
    });

    if (sections.filter(s => s.items.length > 0).length > 1) {
        html += `
        <div class="combined-total">
            <span class="label">Combined Total</span>
            <span class="amount">${fmt(grandTotal)}</span>
        </div>`;
    }

    return html || '<div class="empty-state mt-24">' + icons.empty + '<p>No expenses</p></div>';
}

function renderExpenseRow(e, options = {}) {
    const { showCategory = true, showDate = true, editable = true } = options;
    return `
    <div class="expense-item" ${editable ? `onclick="openEditExpense(${e.id})"` : ''}>
        <div class="expense-info">
            <span class="expense-desc">${esc(e.description || '-')}</span>
            <div class="expense-meta">
                ${showDate && e.date ? `<span>${fmtDateShort(e.date)}</span>` : ''}
                ${showCategory && e.category_name ? `<span class="tag">${esc(e.category_icon || '')} ${esc(e.category_name)}</span>` : ''}
                ${e.user_name ? `<span class="tag">${esc(e.user_name === 'Isabela' ? 'Bela' : e.user_name)}</span>` : ''}
            </div>
        </div>
        <span class="expense-amount mono">${fmt(e.amount)}</span>
        ${editable ? `<div class="expense-actions">
            <button class="btn-icon btn-ghost" onclick="event.stopPropagation();deleteExpenseConfirm(${e.id})" title="Delete">${icons.trash}</button>
        </div>` : ''}
    </div>`;
}

// ── Quick Add Form Builder ──────────────────────────────────────
function renderQuickAdd(defaults = {}) {
    const catOptions = appState.categories.map(c =>
        `<option value="${c.id}" ${c.id == defaults.category_id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`
    ).join('');

    const userToggles = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        const active = (defaults.user_id || 1) == u.id;
        return `<button type="button" class="toggle-btn ${active ? 'active' : ''}" onclick="selectQuickAddUser(${u.id})">${esc(short)}</button>`;
    }).join('');

    return `
    <form class="quick-add" onsubmit="submitQuickAdd(event)">
        <div class="input-group amount">
            <label class="field-label">Amount</label>
            <input type="number" step="0.01" min="0.01" class="field-input mono" id="qa-amount" required placeholder="0.00">
        </div>
        <div class="input-group desc">
            <label class="field-label">Description</label>
            <input type="text" class="field-input" id="qa-desc" placeholder="Description" required>
        </div>
        <div class="input-group">
            <label class="field-label">Category</label>
            <select class="field-input" id="qa-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Person</label>
            <div class="toggle-group" id="qa-user-toggle">${userToggles}</div>
            <input type="hidden" id="qa-user" value="${defaults.user_id || 1}">
        </div>
        <div class="input-group">
            <label class="field-label">Date</label>
            <input type="date" class="field-input" id="qa-date" value="${defaults.date || todayISO()}">
        </div>
        <button type="submit" class="btn btn-primary">${icons.plus} Add</button>
    </form>`;
}

function selectQuickAddUser(userId) {
    document.getElementById('qa-user').value = userId;
    document.querySelectorAll('#qa-user-toggle .toggle-btn').forEach((btn, i) => {
        btn.classList.toggle('active', appState.users[i] && appState.users[i].id === userId);
    });
}

async function submitQuickAdd(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('qa-amount').value);
    const description = document.getElementById('qa-desc').value.trim();
    const category_id = parseInt(document.getElementById('qa-cat').value);
    const user_id = parseInt(document.getElementById('qa-user').value);
    const date = document.getElementById('qa-date').value;

    if (!amount || amount <= 0) { toast('Invalid amount', 'error'); return; }
    if (!description) { toast('Description required', 'error'); return; }

    try {
        await api.createExpense({ amount, description, category_id, user_id, date, status: 'confirmed' });
        toast('Expense added');
        navigate();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ── Edit Expense Modal ──────────────────────────────────────────
async function openEditExpense(expenseId) {
    let expense = null;
    try {
        const all = await api.expenses({ per_page: 500 });
        expense = (all.expenses || []).find(e => e.id === expenseId);
    } catch { /* fallback */ }
    if (!expense) { toast('Expense not found', 'error'); return; }

    const catOptions = appState.categories.map(c =>
        `<option value="${c.id}" ${c.id == expense.category_id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`
    ).join('');

    const userToggles = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        return `<button type="button" class="toggle-btn ${u.id == expense.user_id ? 'active' : ''}" onclick="selectEditUser(${u.id})">${esc(short)}</button>`;
    }).join('');

    const body = `
        <div class="input-group">
            <label class="field-label">Amount</label>
            <input type="number" step="0.01" class="field-input mono" id="edit-amount" value="${expense.amount}">
        </div>
        <div class="input-group">
            <label class="field-label">Description</label>
            <input type="text" class="field-input" id="edit-desc" value="${esc(expense.description || '')}">
        </div>
        <div class="input-group">
            <label class="field-label">Category</label>
            <select class="field-input" id="edit-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Person</label>
            <div class="toggle-group" id="edit-user-toggle">${userToggles}</div>
            <input type="hidden" id="edit-user" value="${expense.user_id}">
        </div>
        <div class="input-group">
            <label class="field-label">Date</label>
            <input type="date" class="field-input" id="edit-date" value="${expense.date}">
        </div>
        <div class="input-group">
            <label class="field-label">Status</label>
            <select class="field-input" id="edit-status">
                <option value="confirmed" ${expense.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="pending" ${expense.status === 'pending' ? 'selected' : ''}>Pending</option>
            </select>
        </div>`;

    const footer = `
        <button class="btn btn-danger" onclick="deleteExpenseConfirm(${expense.id})">Delete</button>
        <div style="flex:1"></div>
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveEditExpense(${expense.id})">Save</button>`;

    openModal('Edit Expense', body, footer);
}

function selectEditUser(userId) {
    document.getElementById('edit-user').value = userId;
    document.querySelectorAll('#edit-user-toggle .toggle-btn').forEach((btn, i) => {
        btn.classList.toggle('active', appState.users[i] && appState.users[i].id === userId);
    });
}

async function saveEditExpense(id) {
    const data = {
        amount: parseFloat(document.getElementById('edit-amount').value),
        description: document.getElementById('edit-desc').value.trim(),
        category_id: parseInt(document.getElementById('edit-cat').value),
        user_id: parseInt(document.getElementById('edit-user').value),
        date: document.getElementById('edit-date').value,
        status: document.getElementById('edit-status').value,
    };

    try {
        await api.updateExpense(id, data);
        toast('Expense updated');
        closeModal();
        navigate();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function deleteExpenseConfirm(id) {
    closeModal();
    openModal('Delete Expense', '<p>Are you sure you want to delete this expense?</p>',
        `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
         <button class="btn btn-danger" onclick="doDeleteExpense(${id})">Delete</button>`);
}

async function doDeleteExpense(id) {
    try {
        await api.deleteExpense(id);
        toast('Expense deleted');
        closeModal();
        navigate();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ── Quick Add Modal (FAB) ───────────────────────────────────────
function openQuickAddModal() {
    const catOptions = appState.categories.map(c =>
        `<option value="${c.id}">${esc(c.icon || '')} ${esc(c.name)}</option>`
    ).join('');

    const userToggles = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        return `<button type="button" class="toggle-btn ${u.id === 1 ? 'active' : ''}" onclick="selectModalUser(${u.id})">${esc(short)}</button>`;
    }).join('');

    const body = `
        <div class="input-group">
            <label class="field-label">Amount</label>
            <input type="number" step="0.01" min="0.01" class="field-input mono" id="modal-amount" required placeholder="0.00">
        </div>
        <div class="input-group">
            <label class="field-label">Description</label>
            <input type="text" class="field-input" id="modal-desc" required placeholder="Description">
        </div>
        <div class="input-group">
            <label class="field-label">Category</label>
            <select class="field-input" id="modal-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Person</label>
            <div class="toggle-group" id="modal-user-toggle">${userToggles}</div>
            <input type="hidden" id="modal-user" value="1">
        </div>
        <div class="input-group">
            <label class="field-label">Date</label>
            <input type="date" class="field-input" id="modal-date" value="${todayISO()}">
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitModalAdd()">Add</button>`;

    openModal('New Expense', body, footer);
    setTimeout(() => document.getElementById('modal-amount')?.focus(), 100);
}

function selectModalUser(userId) {
    document.getElementById('modal-user').value = userId;
    document.querySelectorAll('#modal-user-toggle .toggle-btn').forEach((btn, i) => {
        btn.classList.toggle('active', appState.users[i] && appState.users[i].id === userId);
    });
}

async function submitModalAdd() {
    const amount = parseFloat(document.getElementById('modal-amount').value);
    const description = document.getElementById('modal-desc').value.trim();
    const category_id = parseInt(document.getElementById('modal-cat').value);
    const user_id = parseInt(document.getElementById('modal-user').value);
    const date = document.getElementById('modal-date').value;

    if (!amount || amount <= 0) { toast('Invalid amount', 'error'); return; }
    if (!description) { toast('Description required', 'error'); return; }

    try {
        await api.createExpense({ amount, description, category_id, user_id, date, status: 'confirmed' });
        toast('Expense added');
        closeModal();
        navigate();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
//  VIEWS
// ═══════════════════════════════════════════════════════════════

// ── View: Home ──────────────────────────────────────────────────
async function home() {
    setLoading();
    try {
        const [data, compareData, recentData] = await Promise.all([
            api.overview(),
            api.compare().catch(() => null),
            api.expenses({ status: 'confirmed', per_page: 10 }).catch(() => ({ expenses: [] })),
        ]);
        const byUser = data.by_user || [];
        const categories = (data.by_category || []).filter(c => c.total > 0);
        const byUserCategory = data.by_user_category || [];
        const recentExpenses = recentData.expenses || [];

        const now = new Date();
        const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // Stat cards from users
        const statCards = byUser.map(u => {
            const short = u.name === 'Isabela' ? 'Bela' : u.name;
            const color = u.user_id === 1 ? 'blue' : 'accent';
            const iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
            return `
            <div class="stat-card">
                <div class="stat-icon ${color}">${iconSvg}</div>
                <div class="stat-body">
                    <div class="stat-label">${esc(short)}</div>
                    <div class="stat-value mono">${fmt(u.total)}</div>
                </div>
            </div>`;
        }).join('');

        const totalCard = `
        <div class="stat-card">
            <div class="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-body">
                <div class="stat-label">Monthly Total</div>
                <div class="stat-value mono">${fmt(data.grand_total)}</div>
                <div class="stat-sub">${monthLabel}</div>
            </div>
        </div>`;

        // Month comparison card
        let comparisonHtml = '';
        if (compareData) {
            const diff = compareData.diff;
            const pct = compareData.diff_pct;
            const isUp = diff > 0;
            const color = isUp ? 'var(--red)' : 'var(--green)';
            const arrow = isUp ? '↑' : '↓';
            comparisonHtml = `
            <div class="comparison-card">
                <div>
                    <div class="comp-label">vs ${monthNames[(compareData.previous.month || 1) - 1]}</div>
                    <div class="comp-value" style="color:${color}">${arrow} ${fmt(Math.abs(diff))} (${Math.abs(pct)}%)</div>
                </div>
            </div>`;
        }

        // Charts — donut + bar
        const chartHtml = categories.length > 0 ? `
        <div class="chart-row">
            <div class="card">
                <div class="section-title">Category Breakdown</div>
                <div class="chart-container" style="height:260px">
                    <canvas id="home-donut"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="section-title">Per Person by Category</div>
                <div class="chart-container" style="height:260px">
                    <canvas id="home-bar"></canvas>
                </div>
            </div>
        </div>` : '';

        // Budget progress bars
        let budgetBars = '';
        const budgetStatus = data.budget_status || [];
        if (budgetStatus.length > 0) {
            budgetBars = '<div class="card mb-20"><div class="section-title">Budgets</div>';
            budgetStatus.forEach(b => {
                const pct = b.monthly_limit > 0 ? Math.round((b.current_total / b.monthly_limit) * 100) : 0;
                const label = `${esc(b.user_name || '')} — ${esc(b.category || '')}`;
                budgetBars += `
                <div class="progress-container">
                    <div class="progress-header">
                        <span class="progress-label">${label}</span>
                        <span class="progress-value mono text-${budgetClass(pct)}">${fmt(b.current_total)} / ${fmt(b.monthly_limit)} (${pct}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${budgetClass(pct)}" style="width: ${Math.min(pct, 100)}%"></div>
                    </div>
                </div>`;
            });
            budgetBars += '</div>';
        }

        // Recent expenses table
        let recentHtml = '';
        if (recentExpenses.length > 0) {
            recentHtml = `
            <div class="section">
                <div class="section-title">Recent Expenses</div>
                <div class="card" style="padding:0;overflow:hidden">
                    <table class="tbl">
                        <thead><tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th class="text-right">Amount</th>
                            <th>Category</th>
                            <th>Person</th>
                        </tr></thead>
                        <tbody>
                            ${recentExpenses.map(e => `
                            <tr class="clickable" onclick="openEditExpense(${e.id})">
                                <td>${fmtDateShort(e.date)}</td>
                                <td>${esc(e.description || '-')}</td>
                                <td class="mono text-right">${fmt(e.amount)}</td>
                                <td>${esc(e.category_icon || '')} ${esc(e.category_name || '')}</td>
                                <td>${esc(getShortName(e.user_id))}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Monthly Summary</h1>
                    <p>${monthLabel}</p>
                </div>

                ${renderQuickAdd()}

                <div class="card-grid cols-3 mb-20">
                    ${statCards}
                    ${totalCard}
                </div>

                ${comparisonHtml}
                ${chartHtml}
                ${budgetBars}
                ${recentHtml}
            </div>`;

        // Render charts after DOM is ready
        if (categories.length > 0) {
            setTimeout(() => {
                // Donut chart
                renderDonutChart(
                    'home-donut',
                    categories.map(c => c.name),
                    categories.map(c => c.total),
                    categories.map((_, i) => getCatColor(i))
                );

                // Horizontal bar: per person per category
                const catNames = [...new Set(byUserCategory.map(x => x.category_name))];
                const userIds = [...new Set(byUserCategory.map(x => x.user_id))];
                const barDatasets = userIds.map((uid, idx) => {
                    const uname = getShortName(uid);
                    return {
                        label: uname,
                        data: catNames.map(cn => {
                            const entry = byUserCategory.find(x => x.user_id === uid && x.category_name === cn);
                            return entry ? entry.total : 0;
                        }),
                        backgroundColor: idx === 0 ? 'var(--blue)' : 'var(--accent)',
                    };
                });
                renderBarChart('home-bar', catNames, barDatasets);
            }, 50);
        }
    } catch (err) {
        showError('Could not load summary: ' + err.message);
    }
}


// ── View: Groceries ─────────────────────────────────────────────
let grocState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, personTab: 'all' };

async function groceries() {
    setLoading();
    try {
        const [weeklyData, budgetData] = await Promise.all([
            api.groceriesWeekly({ year: grocState.year, month: grocState.month }),
            api.groceriesBudget({ year: grocState.year, month: grocState.month }),
        ]);

        const weeks = weeklyData.weeks || [];
        const totalBudget = budgetData.monthly_limit ?? 400;
        const totalSpent = budgetData.current_total ?? 0;
        const monthLabel = `${monthNames[grocState.month - 1]} ${grocState.year}`;

        // Compute per-person totals from all week items
        const allItems = weeks.flatMap(w => w.items || []);
        const personTotals = {};
        appState.users.forEach(u => { personTotals[u.id] = 0; });
        allItems.forEach(i => { personTotals[i.user_id] = (personTotals[i.user_id] || 0) + (i.amount || 0); });

        // Filter items based on person tab
        const filterPerson = grocState.personTab !== 'all' ? parseInt(grocState.personTab) : null;

        // Budget bar for current tab
        let budgetAmount, budgetSpent;
        if (filterPerson) {
            budgetAmount = totalBudget / appState.users.length; // split evenly
            budgetSpent = personTotals[filterPerson] || 0;
        } else {
            budgetAmount = totalBudget;
            budgetSpent = totalSpent;
        }
        const pct = budgetAmount > 0 ? Math.round((budgetSpent / budgetAmount) * 100) : 0;

        // Tab bar
        const tabBar = `
        <div class="tab-bar">
            <button class="tab-btn ${grocState.personTab === 'all' ? 'active' : ''}" onclick="setGrocTab('all')">Household</button>
            ${appState.users.map(u => {
                const short = u.name === 'Isabela' ? 'Bela' : u.name;
                return `<button class="tab-btn ${grocState.personTab == u.id ? 'active' : ''}" onclick="setGrocTab('${u.id}')">${esc(short)}</button>`;
            }).join('')}
        </div>`;

        const weeksHtml = weeks.length > 0 ? weeks.map((week, idx) => {
            let items = week.items || [];
            if (filterPerson) items = items.filter(i => i.user_id === filterPerson);
            const weekTotal = items.reduce((s, i) => s + (i.amount || 0), 0);
            if (items.length === 0 && filterPerson) return '';
            const label = week.label || `Week ${week.week || idx + 1}`;

            let innerHtml = '';
            if (filterPerson) {
                // Show flat list for single person
                innerHtml = `<div class="expense-list">
                    ${items.map(item => renderExpenseRow(item, { showCategory: false, showDate: true, editable: true })).join('')}
                </div>`;
            } else {
                // Split by user
                const byUser = {};
                appState.users.forEach(u => { byUser[u.id] = []; });
                items.forEach(i => {
                    const uid = i.user_id || 1;
                    if (!byUser[uid]) byUser[uid] = [];
                    byUser[uid].push(i);
                });
                Object.entries(byUser).forEach(([uid, userItems]) => {
                    if (userItems.length === 0) return;
                    const uname = getShortName(parseInt(uid));
                    const subtotal = userItems.reduce((s, i) => s + (i.amount || 0), 0);
                    innerHtml += `
                    <div style="margin-top:8px">
                        <div class="flex items-center justify-between mb-8">
                            <span class="field-label">${esc(uname)}</span>
                            <span class="mono text-secondary" style="font-size:12px">${fmt(subtotal)}</span>
                        </div>
                        <div class="expense-list">
                            ${userItems.map(item => renderExpenseRow(item, { showCategory: false, showDate: true, editable: true })).join('')}
                        </div>
                    </div>`;
                });
            }

            return `
            <div class="accordion-item${idx === 0 ? ' open' : ''}">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                    <span class="accordion-title">${esc(label)}</span>
                    <div class="accordion-right">
                        <span class="accordion-total mono">${fmt(weekTotal)}</span>
                        <span class="accordion-chevron">${icons.chevronDown}</span>
                    </div>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        ${innerHtml || '<p class="text-muted text-center mt-8">No purchases this week</p>'}
                    </div>
                </div>
            </div>`;
        }).filter(Boolean).join('') : '<div class="empty-state mt-24">' + icons.empty + '<p>No grocery data</p></div>';

        // Weekly totals mini bar chart
        const weeklyBarHtml = weeks.length > 0 ? `
        <div class="card mb-20">
            <div class="section-title">Weekly Totals</div>
            <div class="chart-container" style="height:150px">
                <canvas id="groc-weekly-bar"></canvas>
            </div>
        </div>` : '';

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Groceries</h1>
                    <p>${monthLabel}</p>
                </div>

                ${renderQuickAdd({ category_id: 1 })}

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="grocPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="grocNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                ${tabBar}

                <div class="card mb-20">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">${filterPerson ? getShortName(filterPerson) + ' Budget' : 'Monthly Budget'}</span>
                            <span class="progress-value mono text-${budgetClass(pct)}">${fmt(budgetSpent)} / ${fmt(budgetAmount)} (${pct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${budgetClass(pct)}" style="width: ${Math.min(pct, 100)}%"></div>
                        </div>
                    </div>
                </div>

                ${weeklyBarHtml}

                <div class="accordion">${weeksHtml}</div>
            </div>`;

        // Render weekly bar chart
        if (weeks.length > 0) {
            setTimeout(() => {
                const weekLabels = weeks.map(w => w.label || `Week ${w.week}`);
                let weekData;
                if (filterPerson) {
                    weekData = weeks.map(w => (w.items || []).filter(i => i.user_id === filterPerson).reduce((s, i) => s + (i.amount || 0), 0));
                } else {
                    weekData = weeks.map(w => w.total || 0);
                }
                const canvas = document.getElementById('groc-weekly-bar');
                if (!canvas) return;
                const c = getChartColors();
                destroyChart('groc-weekly-bar');
                appState.charts['groc-weekly-bar'] = new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: weekLabels,
                        datasets: [{ data: weekData, backgroundColor: 'var(--accent)', borderRadius: 4, barThickness: 20 }],
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } } },
                        scales: {
                            x: { ticks: { color: c.muted }, grid: { display: false } },
                            y: { ticks: { color: c.muted, callback: v => fmt(v) }, grid: { color: c.border }, beginAtZero: true },
                        },
                    },
                });
            }, 50);
        }
    } catch (err) {
        showError('Could not load groceries: ' + err.message);
    }
}

function setGrocTab(val) {
    grocState.personTab = val;
    groceries();
}

function grocPrevMonth() {
    grocState.month--;
    if (grocState.month < 1) { grocState.month = 12; grocState.year--; }
    groceries();
}
function grocNextMonth() {
    grocState.month++;
    if (grocState.month > 12) { grocState.month = 1; grocState.year++; }
    groceries();
}


// ── View: Categorias ────────────────────────────────────────────
let catState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, personFilter: 'all' };

async function categorias() {
    setLoading();
    try {
        const dateFrom = `${catState.year}-${String(catState.month).padStart(2, '0')}-01`;
        const dateTo = catState.month === 12
            ? `${catState.year + 1}-01-01`
            : `${catState.year}-${String(catState.month + 1).padStart(2, '0')}-01`;

        const [summaryData, expData] = await Promise.all([
            api.monthlySummary(catState.year, catState.month),
            api.expenses({ date_from: dateFrom, date_to: dateTo, status: 'confirmed', per_page: 500 }),
        ]);

        const categories = summaryData.by_category || [];
        const allExpenses = expData.expenses || [];
        const monthLabel = `${monthNames[catState.month - 1]} ${catState.year}`;

        let filteredExpenses = allExpenses;
        if (catState.personFilter !== 'all') {
            filteredExpenses = allExpenses.filter(e => e.user_id === parseInt(catState.personFilter));
        }

        const catsHtml = categories.filter(c => c.total > 0).map((cat, i) => {
            const catExpenses = filteredExpenses.filter(e => e.category_id === cat.category_id);
            const catTotal = catExpenses.reduce((s, e) => s + (e.amount || 0), 0);

            const tableRows = catExpenses.map(e => {
                const uname = getShortName(e.user_id);
                return `<tr class="clickable" onclick="openEditExpense(${e.id})">
                    <td>${fmtDateShort(e.date)}</td>
                    <td>${esc(e.description || '-')}</td>
                    <td class="mono text-right">${fmt(e.amount)}</td>
                    <td>${esc(uname)}</td>
                </tr>`;
            }).join('');

            const innerHtml = catExpenses.length > 0 ? `
                <table class="tbl">
                    <thead><tr>
                        <th class="sortable" onclick="sortCatTable(this, 0)">Date</th>
                        <th class="sortable" onclick="sortCatTable(this, 1)">Description</th>
                        <th class="sortable text-right" onclick="sortCatTable(this, 2)">Amount</th>
                        <th class="sortable" onclick="sortCatTable(this, 3)">Person</th>
                    </tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>` : '';

            return `
            <div class="accordion-item" style="margin-bottom:6px">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                    <div class="cat-icon">
                        <span class="category-dot" style="background:${getCatColor(i)}"></span>
                        <span class="cat-name">${esc(cat.icon || '')} ${esc(cat.name)}</span>
                    </div>
                    <div class="accordion-right">
                        <span class="badge-muted badge" style="margin-right:8px">${catExpenses.length}</span>
                        <span class="accordion-total mono">${fmt(catTotal)}</span>
                        <span class="accordion-chevron">${icons.chevronDown}</span>
                    </div>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        ${innerHtml || '<p class="text-muted text-center mt-8">No expenses</p>'}
                    </div>
                </div>
            </div>`;
        }).join('');

        const personFilterHtml = `
            <div class="person-filter toggle-group">
                <button class="toggle-btn ${catState.personFilter === 'all' ? 'active' : ''}" onclick="setCatPersonFilter('all')">All</button>
                ${appState.users.map(u => {
                    const short = u.name === 'Isabela' ? 'Bela' : u.name;
                    return `<button class="toggle-btn ${catState.personFilter == u.id ? 'active' : ''}" onclick="setCatPersonFilter('${u.id}')">${esc(short)}</button>`;
                }).join('')}
            </div>`;

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header flex items-center justify-between">
                    <div>
                        <h1>Categories</h1>
                        <p>Expenses by category</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="openCategoryManager()">Manage Categories</button>
                </div>

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="catPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="catNextMonth()">${icons.chevronRight}</button>
                    </div>
                    ${personFilterHtml}
                </div>

                <div class="accordion">
                    ${catsHtml || '<div class="empty-state mt-24">' + icons.empty + '<p>No categories for this month</p></div>'}
                </div>
            </div>`;
    } catch (err) {
        showError('Could not load categories: ' + err.message);
    }
}

function setCatPersonFilter(val) {
    catState.personFilter = val;
    categorias();
}

function sortCatTable(th, colIdx) {
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAsc = th.classList.contains('asc');
    table.querySelectorAll('th').forEach(h => h.classList.remove('asc', 'desc'));
    th.classList.add(isAsc ? 'desc' : 'asc');
    rows.sort((a, b) => {
        let aVal = a.cells[colIdx].textContent.trim();
        let bVal = b.cells[colIdx].textContent.trim();
        if (colIdx === 2) {
            aVal = parseFloat(aVal.replace(/[^\d.-]/g, '')) || 0;
            bVal = parseFloat(bVal.replace(/[^\d.-]/g, '')) || 0;
        }
        if (aVal < bVal) return isAsc ? 1 : -1;
        if (aVal > bVal) return isAsc ? -1 : 1;
        return 0;
    });
    rows.forEach(r => tbody.appendChild(r));
}

function catPrevMonth() {
    catState.month--;
    if (catState.month < 1) { catState.month = 12; catState.year--; }
    categorias();
}
function catNextMonth() {
    catState.month++;
    if (catState.month > 12) { catState.month = 1; catState.year++; }
    categorias();
}

// ── Category Manager Modal ──────────────────────────────────────
function openCategoryManager() {
    const cats = appState.categories;
    const body = `
        <div id="cat-manager-list">
            ${cats.map(c => `
                <div class="flex items-center justify-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
                    <span>${esc(c.icon || '')} ${esc(c.name)}</span>
                    <div class="flex gap-8">
                        <button class="btn-icon btn-ghost" onclick="editCategoryPrompt(${c.id}, '${esc(c.name)}', '${esc(c.icon || '')}')">${icons.edit}</button>
                        <button class="btn-icon btn-ghost" onclick="deleteCategoryPrompt(${c.id}, '${esc(c.name)}')" style="color:var(--red)">${icons.trash}</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="flex gap-8 mt-16">
            <input type="text" class="field-input" id="new-cat-icon" placeholder="Icon" style="width:60px" value="📌">
            <input type="text" class="field-input" id="new-cat-name" placeholder="Name" style="flex:1">
            <button class="btn btn-primary btn-sm" onclick="createNewCategory()">Create</button>
        </div>`;
    openModal('Manage Categories', body, '');
}

async function createNewCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim();
    if (!name) { toast('Name required', 'error'); return; }
    try {
        await api.createCategory({ name, icon: icon || '📌' });
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Category created');
        closeModal();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

function editCategoryPrompt(id, name, icon) {
    closeModal();
    const body = `
        <div class="input-group">
            <label class="field-label">Icon</label>
            <input type="text" class="field-input" id="edit-cat-icon" value="${esc(icon)}" style="width:80px">
        </div>
        <div class="input-group">
            <label class="field-label">Name</label>
            <input type="text" class="field-input" id="edit-cat-name" value="${esc(name)}">
        </div>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal();openCategoryManager()">Cancel</button>
        <button class="btn btn-primary" onclick="saveCategory(${id})">Save</button>`;
    openModal('Edit Category', body, footer);
}

async function saveCategory(id) {
    const name = document.getElementById('edit-cat-name').value.trim();
    const icon = document.getElementById('edit-cat-icon').value.trim();
    if (!name) { toast('Name required', 'error'); return; }
    try {
        await api.updateCategory(id, { name, icon });
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Category updated');
        closeModal();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

async function deleteCategoryPrompt(id, name) {
    closeModal();
    openModal('Delete Category',
        `<p>Delete "${esc(name)}"? Only possible if it has no associated expenses.</p>`,
        `<button class="btn btn-ghost" onclick="closeModal();openCategoryManager()">Cancel</button>
         <button class="btn btn-danger" onclick="doDeleteCategory(${id})">Delete</button>`);
}

async function doDeleteCategory(id) {
    try {
        await api.deleteCategory(id);
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Category deleted');
        closeModal();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}


// ── View: Empresa ───────────────────────────────────────────────
let empState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

async function empresa() {
    setLoading();
    try {
        const data = await api.empresa({ year: empState.year, month: empState.month });
        const expenses = data.expenses || [];
        const total = data.total ?? expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const monthLabel = `${monthNames[empState.month - 1]} ${empState.year}`;

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Business</h1>
                    <p>Business expenses (Aaron)</p>
                </div>

                ${renderQuickAdd({ category_id: 10, user_id: 1 })}

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="empPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="empNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                <div class="stat-card mb-20">
                    <div class="stat-icon yellow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">Business Total</div>
                        <div class="stat-value mono">${fmt(total)}</div>
                        <div class="stat-sub">${monthLabel}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Expenses</div>
                    <div class="expense-list">
                        ${expenses.length > 0 ? expenses.map(e => renderExpenseRow(e, { showCategory: false, showDate: true, editable: true })).join('') : `
                            <div class="empty-state mt-24">
                                ${icons.empty}
                                <p>No business expenses this month</p>
                            </div>`}
                    </div>
                </div>
            </div>`;
    } catch (err) {
        showError('Could not load business: ' + err.message);
    }
}

function empPrevMonth() {
    empState.month--;
    if (empState.month < 1) { empState.month = 12; empState.year--; }
    empresa();
}
function empNextMonth() {
    empState.month++;
    if (empState.month > 12) { empState.month = 1; empState.year++; }
    empresa();
}


// ── View: Pendientes ────────────────────────────────────────────
async function pendientes() {
    setLoading();
    try {
        const data = await api.pendingExpenses();
        const items = data.expenses || [];

        const byUser = {};
        appState.users.forEach(u => { byUser[u.id] = []; });
        items.forEach(i => {
            const uid = i.user_id || 1;
            if (!byUser[uid]) byUser[uid] = [];
            byUser[uid].push(i);
        });

        let sectionsHtml = '';
        Object.entries(byUser).forEach(([uid, userItems]) => {
            if (userItems.length === 0) return;
            const uname = getShortName(parseInt(uid));
            sectionsHtml += `
            <div class="section">
                <div class="section-title">${esc(uname)} (${userItems.length})</div>
                <div class="flex flex-col gap-8">
                    ${userItems.map(item => `
                        <div class="pending-item" id="pending-${item.id}">
                            <div class="pending-info">
                                <div class="pending-desc">${esc(item.description || '-')}</div>
                                <div class="pending-detail">
                                    ${item.category_icon || ''} ${item.category_name ? esc(item.category_name) : 'No category'}
                                    ${item.date ? ' &middot; ' + fmtDateShort(item.date) : ''}
                                </div>
                            </div>
                            <span class="pending-amount mono">${fmt(item.amount)}</span>
                            <div class="pending-actions">
                                <button class="btn btn-ghost btn-sm" onclick="openEditExpense(${item.id})" title="Edit">${icons.edit}</button>
                                <button class="btn btn-confirm btn-sm" onclick="confirmItem(${item.id})" title="Confirm">
                                    ${icons.check} Confirm
                                </button>
                                <button class="btn btn-reject btn-sm" onclick="rejectItem(${item.id})" title="Reject">
                                    ${icons.x}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Pending</h1>
                    <p>${items.length} item${items.length !== 1 ? 's' : ''} to confirm</p>
                </div>

                ${sectionsHtml || `
                    <div class="empty-state mt-24">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <p>All confirmed</p>
                    </div>`}
            </div>`;
    } catch (err) {
        showError('Could not load pending: ' + err.message);
    }
}

async function confirmItem(id) {
    const el = document.getElementById(`pending-${id}`);
    if (el) el.style.opacity = '0.5';
    try {
        await api.confirmExpense(id);
        toast('Expense confirmed');
        pendientes();
        _pendingBadgeCache = { ts: 0, count: null };
        updatePendingBadge();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
        if (el) el.style.opacity = '1';
    }
}

async function rejectItem(id) {
    const el = document.getElementById(`pending-${id}`);
    if (el) el.style.opacity = '0.5';
    try {
        await api.deleteExpense(id);
        toast('Expense deleted');
        pendientes();
        _pendingBadgeCache = { ts: 0, count: null };
        updatePendingBadge();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
        if (el) el.style.opacity = '1';
    }
}


// ── View: Presupuestos (Budgets) ────────────────────────────────
async function presupuestos() {
    setLoading();
    try {
        const [budgetsData, overviewData] = await Promise.all([
            api.budgets(),
            api.overview(),
        ]);
        const budgets = budgetsData.budgets || [];
        const budgetStatus = overviewData.budget_status || [];

        // Build lookup: key = "catId-userId" or "catId-null"
        const statusMap = {};
        budgetStatus.forEach(b => {
            const key = `${b.category_id}-${b.user_id || 'null'}`;
            statusMap[key] = b;
        });

        const tableRows = budgets.map(b => {
            const key = `${b.category_id}-${b.user_id || 'null'}`;
            const status = statusMap[key] || {};
            const spent = status.current_total || 0;
            const remaining = status.remaining ?? (b.monthly_limit - spent);
            const pct = status.percentage || (b.monthly_limit > 0 ? Math.round(spent / b.monthly_limit * 100) : 0);
            const uname = b.user_name ? (b.user_name === 'Isabela' ? 'Bela' : b.user_name) : 'Shared';

            return `
            <tr>
                <td>${esc(b.category_icon || '')} ${esc(b.category_name || '')}</td>
                <td>${esc(uname)}</td>
                <td class="mono text-right">${fmt(b.monthly_limit)}</td>
                <td class="mono text-right">${fmt(spent)}</td>
                <td class="mono text-right" style="color:${remaining < 0 ? 'var(--red)' : 'var(--green)'}">${fmt(remaining)}</td>
                <td>
                    <div class="mini-progress">
                        <div class="mini-progress-fill" style="width:${Math.min(pct, 100)}%;background:${budgetColorVar(pct)}"></div>
                    </div>
                    <span class="mono" style="font-size:11px;margin-left:6px;color:${budgetColorVar(pct)}">${pct}%</span>
                </td>
                <td>
                    <button class="btn-icon btn-ghost" onclick="editBudget(${b.category_id}, '${esc(b.category_name || '')}', ${b.monthly_limit}, ${b.user_id || 'null'})">${icons.edit}</button>
                </td>
            </tr>`;
        }).join('');

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header flex items-center justify-between">
                    <div>
                        <h1>Budgets</h1>
                        <p>Monthly limits vs actual spending</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="openAddBudgetModal()">Add Budget</button>
                </div>

                <div class="card" style="padding:0;overflow:hidden">
                    ${budgets.length > 0 ? `
                    <table class="tbl">
                        <thead><tr>
                            <th>Category</th>
                            <th>Person</th>
                            <th class="text-right">Limit</th>
                            <th class="text-right">Spent</th>
                            <th class="text-right">Remaining</th>
                            <th>Status</th>
                            <th></th>
                        </tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>` : '<p class="text-muted text-center" style="padding:20px">No budgets configured</p>'}
                </div>
            </div>`;
    } catch (err) {
        showError('Could not load budgets: ' + err.message);
    }
}

function openAddBudgetModal() {
    const catOptions = appState.categories.map(c =>
        `<option value="${c.id}">${esc(c.icon || '')} ${esc(c.name)}</option>`
    ).join('');
    const userOptions = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        return `<option value="${u.id}">${esc(short)}</option>`;
    }).join('');

    const body = `
        <div class="input-group">
            <label class="field-label">Category</label>
            <select class="field-input" id="budget-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Person</label>
            <select class="field-input" id="budget-user">${userOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Monthly Limit</label>
            <input type="number" step="0.01" class="field-input mono" id="budget-limit" placeholder="0.00">
        </div>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveNewBudget()">Save</button>`;
    openModal('Add Budget', body, footer);
}

async function saveNewBudget() {
    const categoryId = parseInt(document.getElementById('budget-cat').value);
    const userId = parseInt(document.getElementById('budget-user').value);
    const limit = parseFloat(document.getElementById('budget-limit').value);
    if (!limit || limit <= 0) { toast('Invalid limit', 'error'); return; }
    try {
        await api.upsertBudget({ category_id: categoryId, monthly_limit: limit, user_id: userId });
        toast('Budget saved');
        closeModal();
        presupuestos();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

function editBudget(categoryId, categoryName, currentLimit, userId) {
    const userSelect = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        return `<option value="${u.id}" ${u.id === userId ? 'selected' : ''}>${esc(short)}</option>`;
    }).join('');

    const body = `
        <div class="input-group">
            <label class="field-label">Category</label>
            <input type="text" class="field-input" value="${esc(categoryName)}" disabled>
        </div>
        <div class="input-group">
            <label class="field-label">Person</label>
            <select class="field-input" id="budget-user">${userSelect}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Monthly Limit</label>
            <input type="number" step="0.01" class="field-input mono" id="budget-limit" value="${currentLimit || ''}" placeholder="0.00">
        </div>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveBudget(${categoryId})">Save</button>`;
    openModal('Edit Budget', body, footer);
    setTimeout(() => document.getElementById('budget-limit')?.focus(), 100);
}

async function saveBudget(categoryId) {
    const limit = parseFloat(document.getElementById('budget-limit').value);
    const userId = parseInt(document.getElementById('budget-user').value);
    if (!limit || limit <= 0) { toast('Invalid limit', 'error'); return; }
    try {
        await api.upsertBudget({ category_id: categoryId, monthly_limit: limit, user_id: userId });
        const budgetsData = await api.budgets();
        appState.budgets = budgetsData.budgets || [];
        toast('Budget updated');
        closeModal();
        presupuestos();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}


// ── View: Historial ─────────────────────────────────────────────
let histState = { category: '', person: '', search: '', page: 1, perPage: 30 };

async function historial() {
    setLoading();
    try {
        const params = { page: histState.page, per_page: histState.perPage, status: 'confirmed' };
        if (histState.category) params.category_id = histState.category;
        if (histState.person) params.user_id = histState.person;

        const [expData, catData] = await Promise.all([
            api.expenses(params),
            api.categories().catch(() => ({ categories: [] })),
        ]);

        let expenses = expData.expenses || [];
        const total = expData.total || 0;
        const perPage = expData.per_page || histState.perPage;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const cats = catData.categories || [];

        // Client-side search filter
        if (histState.search) {
            const q = histState.search.toLowerCase();
            expenses = expenses.filter(e => (e.description || '').toLowerCase().includes(q));
        }

        const tableRows = expenses.map(e => `
            <tr class="clickable" onclick="openEditExpense(${e.id})">
                <td>${fmtDateShort(e.date)}</td>
                <td>${esc(e.description || '-')}</td>
                <td>${esc(e.category_icon || '')} ${esc(e.category_name || '')}</td>
                <td class="mono text-right">${fmt(e.amount)}</td>
                <td>${esc(getShortName(e.user_id))}</td>
            </tr>`).join('');

        const personOptions = appState.users.map(u => {
            const short = u.name === 'Isabela' ? 'Bela' : u.name;
            return `<option value="${u.id}" ${histState.person == u.id ? 'selected' : ''}>${esc(short)}</option>`;
        }).join('');

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>History</h1>
                    <p>All confirmed expenses (${total} total)</p>
                </div>

                <div class="filters">
                    <select class="field-input" onchange="histFilter('category', this.value)" style="max-width:200px">
                        <option value="">All categories</option>
                        ${cats.map(c => `<option value="${c.id}" ${histState.category == c.id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`).join('')}
                    </select>
                    <select class="field-input" onchange="histFilter('person', this.value)" style="max-width:160px">
                        <option value="">All people</option>
                        ${personOptions}
                    </select>
                    <input type="text" class="field-input" placeholder="Search..." value="${esc(histState.search)}"
                        oninput="histState.search=this.value;historial()" style="max-width:200px">
                </div>

                <div class="card" style="padding:0;overflow:hidden">
                    ${expenses.length > 0 ? `
                    <table class="tbl">
                        <thead><tr>
                            <th class="sortable" onclick="sortHistTable(this, 0)">Date</th>
                            <th class="sortable" onclick="sortHistTable(this, 1)">Description</th>
                            <th class="sortable" onclick="sortHistTable(this, 2)">Category</th>
                            <th class="sortable text-right" onclick="sortHistTable(this, 3)">Amount</th>
                            <th class="sortable" onclick="sortHistTable(this, 4)">Person</th>
                        </tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>` : '<div class="empty-state" style="padding:40px">' + icons.empty + '<p>No expenses found</p></div>'}
                </div>

                ${totalPages > 1 ? `
                <div class="pagination">
                    <button class="page-btn" onclick="histPage(${histState.page - 1})" ${histState.page <= 1 ? 'disabled' : ''}>${icons.chevronLeft}</button>
                    ${buildPageButtons(histState.page, totalPages)}
                    <button class="page-btn" onclick="histPage(${histState.page + 1})" ${histState.page >= totalPages ? 'disabled' : ''}>${icons.chevronRight}</button>
                </div>` : ''}
            </div>`;
    } catch (err) {
        showError('Could not load history: ' + err.message);
    }
}

function sortHistTable(th, colIdx) {
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAsc = th.classList.contains('asc');
    table.querySelectorAll('th').forEach(h => h.classList.remove('asc', 'desc'));
    th.classList.add(isAsc ? 'desc' : 'asc');
    rows.sort((a, b) => {
        let aVal = a.cells[colIdx].textContent.trim();
        let bVal = b.cells[colIdx].textContent.trim();
        if (colIdx === 3) {
            aVal = parseFloat(aVal.replace(/[^\d.-]/g, '')) || 0;
            bVal = parseFloat(bVal.replace(/[^\d.-]/g, '')) || 0;
        }
        if (aVal < bVal) return isAsc ? 1 : -1;
        if (aVal > bVal) return isAsc ? -1 : 1;
        return 0;
    });
    rows.forEach(r => tbody.appendChild(r));
}

function histFilter(key, value) {
    histState[key] = value;
    histState.page = 1;
    historial();
}

function histPage(p) {
    if (p < 1) return;
    histState.page = p;
    historial();
}

function buildPageButtons(current, total) {
    const pages = [];
    const range = 2;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    return pages.map(p =>
        p === '...'
            ? '<span class="page-btn" style="border:none;background:none;cursor:default">...</span>'
            : `<button class="page-btn ${p === current ? 'active' : ''}" onclick="histPage(${p})">${p}</button>`
    ).join('');
}


// ── View: Analytics ─────────────────────────────────────────────
let analyticsState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

async function analytics() {
    setLoading();
    try {
        const y = analyticsState.year;
        const m = analyticsState.month;
        const monthLabel = `${monthNames[m - 1]} ${y}`;

        const [trendData, summaryData, compareData, topData] = await Promise.all([
            api.dailyTrend({ year: y, month: m }),
            api.monthlySummary(y, m),
            api.compare({ year: y, month: m }).catch(() => null),
            api.expenses({ date_from: `${y}-${String(m).padStart(2,'0')}-01`, date_to: m === 12 ? `${y+1}-01-01` : `${y}-${String(m+1).padStart(2,'0')}-01`, status: 'confirmed', per_page: 500 }).catch(() => ({ expenses: [] })),
        ]);

        const byCategory = (summaryData.by_category || []).filter(c => c.total > 0);
        const byUser = summaryData.by_user || [];
        const allExpenses = topData.expenses || [];
        const top5 = [...allExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

        // Month comparison
        let comparisonHtml = '';
        if (compareData) {
            const diff = compareData.diff;
            const pct = compareData.diff_pct;
            const isUp = diff > 0;
            const color = isUp ? 'var(--red)' : 'var(--green)';
            const arrow = isUp ? '↑' : '↓';
            comparisonHtml = `
            <div class="comparison-card">
                <div>
                    <div class="comp-label">vs ${monthNames[(compareData.previous.month || 1) - 1]}: ${fmt(compareData.previous.total)}</div>
                    <div class="comp-value" style="color:${color}">${arrow} ${fmt(Math.abs(diff))} (${Math.abs(pct)}%)</div>
                </div>
            </div>`;
        }

        // Per-person summary cards
        const personCards = byUser.map(u => {
            const short = u.name === 'Isabela' ? 'Bela' : u.name;
            const userExpenses = allExpenses.filter(e => e.user_id === u.user_id);
            const topCat = userExpenses.reduce((acc, e) => {
                acc[e.category_name] = (acc[e.category_name] || 0) + e.amount;
                return acc;
            }, {});
            const topCatName = Object.entries(topCat).sort((a, b) => b[1] - a[1])[0];
            const daysInMonth = new Date(y, m, 0).getDate();
            const avgDaily = u.total / daysInMonth;

            return `
            <div class="analytics-card">
                <div class="a-label">${esc(short)}</div>
                <div class="a-value">${fmt(u.total)}</div>
                <div class="a-sub">Top: ${topCatName ? esc(topCatName[0]) : '-'}</div>
                <div class="a-sub">Avg/day: ${fmt(avgDaily)}</div>
            </div>`;
        }).join('');

        // Top 5 table
        const top5Html = top5.length > 0 ? `
        <div class="section">
            <div class="section-title">Top 5 Expenses</div>
            <div class="card" style="padding:0;overflow:hidden">
                <table class="tbl">
                    <thead><tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th class="text-right">Amount</th>
                        <th>Person</th>
                    </tr></thead>
                    <tbody>
                        ${top5.map(e => `
                        <tr class="clickable" onclick="openEditExpense(${e.id})">
                            <td>${fmtDateShort(e.date)}</td>
                            <td>${esc(e.description || '-')}</td>
                            <td>${esc(e.category_icon || '')} ${esc(e.category_name || '')}</td>
                            <td class="mono text-right">${fmt(e.amount)}</td>
                            <td>${esc(getShortName(e.user_id))}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>` : '';

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Analytics</h1>
                    <p>Spending trends and insights</p>
                </div>

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="analyticsPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="analyticsNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                ${comparisonHtml}

                <div class="analytics-grid">
                    ${personCards}
                </div>

                <div class="chart-row">
                    <div class="card">
                        <div class="section-title">Daily Spending Trend</div>
                        <div class="chart-container" style="height:260px">
                            <canvas id="analytics-line"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <div class="section-title">Category Breakdown</div>
                        <div class="chart-container" style="height:260px">
                            <canvas id="analytics-donut"></canvas>
                        </div>
                    </div>
                </div>

                ${top5Html}
            </div>`;

        // Render charts
        setTimeout(() => {
            // Daily trend line chart
            if (trendData && trendData.length > 0) {
                const days = trendData.map(d => d.date.slice(8)); // just day number
                const userIds = [...new Set(trendData.flatMap(d => (d.by_user || []).map(u => u.user_id)))];
                const lineDatasets = [];

                // Total line
                lineDatasets.push({
                    label: 'Total',
                    data: trendData.map(d => d.total),
                    borderColor: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                });

                // Per-person lines
                const personColors = ['var(--blue)', 'var(--accent)', 'var(--green)', 'var(--orange)'];
                userIds.forEach((uid, idx) => {
                    lineDatasets.push({
                        label: getShortName(uid),
                        data: trendData.map(d => {
                            const entry = (d.by_user || []).find(u => u.user_id === uid);
                            return entry ? entry.total : 0;
                        }),
                        borderColor: personColors[idx % personColors.length],
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderDash: [4, 2],
                        tension: 0.3,
                        pointRadius: 1,
                    });
                });

                renderLineChart('analytics-line', days, lineDatasets);
            }

            // Category donut
            if (byCategory.length > 0) {
                renderDonutChart(
                    'analytics-donut',
                    byCategory.map(c => c.name),
                    byCategory.map(c => c.total),
                    byCategory.map((_, i) => getCatColor(i))
                );
            }
        }, 50);
    } catch (err) {
        showError('Could not load analytics: ' + err.message);
    }
}

function analyticsPrevMonth() {
    analyticsState.month--;
    if (analyticsState.month < 1) { analyticsState.month = 12; analyticsState.year--; }
    analytics();
}
function analyticsNextMonth() {
    analyticsState.month++;
    if (analyticsState.month > 12) { analyticsState.month = 1; analyticsState.year++; }
    analytics();
}
