import { useState, useEffect } from 'react';
import SplitBillsUI from './SplitBillsUI';
import AuthScreen from './AuthScreen';
import { getToken, getStoredUser, setToken, setStoredUser } from './api';

function App() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    // if there's a stored user but somehow no token, treat as logged out
    if (user && !getToken()) {
      setUser(null);
    }
  }, [user]);

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleSignOut() {
    setToken(null);
    setStoredUser(null);
    setUser(null);
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

  return <SplitBillsUI currentUser={user} onSignOut={handleSignOut} />;
}

export default App;
