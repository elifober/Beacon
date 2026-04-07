import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
  loginUser,
} from '../lib/authAPI';
import { useAuth } from '../context/AuthContext.tsx';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshAuthSession } = useAuth();


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await loginUser(email, password, rememberMe);
      await refreshAuthSession();
      navigate('/catalog');

    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to log in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mt-4">
      <Header />
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Login</h2>
              <p className="text-muted">
                Sign in with an Identity cookie so the app can call protected
                endpoints later
              </p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="form-check-input"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Keep me signed in across browser restarts
                  </label>
                </div>
                {errorMessage ? (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-3 mb-0">
                Need an account? <Link to="/register">Register here</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;