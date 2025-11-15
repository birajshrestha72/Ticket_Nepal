import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // simple mock auth for dev: user object has { role: 'user'|'vendor'|'admin'|'superadmin' }
  const [user, setUser] = useState(null);

  const loginAs = (role = 'user') => {
    setUser({ name: `${role}-demo`, role });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
