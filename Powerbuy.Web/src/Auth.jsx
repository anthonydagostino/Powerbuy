import React, { useState } from 'react';
import Auth from './Auth';
// Import whatever component holds your purchases UI right now
import PurchasesList from './PurchasesList'; 

export default function App() {
  // Try to load the token from the browser memory on startup
  const [token, setToken] = useState(localStorage.getItem('powerbuy_token') || '');

  const handleLoginSuccess = (newToken) => {
    // Save token to state and browser memory
    setToken(newToken);
    localStorage.setItem('powerbuy_token', newToken);
  };

  const handleLogout = () => {
    // Clear the token to log out
    setToken('');
    localStorage.removeItem('powerbuy_token');
  };

  // If there is no token, force the user to log in or register
  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // If there IS a token, show the main app and pass the token down
  return (
    <div>
      <div style={{ padding: '10px', background: '#eee', textAlign: 'right' }}>
        <button onClick={handleLogout}>Log Out</button>
      </div>
      
      {/* Pass the token to your component so it can use it in the fetch functions! */}
      <PurchasesList token={token} />
    </div>
  );
}
