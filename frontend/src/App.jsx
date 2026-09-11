import { useState, useEffect } from 'react';
import SplitBillsUI from './SplitBillsUI';
import AuthScreen from './AuthScreen';
import { api, getToken, getStoredUser, setToken, setStoredUser } from './api';

function getStoredGroupId() {
  const raw = localStorage.getItem('evenup_active_group');
  return raw ? Number(raw) : null;
}

function setStoredGroupId(id) {
  if (id != null) localStorage.setItem('evenup_active_group', String(id));
  else localStorage.removeItem('evenup_active_group');
}

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [groupId, setGroupId] = useState(() => getStoredGroupId());
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');

  useEffect(() => {
    if (user && !getToken()) {
      setUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function ensureGroup() {
      setLoadingGroup(true);
      setGroupError('');
      try {
        const groups = await api.myGroups();
        if (cancelled) return;

        const stored = getStoredGroupId();
        // If we have a stored groupId and the user is still a member of it, use it
        if (stored && groups.some((g) => g.id === stored)) {
          setGroupId(stored);
        } else if (groups.length > 0) {
          handleGroupChange(groups[0].id);
        } else {
          // Auto-create a default group for brand-new users
          const newGroup = await api.createGroup(`${user.name}'s Group`, 'INR');
          if (cancelled) return;
          handleGroupChange(newGroup.id);
        }
      } catch (err) {
        if (!cancelled) setGroupError(err.message || 'Failed to load group');
      } finally {
        if (!cancelled) setLoadingGroup(false);
      }
    }

    ensureGroup();
    return () => { cancelled = true; };
  }, [user]);

  function handleGroupChange(newGroupId) {
    setGroupId(newGroupId);
    setStoredGroupId(newGroupId);
  }

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleSignOut() {
    setToken(null);
    setStoredUser(null);
    setStoredGroupId(null);
    setUser(null);
    setGroupId(null);
  }

  if (!user) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          margin: "0 auto",
          background: "#10131C",
          minHeight: 660,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  if (loadingGroup || !groupId) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#10131C", color: "#F4F5F8", fontFamily: "sans-serif" }}>
        {groupError ? `Error: ${groupError}` : 'Loading your group...'}
      </div>
    );
  }

  return (
    <SplitBillsUI
      currentUser={user}
      groupId={groupId}
      onSignOut={handleSignOut}
      onGroupChange={handleGroupChange}
    />
  );
}

export default App;