import { useState } from 'react';
import { api, setToken, setStoredUser } from './api';

const NAVY = "#10131C";
const CARD_NAVY = "#171B26";
const ROW_NAVY = "#1D2230";
const LIME = "#D6F23C";
const MUTED = "#8B90A0";
const WHITE = "#F4F5F8";
const RED = "#E8604F";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(name, email, password);
      setToken(result.token);
      setStoredUser(result.user);
      onAuthenticated(result.user);
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot reach the server. Please check your connection and try again.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: WHITE, margin: "0 0 4px" }}>
        {mode === 'login' ? 'Welcome back' : 'Create account'}
      </h1>
      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 24px" }}>
        {mode === 'login' ? 'Log in to EvenUp' : 'Sign up to start splitting bills'}
      </p>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, display: "block" }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anushka"
              required
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, display: "block" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, display: "block" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ color: RED, fontSize: 12.5, marginBottom: 14 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: LIME,
            color: NAVY,
            border: "none",
            borderRadius: 14,
            padding: "15px 0",
            fontSize: 14.5,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        style={{ background: "none", border: "none", color: LIME, fontSize: 12.5, marginTop: 18, cursor: "pointer", textAlign: "center" }}
      >
        {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: CARD_NAVY,
  border: `1px solid ${ROW_NAVY}`,
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 13.5,
  color: WHITE,
  boxSizing: "border-box",
};
