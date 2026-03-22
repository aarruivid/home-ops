/* ══════════════════════════════════════════════════════════════════
   Fitness Tracker — API Client
   Fetch wrapper + all endpoint functions. Global `API` object.
   ══════════════════════════════════════════════════════════════════ */

const API = {

  async _fetch(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const url = typeof portalApiUrl === 'function' ? portalApiUrl(path) : path;
    const res = await fetch(url, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const err = await res.json(); if (err.error) msg = err.error; } catch (_) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  get(path) { return this._fetch(path, { method: 'GET' }); },
  post(path, data) { return this._fetch(path, { method: 'POST', body: JSON.stringify(data) }); },
  put(path, data) { return this._fetch(path, { method: 'PUT', body: JSON.stringify(data) }); },
  del(path) { return this._fetch(path, { method: 'DELETE' }); },

  // Profile
  getProfile() { return this.get('/api/profile'); },
  updateProfile(data) { return this.put('/api/profile', data); },

  // Meals
  getMeals(from, to) { return this.get(`/api/meals?from=${from}&to=${to || from}`); },
  createMeal(data) { return this.post('/api/meals', data); },
  getMeal(id) { return this.get(`/api/meals/${id}`); },
  deleteMeal(id) { return this.del(`/api/meals/${id}`); },
  addMealItem(mealId, data) { return this.post(`/api/meals/${mealId}/items`, data); },
  lookupFood(query) { return this.post('/api/nutrition/lookup', { query }); },

  // Gym
  getExercises() { return this.get('/api/gym/exercises'); },
  createExercise(data) { return this.post('/api/gym/exercises', data); },
  getWorkouts(from, to) { return this.get(`/api/gym/workouts?from=${from}&to=${to || from}`); },
  createWorkout(data) { return this.post('/api/gym/workouts', data); },
  deleteWorkout(id) { return this.del(`/api/gym/workouts/${id}`); },
  getPRs() { return this.get('/api/gym/prs'); },

  // Body
  getWeightLog(limit) { return this.get(`/api/body/weight?limit=${limit || 52}`); },
  logWeight(data) { return this.post('/api/body/weight', data); },
  getPhotos() { return this.get('/api/body/photos'); },

  // Summary
  dailySummary(date) { return this.get(`/api/summary/daily/${date}`); },
  weeklySummary(date) { return this.get(`/api/summary/weekly/${date}`); },

  // Targets
  getWeeklyTargets() { return this.get('/api/targets/weekly'); },
  recalculateTargets() { return this.post('/api/targets/recalculate', {}); },

  // Reminders
  getReminders() { return this.get('/api/reminders'); },
  updateReminders(data) { return this.put('/api/reminders', data); },
};
