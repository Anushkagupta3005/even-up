const API_BASE = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('evenup_token');
}

function setToken(token) {
  if (token) localStorage.setItem('evenup_token', token);
  else localStorage.removeItem('evenup_token');
}

function getStoredUser() {
  const raw = localStorage.getItem('evenup_user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user) {
  if (user) localStorage.setItem('evenup_user', JSON.stringify(user));
  else localStorage.removeItem('evenup_user');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || `Request failed: ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // auth
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  // groups
  createGroup: (name, base_currency) =>
    request('/groups', { method: 'POST', body: { name, base_currency }, auth: false }),
  listGroups: () => request('/groups', { auth: false }),
  myGroups: () => request('/groups/mine'),
  getGroup: (groupId) => request(`/groups/${groupId}`, { auth: false }),
  addMember: (groupId, payload) =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: payload }),
  setApprovalMode: (groupId, approval_mode) =>
    request(`/groups/${groupId}/approval-mode`, { method: 'PATCH', body: { approval_mode } }),

  // expenses
  addExpense: (groupId, payload) =>
    request(`/groups/${groupId}/expenses`, { method: 'POST', body: payload }),
  listExpenses: (groupId) => request(`/groups/${groupId}/expenses`, { auth: false }),
  vote: (groupId, expenseId, vote) =>
    request(`/groups/${groupId}/expenses/${expenseId}/vote`, { method: 'POST', body: { vote } }),

  // balances / chart / settlements
  getBalances: (groupId) => request(`/groups/${groupId}/balances`, { auth: false }),
  getChartData: (groupId) => request(`/groups/${groupId}/chart-data`, { auth: false }),
  getSettlements: (groupId) => request(`/groups/${groupId}/settlements`, { auth: false }),
};

export { getToken, setToken, getStoredUser, setStoredUser, SOCKET_URL };
