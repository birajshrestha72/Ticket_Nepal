import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);


  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '32px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2em', fontWeight: 'bold', textAlign: 'center', color: '#222' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        <form className="space-y-4" onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={handleGoogleAuth}
          className="w-full py-2 font-semibold text-white bg-red-500 rounded hover:bg-red-600"
        >
          Continue with Gmail
        </button>
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
