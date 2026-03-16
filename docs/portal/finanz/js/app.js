/**
 * FinanzOps SPA — 6-view hash router
 */

// ── Helpers ──────────────────────────────────────────────────────────
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
    '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#06B6D4',
    '#D946EF', '#84CC16', '#FB923C', '#A78BFA'
];

function getCatColor(index) {
    return categoryColors[index % categoryColors.length];
}

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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>${msg}</p>
        </div>`;
}

// SVG icons (inline Lucide-style)
const icons = {
    chevronDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
};

// Toast notifications
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


// ── Router ───────────────────────────────────────────────────────────
const routes = { home, groceries, categorias, empresa, pendientes, historial };

function navigate() {
    const hash = location.hash.slice(1) || 'home';
    const viewFn = routes[hash];

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        const v = link.dataset.view;
        link.classList.toggle('active', v === hash);
    });

    if (viewFn) {
        viewFn();
    } else {
        home();
    }

    // Update pending badge whenever we navigate
    updatePendingBadge();
}

async function updatePendingBadge() {
    try {
        const data = await api.pendingExpenses();
        const items = data.pending || data.expenses || data || [];
        const count = Array.isArray(items) ? items.length : 0;
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }
    } catch {
        // Silently ignore
    }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);


// ── View: Home ───────────────────────────────────────────────────────
async function home() {
    setLoading();
    try {
        const data = await api.overview();
        const byUser = data.by_user || [];
        const myTotal = (byUser.find(u => u.user_id === 1) || {}).total || 0;
        const partnerTotal = (byUser.find(u => u.user_id === 2) || {}).total || 0;
        const monthTotal = data.grand_total ?? (myTotal + partnerTotal);
        const budget = data.budget_status || {};
        const grocerySpent = budget.current_total ?? 0;
        const groceryBudget = budget.monthly_limit ?? 400;
        const groceryPct = groceryBudget > 0 ? Math.round((grocerySpent / groceryBudget) * 100) : 0;
        const categories = (data.by_category || []).filter(c => c.total > 0);

        const now = new Date();
        const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Resumen del Mes</h1>
                    <p>${monthLabel}</p>
                </div>

                <div class="card-grid cols-3 mb-20">
                    <div class="card summary-card">
                        <div class="card-label">Mis Gastos</div>
                        <div class="card-value mono">${fmt(myTotal)}</div>
                    </div>
                    <div class="card summary-card">
                        <div class="card-label">Gastos Novia</div>
                        <div class="card-value mono">${fmt(partnerTotal)}</div>
                    </div>
                    <div class="card summary-card">
                        <div class="card-label">Total Mes</div>
                        <div class="card-value mono accent">${fmt(monthTotal)}</div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">Presupuesto Supermercado</span>
                            <span class="progress-value mono ${budgetClass(groceryPct) === 'red' ? 'text-danger' : budgetClass(groceryPct) === 'yellow' ? 'text-warning' : 'text-accent'}">${fmt(grocerySpent)} / ${fmt(groceryBudget)} (${groceryPct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${budgetClass(groceryPct)}" style="width: ${Math.min(groceryPct, 100)}%"></div>
                        </div>
                    </div>
                </div>

                ${categories.length > 0 ? `
                <div class="section">
                    <div class="section-title">Desglose por Categoria</div>
                    <div class="category-list">
                        ${categories.map((cat, i) => `
                            <div class="category-row" onclick="location.hash='categorias'">
                                <div class="cat-icon">
                                    <span class="category-dot" style="background:${getCatColor(i)}"></span>
                                    <span class="cat-name">${esc(cat.name || cat.category)}</span>
                                </div>
                                <span class="cat-amount mono">${fmt(cat.total || cat.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
            </div>`;
    } catch (err) {
        showError('No se pudo cargar el resumen: ' + err.message);
    }
}


// ── View: Groceries ──────────────────────────────────────────────────
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

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Supermercado</h1>
                    <p>Desglose semanal</p>
                </div>

                <div class="card mb-20">
                    <div class="progress-container">
                        <div class="progress-header">
                            <span class="progress-label">Presupuesto Mensual</span>
                            <span class="progress-value mono ${budgetClass(pct) === 'red' ? 'text-danger' : budgetClass(pct) === 'yellow' ? 'text-warning' : 'text-accent'}">${fmt(spent)} / ${fmt(budget)} (${pct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${budgetClass(pct)}" style="width: ${Math.min(pct, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="accordion">
                    ${weeks.length > 0 ? weeks.map((week, idx) => {
                        const items = week.items || week.expenses || [];
                        const weekTotal = week.total ?? items.reduce((s, i) => s + (i.amount || 0), 0);
                        const label = week.label || `Semana ${idx + 1}`;
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
                                    <div class="expense-list mt-8">
                                        ${items.map(item => `
                                            <div class="expense-item">
                                                <div class="expense-info">
                                                    <span class="expense-desc">${esc(item.description || item.name || '-')}</span>
                                                    <div class="expense-meta">
                                                        <span>${fmtDateShort(item.date || item.created_at)}</span>
                                                        ${item.user_name ? `<span class="tag">${esc(item.user_name)}</span>` : ''}
                                                    </div>
                                                </div>
                                                <span class="expense-amount mono">${fmt(item.amount)}</span>
                                            </div>
                                        `).join('')}
                                        ${items.length === 0 ? '<p class="text-muted text-center mt-8">Sin compras esta semana</p>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    }).join('') : '<div class="empty-state">' + icons.empty + '<p>No hay datos de supermercado</p></div>'}
                </div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar supermercado: ' + err.message);
    }
}


// ── View: Categorias ─────────────────────────────────────────────────
let catState = { person: 'todos', year: new Date().getFullYear(), month: new Date().getMonth() + 1, expandedCat: null };

async function categorias() {
    setLoading();
    try {
        const data = await api.monthlySummary(catState.year, catState.month);
        const categories = data.by_category || data.categories || [];

        // Filter by person
        const filtered = catState.person === 'todos'
            ? categories
            : categories.map(c => {
                const personExpenses = (c.expenses || []).filter(e =>
                    (e.person || '').toLowerCase() === catState.person
                );
                const personTotal = personExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                return { ...c, total: personTotal, amount: personTotal, expenses: personExpenses };
            }).filter(c => (c.total || c.amount || 0) > 0);

        const monthLabel = `${monthNames[catState.month - 1]} ${catState.year}`;

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Categorias</h1>
                    <p>Gastos por categoria</p>
                </div>

                <div class="filters">
                    <div class="filter-group">
                        <button class="filter-btn ${catState.person === 'todos' ? 'active' : ''}" onclick="catState.person='todos';categorias()">Todos</button>
                        <button class="filter-btn ${catState.person === 'aaron' ? 'active' : ''}" onclick="catState.person='aaron';categorias()">Aaron</button>
                        <button class="filter-btn ${catState.person === 'novia' ? 'active' : ''}" onclick="catState.person='novia';categorias()">Novia</button>
                    </div>
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="catPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="catNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                <div class="category-list">
                    ${filtered.length > 0 ? filtered.map((cat, i) => {
                        const catTotal = cat.total || cat.amount || 0;
                        const isExpanded = catState.expandedCat === (cat.id || cat.name || cat.category);
                        const expenses = cat.expenses || [];
                        return `
                        <div class="accordion-item${isExpanded ? ' open' : ''}" style="margin-bottom:6px">
                            <div class="accordion-header" onclick="toggleCat('${esc(cat.id || cat.name || cat.category)}')">
                                <div class="cat-icon">
                                    <span class="category-dot" style="background:${getCatColor(i)}"></span>
                                    <span class="cat-name">${esc(cat.name || cat.category)}</span>
                                </div>
                                <div class="accordion-right">
                                    <span class="accordion-total mono">${fmt(catTotal)}</span>
                                    <span class="accordion-chevron">${icons.chevronDown}</span>
                                </div>
                            </div>
                            <div class="accordion-body">
                                <div class="accordion-content">
                                    <div class="expense-list mt-8">
                                        ${expenses.map(e => `
                                            <div class="expense-item">
                                                <div class="expense-info">
                                                    <span class="expense-desc">${esc(e.description || e.name || '-')}</span>
                                                    <div class="expense-meta">
                                                        <span>${fmtDateShort(e.date || e.created_at)}</span>
                                                        ${e.person ? `<span class="tag">${esc(e.person)}</span>` : ''}
                                                    </div>
                                                </div>
                                                <span class="expense-amount mono">${fmt(e.amount)}</span>
                                            </div>
                                        `).join('')}
                                        ${expenses.length === 0 ? '<p class="text-muted text-center mt-8">Sin gastos</p>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    }).join('') : '<div class="empty-state mt-24">' + icons.empty + '<p>Sin categorias para este mes</p></div>'}
                </div>
            </div>`;
    } catch (err) {
        showError('No se pudo cargar categorias: ' + err.message);
    }
}

function toggleCat(catId) {
    catState.expandedCat = catState.expandedCat === catId ? null : catId;
    categorias();
}

function catPrevMonth() {
    catState.month--;
    if (catState.month < 1) { catState.month = 12; catState.year--; }
    catState.expandedCat = null;
    categorias();
}

function catNextMonth() {
    catState.month++;
    if (catState.month > 12) { catState.month = 1; catState.year++; }
    catState.expandedCat = null;
    categorias();
}


// ── View: Empresa ────────────────────────────────────────────────────
let empState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

async function empresa() {
    setLoading();
    try {
        const data = await api.empresa({ year: empState.year, month: empState.month });
        const expenses = data.expenses || data.items || [];
        const total = data.total ?? expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const monthLabel = `${monthNames[empState.month - 1]} ${empState.year}`;

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Empresa</h1>
                    <p>Gastos de negocio (Aaron)</p>
                </div>

                <div class="filters">
                    <div class="month-selector">
                        <button class="month-nav-btn" onclick="empPrevMonth()">${icons.chevronLeft}</button>
                        <span class="month-label">${monthLabel}</span>
                        <button class="month-nav-btn" onclick="empNextMonth()">${icons.chevronRight}</button>
                    </div>
                </div>

                <div class="card summary-card mb-20">
                    <div class="card-label">Total Empresa</div>
                    <div class="card-value mono">${fmt(total)}</div>
                    <div class="card-sub">${monthLabel}</div>
                </div>

                <div class="section">
                    <div class="section-title">Gastos</div>
                    <div class="expense-list">
                        ${expenses.length > 0 ? expenses.map(e => `
                            <div class="expense-item">
                                <div class="expense-info">
                                    <span class="expense-desc">${esc(e.description || e.name || '-')}</span>
                                    <div class="expense-meta">
                                        <span>${fmtDateShort(e.date || e.created_at)}</span>
                                        ${e.category_name ? `<span class="tag">${esc(e.category_name)}</span>` : ''}
                                    </div>
                                </div>
                                <span class="expense-amount mono">${fmt(e.amount)}</span>
                            </div>
                        `).join('') : `
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


// ── View: Pendientes ─────────────────────────────────────────────────
async function pendientes() {
    setLoading();
    try {
        const data = await api.pendingExpenses();
        const items = data.pending || data.expenses || data || [];
        const list = Array.isArray(items) ? items : [];

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Pendientes</h1>
                    <p>${list.length} elemento${list.length !== 1 ? 's' : ''} por confirmar</p>
                </div>

                <div class="expense-list">
                    ${list.length > 0 ? list.map(item => `
                        <div class="pending-item" id="pending-${item.id}">
                            <div class="pending-info">
                                <div class="pending-desc">${esc(item.description || item.name || '-')}</div>
                                <div class="pending-detail">
                                    ${item.category_name ? esc(item.category_name) : 'Sin categoria'}
                                    ${item.user_name ? ' &middot; ' + esc(item.user_name) : ''}
                                    ${item.date ? ' &middot; ' + fmtDateShort(item.date) : ''}
                                </div>
                            </div>
                            <span class="pending-amount mono">${fmt(item.amount)}</span>
                            <div class="pending-actions">
                                <button class="btn btn-confirm" onclick="confirmItem(${item.id})" title="Confirmar">
                                    ${icons.check} Confirmar
                                </button>
                                <button class="btn btn-reject" onclick="rejectItem(${item.id})" title="Rechazar">
                                    ${icons.x}
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state mt-24">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <p>Todo confirmado</p>
                        </div>`}
                </div>
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


// ── View: Historial ──────────────────────────────────────────────────
let histState = { person: '', category: '', page: 1, perPage: 25 };

async function historial() {
    setLoading();
    try {
        const params = { page: histState.page, per_page: histState.perPage };
        if (histState.person) params.person = histState.person;
        if (histState.category) params.category_id = histState.category;

        const [expData, catData] = await Promise.all([
            api.expenses(params),
            api.categories().catch(() => ({ categories: [] })),
        ]);

        const expenses = expData.expenses || expData.items || expData || [];
        const list = Array.isArray(expenses) ? expenses : [];
        const total = expData.total || 0;
        const perPage = expData.per_page || histState.perPage;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const cats = catData.categories || catData || [];

        document.getElementById('app').innerHTML = `
            <div class="view-enter">
                <div class="view-header">
                    <h1>Historial</h1>
                    <p>Todos los gastos</p>
                </div>

                <div class="filters">
                    <div class="filter-group">
                        <button class="filter-btn ${!histState.person ? 'active' : ''}" onclick="histFilter('person','')">Todos</button>
                        <button class="filter-btn ${histState.person === 'aaron' ? 'active' : ''}" onclick="histFilter('person','aaron')">Aaron</button>
                        <button class="filter-btn ${histState.person === 'novia' ? 'active' : ''}" onclick="histFilter('person','novia')">Novia</button>
                    </div>
                    <select class="filter-select" onchange="histFilter('category', this.value)">
                        <option value="">Todas las categorias</option>
                        ${cats.map(c => `<option value="${c.id || c.name}" ${histState.category == (c.id || c.name) ? 'selected' : ''}>${esc(c.name || c.category)}</option>`).join('')}
                    </select>
                </div>

                <div class="expense-list">
                    ${list.length > 0 ? list.map(e => `
                        <div class="expense-item">
                            <div class="expense-info">
                                <span class="expense-desc">${esc(e.description || e.name || '-')}</span>
                                <div class="expense-meta">
                                    <span>${fmtDate(e.date || e.created_at)}</span>
                                    ${e.category_name ? `<span class="tag">${esc(e.category_name)}</span>` : ''}
                                    ${e.user_name ? `<span class="tag">${esc(e.user_name)}</span>` : ''}
                                </div>
                            </div>
                            <span class="expense-amount mono">${fmt(e.amount)}</span>
                        </div>
                    `).join('') : `
                        <div class="empty-state mt-24">
                            ${icons.empty}
                            <p>Sin gastos encontrados</p>
                        </div>`}
                </div>

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


// ── Escape HTML ──────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    const el = document.createElement('span');
    el.textContent = String(str);
    return el.innerHTML;
}
