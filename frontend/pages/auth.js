import { useState, useEffect } from 'react';
import axios from 'axios';

function calculatePasswordStrength(password) {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[\W_]/.test(password)) score += 1;
  return score;
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (mode === 'signup') {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password, mode]);

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'from-red-500 to-red-600';
    if (passwordStrength <= 4) return 'from-yellow-400 to-yellow-500';
    return 'from-green-400 to-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint =
        mode === 'login'
          ? 'http://127.0.0.1:8000/login'
          : 'http://127.0.0.1:8000/signup';

      let response;
      if (mode === 'login') {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        response = await axios.post(endpoint, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } else {
        response = await axios.post(endpoint, { username, password, role: 'Viewer' });
      }

      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setMessage(`${mode === 'login' ? 'Logged in' : 'Signed up'} successfully! Redirecting...`);
        setTimeout(() => (window.location.href = '/'), 1500);
      } else {
        setMessage('Unexpected response from server.');
      }
    } catch (err) {
      console.error("Full error response:", err.response);
      setMessage(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-10 space-y-6">
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-400/40">
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab);
                setMessage('');
                setUsername('');
                setPassword('');
              }}
              className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${
                mode === tab
                  ? 'border-b-4 border-indigo-400 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              disabled={loading}
            >
              {tab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        <h1 className="text-3xl font-bold text-white text-center">{mode === 'login' ? 'Login' : 'Sign Up'}</h1>

        {message && (
          <div
            className={`text-center text-sm font-semibold transition-opacity duration-500 ${
              message.toLowerCase().includes('error') ||
              message.toLowerCase().includes('unexpected') ||
              message.toLowerCase().includes('occurred')
                ? 'text-red-400'
                : 'text-green-400'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            disabled={loading}
          />

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              disabled={loading}
            />
            {mode === 'signup' && (
              <div className="mt-2">
                <div className="w-full h-2 rounded bg-gray-700 overflow-hidden">
                  <div
                    className={`h-2 rounded bg-gradient-to-r ${getStrengthColor()} transition-all duration-300`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1 text-white select-none">
                  Password strength: {getStrengthLabel()}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 transition duration-300 disabled:opacity-60"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            <span>{mode === 'login' ? 'Login' : 'Sign Up'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
