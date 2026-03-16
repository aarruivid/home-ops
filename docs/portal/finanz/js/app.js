/**
 * FinanzOps SPA — 7-view hash router with CRUD + per-person sections
 */

// ── Global State ────────────────────────────────────────────────
const appState = { users: [], categories: [], budgets: [] };

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
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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

function setLoading() {
    document.getElementById('app').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando...</p>
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

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ── Router ──────────────────────────────────────────────────────
const routes = { home, groceries, categorias, empresa, pendientes, presupuestos, historial };

function navigateTo(view) {
    location.hash = view;
}

function navigate() {
    const hash = location.hash.slice(1) || 'home';
    const viewFn = routes[hash];

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === hash);
    });

    if (viewFn) viewFn();
    else home();

    updatePendingBadge();
}

async function updatePendingBadge() {
    try {
        const data = await api.pendingExpenses();
        const items = data.expenses || [];
        const count = items.length;
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
                </div>` : '<p class="text-muted text-center mt-8" style="padding:12px">Sin gastos</p>'}
            </div>
        </div>`;
    });

    if (sections.filter(s => s.items.length > 0).length > 1) {
        html += `
        <div class="combined-total">
            <span class="label">Total Combinado</span>
            <span class="amount">${fmt(grandTotal)}</span>
        </div>`;
    }

    return html || '<div class="empty-state mt-24">' + icons.empty + '<p>Sin gastos</p></div>';
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
            <button class="btn-icon btn-ghost" onclick="event.stopPropagation();deleteExpenseConfirm(${e.id})" title="Eliminar">${icons.trash}</button>
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
            <label class="field-label">Monto</label>
            <input type="number" step="0.01" min="0.01" class="field-input mono" id="qa-amount" required placeholder="0.00">
        </div>
        <div class="input-group desc">
            <label class="field-label">Descripcion</label>
            <input type="text" class="field-input" id="qa-desc" placeholder="Descripcion" required>
        </div>
        <div class="input-group">
            <label class="field-label">Categoria</label>
            <select class="field-input" id="qa-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Persona</label>
            <div class="toggle-group" id="qa-user-toggle">${userToggles}</div>
            <input type="hidden" id="qa-user" value="${defaults.user_id || 1}">
        </div>
        <div class="input-group">
            <label class="field-label">Fecha</label>
            <input type="date" class="field-input" id="qa-date" value="${defaults.date || todayISO()}">
        </div>
        <button type="submit" class="btn btn-primary">${icons.plus} Agregar</button>
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

    if (!amount || amount <= 0) { toast('Monto invalido', 'error'); return; }
    if (!description) { toast('Descripcion requerida', 'error'); return; }

    try {
        await api.createExpense({ amount, description, category_id, user_id, date, status: 'confirmed' });
        toast('Gasto agregado');
        navigate(); // refresh current view
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ── Edit Expense Modal ──────────────────────────────────────────
async function openEditExpense(expenseId) {
    // Fetch the specific expense
    const data = await api.expenses({ page: 1, per_page: 1 });
    // We need to find this expense — use the full list approach
    let expense = null;
    try {
        const all = await api.expenses({ per_page: 500 });
        expense = (all.expenses || []).find(e => e.id === expenseId);
    } catch { /* fallback */ }
    if (!expense) { toast('Gasto no encontrado', 'error'); return; }

    const catOptions = appState.categories.map(c =>
        `<option value="${c.id}" ${c.id == expense.category_id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`
    ).join('');

    const userToggles = appState.users.map(u => {
        const short = u.name === 'Isabela' ? 'Bela' : u.name;
        return `<button type="button" class="toggle-btn ${u.id == expense.user_id ? 'active' : ''}" onclick="selectEditUser(${u.id})">${esc(short)}</button>`;
    }).join('');

    const body = `
        <div class="input-group">
            <label class="field-label">Monto</label>
            <input type="number" step="0.01" class="field-input mono" id="edit-amount" value="${expense.amount}">
        </div>
        <div class="input-group">
            <label class="field-label">Descripcion</label>
            <input type="text" class="field-input" id="edit-desc" value="${esc(expense.description || '')}">
        </div>
        <div class="input-group">
            <label class="field-label">Categoria</label>
            <select class="field-input" id="edit-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Persona</label>
            <div class="toggle-group" id="edit-user-toggle">${userToggles}</div>
            <input type="hidden" id="edit-user" value="${expense.user_id}">
        </div>
        <div class="input-group">
            <label class="field-label">Fecha</label>
            <input type="date" class="field-input" id="edit-date" value="${expense.date}">
        </div>
        <div class="input-group">
            <label class="field-label">Estado</label>
            <select class="field-input" id="edit-status">
                <option value="confirmed" ${expense.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                <option value="pending" ${expense.status === 'pending' ? 'selected' : ''}>Pendiente</option>
            </select>
        </div>`;

    const footer = `
        <button class="btn btn-danger" onclick="deleteExpenseConfirm(${expense.id})">Eliminar</button>
        <div style="flex:1"></div>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="saveEditExpense(${expense.id})">Guardar</button>`;

    openModal('Editar Gasto', body, footer);
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
        toast('Gasto actualizado');
        closeModal();
        navigate();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function deleteExpenseConfirm(id) {
    closeModal();
    openModal('Eliminar Gasto', '<p>Seguro que quieres eliminar este gasto?</p>',
        `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
         <button class="btn btn-danger" onclick="doDeleteExpense(${id})">Eliminar</button>`);
}

async function doDeleteExpense(id) {
    try {
        await api.deleteExpense(id);
        toast('Gasto eliminado');
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
            <label class="field-label">Monto</label>
            <input type="number" step="0.01" min="0.01" class="field-input mono" id="modal-amount" required placeholder="0.00">
        </div>
        <div class="input-group">
            <label class="field-label">Descripcion</label>
            <input type="text" class="field-input" id="modal-desc" required placeholder="Descripcion">
        </div>
        <div class="input-group">
            <label class="field-label">Categoria</label>
            <select class="field-input" id="modal-cat">${catOptions}</select>
        </div>
        <div class="input-group">
            <label class="field-label">Persona</label>
            <div class="toggle-group" id="modal-user-toggle">${userToggles}</div>
            <input type="hidden" id="modal-user" value="1">
        </div>
        <div class="input-group">
            <label class="field-label">Fecha</label>
            <input type="date" class="field-input" id="modal-date" value="${todayISO()}">
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitModalAdd()">Agregar</button>`;

    openModal('Nuevo Gasto', body, footer);
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

    if (!amount || amount <= 0) { toast('Monto invalido', 'error'); return; }
    if (!description) { toast('Descripcion requerida', 'error'); return; }

    try {
        await api.createExpense({ amount, description, category_id, user_id, date, status: 'confirmed' });
        toast('Gasto agregado');
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
        const [data, budgetsData] = await Promise.all([
            api.overview(),
            api.budgets(),
        ]);
        const byUser = data.by_user || [];
        const categories = (data.by_category || []).filter(c => c.total > 0);
        const budgets = budgetsData.budgets || [];

        const now = new Date();
        const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // Stat cards from users
        const statCards = byUser.map(u => {
            const short = u.name === 'Isabela' ? 'Bela' : u.name;
            const color = u.user_id === 1 ? 'blue' : 'accent';
            const iconSvg = u.user_id === 1
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
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
                <div class="stat-label">Total Mes</div>
                <div class="stat-value mono">${fmt(data.grand_total)}</div>
                <div class="stat-sub">${monthLabel}</div>
            </div>
        </div>`;

        // Budget progress bars
        let budgetBars = '';
        if (budgets.length > 0) {
            budgetBars = '<div class="card mb-20"><div class="section-title">Presupuestos</div>';
            budgets.forEach(b => {
                const catExpense = categories.find(c => c.category_id === b.category_id);
                const spent = catExpense ? catExpense.total : 0;
                const pct = b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0;
                budgetBars += `
                <div class="progress-container">
                    <div class="progress-header">
                        <span class="progress-label">${esc(b.category_icon || '')} ${esc(b.category_name)}</span>
                        <span class="progress-value mono text-${budgetClass(pct)}">${fmt(spent)} / ${fmt(b.monthly_limit)} (${pct}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${budgetClass(pct)}" style="width: ${Math.min(pct, 100)}%"></div>
                    </div>
                </div>`;
            });
            budgetBars += '</div>';
        }

        // Category breakdown
        let catBreakdown = '';
        if (categories.length > 0) {
            catBreakdown = `
            <div class="section">
                <div class="section-title">Desglose por Categoria</div>
                <div class="category-list">
                    ${categories.map((cat, i) => `
                        <div class="category-row" onclick="location.hash='categorias'">
                            <div class="cat-icon">
                                <span class="category-dot" style="background:${getCatColor(i)}"></span>
                                <span class="cat-name">${esc(cat.icon || '')} ${esc(cat.name)}</span>
                            </div>
                            <span class="cat-amount mono">${fmt(cat.total)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Resumen del Mes</h1>
                    <p>${monthLabel}</p>
                </div>

                ${renderQuickAdd()}

                <div class="card-grid cols-3 mb-20">
                    ${statCards}
                    ${totalCard}
                </div>

                ${budgetBars}
                ${catBreakdown}
            </div>`;
    } catch (err) {
        showError('No se pudo cargar el resumen: ' + err.message);
    }
}


// ── View: Groceries ─────────────────────────────────────────────
async function groceries() {
    setLoading();
    try {
        const [weeklyData, budgetData] = await Promise.all([
            api.groceriesWeekly(),
            api.groceriesBudget(),
        ]);

        const weeks = weeklyData.weeks || [];
        const budget = budgetData.monthly_limit ?? 400;
        const spent = budgetData.current_total ?? 0;
        const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

        const weeksHtml = weeks.length > 0 ? weeks.map((week, idx) => {
            const items = week.items || [];
            const weekTotal = week.total ?? items.reduce((s, i) => s + (i.amount || 0), 0);
            const label = week.label || `Semana ${week.week || idx + 1}`;

            // Split items by user
            const byUser = {};
            appState.users.forEach(u => { byUser[u.id] = []; });
            items.forEach(i => {
                const uid = i.user_id || 1;
                if (!byUser[uid]) byUser[uid] = [];
                byUser[uid].push(i);
            });

            let innerHtml = '';
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
                        ${innerHtml || '<p class="text-muted text-center mt-8">Sin compras esta semana</p>'}
                    </div>
                </div>
            </div>`;
        }).join('') : '<div class="empty-state mt-24">' + icons.empty + '<p>No hay datos de supermercado</p></div>';

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Supermercado</h1>
                    <p>Desglose semanal</p>
                </div>

                ${renderQuickAdd({ category_id: 1 })}

                <div class="card mb-20">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">Presupuesto Mensual</span>
                            <span class="progress-value mono text-${budgetClass(pct)}">${fmt(spent)} / ${fmt(budget)} (${pct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${budgetClass(pct)}" style="width: ${Math.min(pct, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="accordion">${weeksHtml}</div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar supermercado: ' + err.message);
    }
}


// ── View: Categorias ────────────────────────────────────────────
let catState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

async function categorias() {
    setLoading();
    try {
        // Fetch expenses for this month grouped by category + user
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

        const catsHtml = categories.filter(c => c.total > 0).map((cat, i) => {
            const catExpenses = allExpenses.filter(e => e.category_id === cat.category_id);

            // Split by user inside category
            const byUser = {};
            appState.users.forEach(u => { byUser[u.id] = []; });
            catExpenses.forEach(e => {
                const uid = e.user_id || 1;
                if (!byUser[uid]) byUser[uid] = [];
                byUser[uid].push(e);
            });

            let innerHtml = '';
            Object.entries(byUser).forEach(([uid, items]) => {
                if (items.length === 0) return;
                const uname = getShortName(parseInt(uid));
                const subtotal = items.reduce((s, e) => s + (e.amount || 0), 0);
                innerHtml += `
                <div style="margin-top:8px">
                    <div class="flex items-center justify-between mb-8">
                        <span class="field-label">${esc(uname)}</span>
                        <span class="mono text-secondary" style="font-size:12px">${fmt(subtotal)}</span>
                    </div>
                    <div class="expense-list">
                        ${items.map(e => renderExpenseRow(e, { showCategory: false, showDate: true, editable: true })).join('')}
                    </div>
                </div>`;
            });

            return `
            <div class="accordion-item" style="margin-bottom:6px">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                    <div class="cat-icon">
                        <span class="category-dot" style="background:${getCatColor(i)}"></span>
                        <span class="cat-name">${esc(cat.icon || '')} ${esc(cat.name)}</span>
                    </div>
                    <div class="accordion-right">
                        <span class="badge-muted badge" style="margin-right:8px">${cat.count || catExpenses.length}</span>
                        <span class="accordion-total mono">${fmt(cat.total)}</span>
                        <span class="accordion-chevron">${icons.chevronDown}</span>
                    </div>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        ${innerHtml || '<p class="text-muted text-center mt-8">Sin gastos</p>'}
                    </div>
                </div>
            </div>`;
        }).join('');

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header flex items-center justify-between">
                    <div>
                        <h1>Categorias</h1>
                        <p>Gastos por categoria</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="openCategoryManager()">Gestionar Categorias</button>
                </div>

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="catPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="catNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                <div class="accordion">
                    ${catsHtml || '<div class="empty-state mt-24">' + icons.empty + '<p>Sin categorias para este mes</p></div>'}
                </div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar categorias: ' + err.message);
    }
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
            <input type="text" class="field-input" id="new-cat-name" placeholder="Nombre" style="flex:1">
            <button class="btn btn-primary btn-sm" onclick="createNewCategory()">Crear</button>
        </div>`;
    openModal('Gestionar Categorias', body, '');
}

async function createNewCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim();
    if (!name) { toast('Nombre requerido', 'error'); return; }
    try {
        await api.createCategory({ name, icon: icon || '📌' });
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Categoria creada');
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
            <label class="field-label">Nombre</label>
            <input type="text" class="field-input" id="edit-cat-name" value="${esc(name)}">
        </div>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal();openCategoryManager()">Cancelar</button>
        <button class="btn btn-primary" onclick="saveCategory(${id})">Guardar</button>`;
    openModal('Editar Categoria', body, footer);
}

async function saveCategory(id) {
    const name = document.getElementById('edit-cat-name').value.trim();
    const icon = document.getElementById('edit-cat-icon').value.trim();
    if (!name) { toast('Nombre requerido', 'error'); return; }
    try {
        await api.updateCategory(id, { name, icon });
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Categoria actualizada');
        closeModal();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

async function deleteCategoryPrompt(id, name) {
    closeModal();
    openModal('Eliminar Categoria',
        `<p>Eliminar "${esc(name)}"? Solo se puede eliminar si no tiene gastos asociados.</p>`,
        `<button class="btn btn-ghost" onclick="closeModal();openCategoryManager()">Cancelar</button>
         <button class="btn btn-danger" onclick="doDeleteCategory(${id})">Eliminar</button>`);
}

async function doDeleteCategory(id) {
    try {
        await api.deleteCategory(id);
        const catsData = await api.categories();
        appState.categories = catsData.categories || [];
        toast('Categoria eliminada');
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
                    <h1>Empresa</h1>
                    <p>Gastos de negocio (Aaron)</p>
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
                        <div class="stat-label">Total Empresa</div>
                        <div class="stat-value mono">${fmt(total)}</div>
                        <div class="stat-sub">${monthLabel}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Gastos</div>
                    <div class="expense-list">
                        ${expenses.length > 0 ? expenses.map(e => renderExpenseRow(e, { showCategory: false, showDate: true, editable: true })).join('') : `
                            <div class="empty-state mt-24">
                                ${icons.empty}
                                <p>Sin gastos de empresa este mes</p>
                            </div>`}
                    </div>
                </div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar empresa: ' + err.message);
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

        // Split by user
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
                                    ${item.category_icon || ''} ${item.category_name ? esc(item.category_name) : 'Sin categoria'}
                                    ${item.date ? ' &middot; ' + fmtDateShort(item.date) : ''}
                                </div>
                            </div>
                            <span class="pending-amount mono">${fmt(item.amount)}</span>
                            <div class="pending-actions">
                                <button class="btn btn-ghost btn-sm" onclick="openEditExpense(${item.id})" title="Editar">${icons.edit}</button>
                                <button class="btn btn-confirm btn-sm" onclick="confirmItem(${item.id})" title="Confirmar">
                                    ${icons.check} Confirmar
                                </button>
                                <button class="btn btn-reject btn-sm" onclick="rejectItem(${item.id})" title="Rechazar">
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
                    <h1>Pendientes</h1>
                    <p>${items.length} elemento${items.length !== 1 ? 's' : ''} por confirmar</p>
                </div>

                ${sectionsHtml || `
                    <div class="empty-state mt-24">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <p>Todo confirmado</p>
                    </div>`}
            </div>`;
    } catch (err) {
        showError('No se pudo cargar pendientes: ' + err.message);
    }
}

async function confirmItem(id) {
    const el = document.getElementById(`pending-${id}`);
    if (el) el.style.opacity = '0.5';
    try {
        await api.confirmExpense(id);
        toast('Gasto confirmado');
        pendientes();
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
        toast('Gasto eliminado');
        pendientes();
        updatePendingBadge();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
        if (el) el.style.opacity = '1';
    }
}


// ── View: Presupuestos ──────────────────────────────────────────
async function presupuestos() {
    setLoading();
    try {
        const [budgetsData, catsData] = await Promise.all([
            api.budgets(),
            api.categories(),
        ]);
        const budgets = budgetsData.budgets || [];
        const cats = catsData.categories || [];

        const budgetMap = {};
        budgets.forEach(b => { budgetMap[b.category_id] = b; });

        const rows = cats.map(c => {
            const b = budgetMap[c.id];
            return `
            <div class="flex items-center justify-between" style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div class="flex items-center gap-8">
                    <span>${esc(c.icon || '')}</span>
                    <span style="font-weight:500">${esc(c.name)}</span>
                </div>
                <div class="flex items-center gap-12">
                    <span class="mono ${b ? 'text-accent' : 'text-muted'}" style="font-size:13px">
                        ${b ? fmt(b.monthly_limit) : 'Sin presupuesto'}
                    </span>
                    <button class="btn btn-ghost btn-sm" onclick="editBudget(${c.id}, '${esc(c.name)}', ${b ? b.monthly_limit : 0})">
                        ${b ? icons.edit : icons.plus}
                    </button>
                </div>
            </div>`;
        }).join('');

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Presupuestos</h1>
                    <p>Limites mensuales por categoria</p>
                </div>

                <div class="card">
                    ${rows || '<p class="text-muted text-center" style="padding:20px">Sin categorias</p>'}
                </div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar presupuestos: ' + err.message);
    }
}

function editBudget(categoryId, categoryName, currentLimit) {
    const body = `
        <div class="input-group">
            <label class="field-label">Categoria</label>
            <input type="text" class="field-input" value="${esc(categoryName)}" disabled>
        </div>
        <div class="input-group">
            <label class="field-label">Limite Mensual</label>
            <input type="number" step="0.01" class="field-input mono" id="budget-limit" value="${currentLimit || ''}" placeholder="0.00">
        </div>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="saveBudget(${categoryId})">Guardar</button>`;
    openModal('Editar Presupuesto', body, footer);
    setTimeout(() => document.getElementById('budget-limit')?.focus(), 100);
}

async function saveBudget(categoryId) {
    const limit = parseFloat(document.getElementById('budget-limit').value);
    if (!limit || limit <= 0) { toast('Limite invalido', 'error'); return; }
    try {
        await api.upsertBudget({ category_id: categoryId, monthly_limit: limit });
        const budgetsData = await api.budgets();
        appState.budgets = budgetsData.budgets || [];
        toast('Presupuesto actualizado');
        closeModal();
        presupuestos();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}


// ── View: Historial ─────────────────────────────────────────────
let histState = { category: '', search: '', page: 1, perPage: 30 };

async function historial() {
    setLoading();
    try {
        const params = { page: histState.page, per_page: histState.perPage, status: 'confirmed' };
        if (histState.category) params.category_id = histState.category;

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

        // Per-person sections
        const personHtml = renderPersonSections(expenses, { showCategory: true, showDate: true, editable: true });

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Historial</h1>
                    <p>Todos los gastos confirmados</p>
                </div>

                <div class="filters">
                    <select class="field-input" onchange="histFilter('category', this.value)" style="max-width:200px">
                        <option value="">Todas las categorias</option>
                        ${cats.map(c => `<option value="${c.id}" ${histState.category == c.id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`).join('')}
                    </select>
                    <input type="text" class="field-input" placeholder="Buscar..." value="${esc(histState.search)}"
                        oninput="histState.search=this.value;historial()" style="max-width:200px">
                </div>

                ${personHtml}

                ${totalPages > 1 ? `
                <div class="pagination">
                    <button class="page-btn" onclick="histPage(${histState.page - 1})" ${histState.page <= 1 ? 'disabled' : ''}>${icons.chevronLeft}</button>
                    ${buildPageButtons(histState.page, totalPages)}
                    <button class="page-btn" onclick="histPage(${histState.page + 1})" ${histState.page >= totalPages ? 'disabled' : ''}>${icons.chevronRight}</button>
                </div>` : ''}
            </div>`;
    } catch (err) {
        showError('No se pudo cargar historial: ' + err.message);
    }
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
