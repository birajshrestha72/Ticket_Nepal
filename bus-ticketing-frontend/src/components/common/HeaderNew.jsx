import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/header.css';

const HeaderNew = () => {
  const { user, loginAs, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">Ticket Nepal</Link>
        <nav className="nav">
          <Link to="/search">Search</Link>
          <Link to="/">Destinations</Link>
          {user ? (
            <>
              <span className="role">{user.role}</span>
              <button onClick={logout} className="btn small">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => loginAs('user')} className="btn small">Login as User</button>
              <button onClick={() => loginAs('vendor')} className="btn small">Login as Vendor</button>
              <button onClick={() => loginAs('admin')} className="btn small">Login as Admin</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default HeaderNew;
