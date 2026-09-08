import { useState, useEffect } from 'react';
import SplitBillsUI from './SplitBillsUI';
import AuthScreen from './AuthScreen';
import { api, getToken, getStoredUser, setToken, setStoredUser } from './api';

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [groupId, setGroupId] = useState(null);
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

        if (groups.length > 0) {
          setGroupId(groups[0].id);
        } else {
          const newGroup = await api.createGroup(`${user.name}'s Group`, 'INR');
          await api.addMember(newGroup.id, { user_id: user.id });
          if (cancelled) return;
          setGroupId(newGroup.id);
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

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleSignOut() {
    setToken(null);
    setStoredUser(null);
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

  return <SplitBillsUI currentUser={user} groupId={groupId} onSignOut={handleSignOut} />;
}

export default App;
