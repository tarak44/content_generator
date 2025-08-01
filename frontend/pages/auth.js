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

  return score; // 0-5
}

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
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
    switch (passwordStrength) {
      case 0:
      case 1:
      case 2:
        return 'Weak';
      case 3:
      case 4:
        return 'Medium';
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
      case 2:
        return 'bg-red-500';
      case 3:
      case 4:
        return 'bg-yellow-400';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
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
        response = await axios.post(endpoint, {
          username,
          password,
          role: 'Viewer',
        });
      }

      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setMessage(
          `${mode === 'login' ? 'Logged in' : 'Signed up'} successfully! Redirecting...`
        );
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
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
    <div className="min-h-screen bg-gradient-to-tr from-purple-900 via-blue-900 to-indigo-900 flex flex-col justify-center items-center p-6">
      <div className="bg-gray-800 p-10 rounded-lg shadow-lg max-w-md w-full">
        {/* Tabs */}
        <div className="flex mb-8 border-b border-gray-600">
          <button
            onClick={() => {
              setMode('login');
              setMessage('');
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${
              mode === 'login'
                ? 'border-b-4 border-indigo-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={loading}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setMessage('');
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${
              mode === 'signup'
                ? 'border-b-4 border-indigo-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={loading}
          >
            Sign Up
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </h1>

        {message && (
          <div
            className={`mb-6 text-center text-sm font-semibold ${
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            disabled={loading}
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={loading}
            />
            {/* Password strength meter only on signup */}
            {mode === 'signup' && (
              <div className="mt-2">
                <div className="w-full bg-gray-600 rounded h-2">
                  <div
                    className={`h-2 rounded ${getStrengthColor()}`}
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
            className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md py-3 transition duration-300 disabled:opacity-60"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            <span>{mode === 'login' ? 'Login' : 'Sign Up'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
