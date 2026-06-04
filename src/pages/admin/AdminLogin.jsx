import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSettings, verifyPassword,
  isRateLimited, isLockedOut, recordLoginAttempt,
  clearLoginAttempts, setAuthSession, validateAuthSession,
} from "../../utils/storage";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (validateAuthSession()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const checkLockout = () => {
      const seconds = isRateLimited();
      setLockoutSeconds(seconds);
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setError("");

    if (lockoutSeconds > 0) {
      setError(`Too many attempts. Try again in ${lockoutSeconds}s`);
      return;
    }

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (isLockedOut()) {
      setError("Account temporarily locked. Try again later.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 800));
      const settings = getSettings();
      const storedHash = settings?._passwordHash;
      const usernameHash = settings?._usernameHash;

      if (!storedHash || !usernameHash) {
        recordLoginAttempt(username, false);
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      const [usernameMatch, passwordMatch] = await Promise.all([
        verifyPassword(username, usernameHash),
        verifyPassword(password, storedHash),
      ]);

      if (usernameMatch && passwordMatch) {
        clearLoginAttempts();
        setAuthSession();
        navigate("/admin/dashboard", { replace: true });
      } else {
        recordLoginAttempt(username, false);
        setError("Invalid credentials");
      }
    } catch {
      setError("Login error. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="max-w-sm w-full mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-5xl">🔐</span>
          <h1 className="text-3xl font-display font-bold mt-4 text-gradient">Admin Login</h1>
        </div>
        <div className="p-6 rounded-xl bg-surface/50 border border-secondary space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="form-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="form-input"
          />
          {error && (
            <p className="text-sm text-booked text-center">{error}</p>
          )}
          {lockoutSeconds > 0 && (
            <div className="w-full bg-booked/10 border border-booked/30 rounded-lg p-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-booked h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(lockoutSeconds / 900) * 100}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || lockoutSeconds > 0}
            className="w-full bg-primary text-white font-bold py-3 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
