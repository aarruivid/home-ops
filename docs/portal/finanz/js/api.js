/**
 * FinanzOps API Client
 * Fetch wrapper for all backend endpoints.
 */

async function apiFetch(path, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };
    if (!options.body && (!options.method || options.method === 'GET')) {
        delete config.headers['Content-Type'];
    }

    const url = typeof window.portalApiUrl === 'function' ? window.portalApiUrl(path) : path;
    const res = await fetch(url, config);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
}

const api = {
    // Health
    health: () => apiFetch('/api/health'),

    // Overview
    overview: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/overview${qs ? '?' + qs : ''}`);
    },

    // Expenses
    expenses: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/expenses${qs ? '?' + qs : ''}`);
    },
    createExpense: (data) =>
        apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    updateExpense: (id, data) =>
        apiFetch(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExpense: (id) =>
        apiFetch(`/api/expenses/${id}`, { method: 'DELETE' }),
    confirmExpense: (id) =>
        apiFetch(`/api/expenses/${id}/confirm`, { method: 'POST' }),
    pendingExpenses: () =>
        apiFetch('/api/expenses/pending'),

    // Categories
    categories: () => apiFetch('/api/categories'),
    createCategory: (data) =>
        apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) =>
        apiFetch(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) =>
        apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),

    // Budgets
    budgets: () => apiFetch('/api/budgets'),
    upsertBudget: (data) =>
        apiFetch('/api/budgets', { method: 'PUT', body: JSON.stringify(data) }),

    // Users
    users: () => apiFetch('/api/users'),
    updateUser: (id, data) =>
        apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Groceries
    groceriesWeekly: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/groceries/weekly${qs ? '?' + qs : ''}`);
    },
    groceriesBudget: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/groceries/budget${qs ? '?' + qs : ''}`);
    },
    categoryWeekly: (categoryId, params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/category/${categoryId}/weekly${qs ? '?' + qs : ''}`);
    },

    // Empresa
    empresa: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/empresa${qs ? '?' + qs : ''}`);
    },

    // Summaries
    monthlySummary: (y, m) => apiFetch(`/api/summary/monthly/${y}/${m}`),
    compare: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/summary/compare${qs ? '?' + qs : ''}`);
    },

    // Analytics
    dailyTrend: (params) => {
        const qs = new URLSearchParams(params || {}).toString();
        return apiFetch(`/api/analytics/daily-trend${qs ? '?' + qs : ''}`);
    },
};
