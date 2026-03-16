/**
 * FinanzOps API Client (Portal Edition)
 * Uses portalApiUrl() from portal-config.js to route through gateway.
 */

function _url(path) {
    return typeof portalApiUrl === 'function' ? portalApiUrl(path) : path;
}

function _checkConfigured() {
    var base = localStorage.getItem('portal_api_base');
    if (!base) {
        throw new Error('API no configurada. Ve a la pagina del Portal y configura la URL del API en Settings.');
    }
}

async function apiFetch(path, options = {}) {
    _checkConfigured();

    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };
    if (!options.body && (!options.method || options.method === 'GET')) {
        delete config.headers['Content-Type'];
    }

    const res = await fetch(_url(path), config);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
}

const api = {
    health: () => apiFetch('/api/health'),
    overview: () => apiFetch('/api/overview'),
    expenses: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/expenses${qs ? '?' + qs : ''}`);
    },
    createExpense: (data) =>
        apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    confirmExpense: (id) =>
        apiFetch(`/api/expenses/${id}/confirm`, { method: 'POST' }),
    deleteExpense: (id) =>
        apiFetch(`/api/expenses/${id}`, { method: 'DELETE' }),
    pendingExpenses: () =>
        apiFetch('/api/expenses/pending'),
    categories: () => apiFetch('/api/categories'),
    groceriesWeekly: () => apiFetch('/api/groceries/weekly'),
    groceriesBudget: () => apiFetch('/api/groceries/budget'),
    empresa: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/empresa${qs ? '?' + qs : ''}`);
    },
    monthlySummary: (y, m) => apiFetch(`/api/summary/monthly/${y}/${m}`),
    compare: () => apiFetch('/api/summary/compare'),
    users: () => apiFetch('/api/users'),
};
