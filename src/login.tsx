
import { useState, type FormEvent } from 'react';
import { supabase } from './lib/supabase';

type LoginProps = {
  onLogin: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    onLogin();
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand-mark">✚</div>
        <p className="login-eyebrow">CARE INTELLIGENCE</p>
        <h1>Welcome to MediBridge <span>AI</span></h1>
        <p className="login-description">
          Sign in to access your connected care workspace.
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in securely →'}
          </button>
        </form>

        <p className="login-footer">
          Secure workspace · Authorized users only
        </p>
      </section>
    </main>
  );
}
