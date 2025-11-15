import React from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../css/login.css';

const Login = () => {
  const { loginAs } = useAuth();
  return (
    <div className="page login">
      <h2>Login / Sign In</h2>
      <p>For demo use the buttons to simulate roles.</p>
      <div className="role-buttons">
        <button onClick={() => loginAs('user')}>Login as User</button>
        <button onClick={() => loginAs('vendor')}>Login as Vendor</button>
        <button onClick={() => loginAs('admin')}>Login as Admin</button>
        <button onClick={() => loginAs('superadmin')}>Login as Super Admin</button>
      </div>
    </div>
  );
};

export default Login;
