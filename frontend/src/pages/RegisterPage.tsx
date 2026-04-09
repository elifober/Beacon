import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  buildExternalLoginUrl,
  getExternalAuthProviders,
  registerUserWithProfile,
} from '../lib/authAPI';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { refreshAuthSession } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);
  const [externalAuthLoadError, setExternalAuthLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const providers = await getExternalAuthProviders();
        const hasGoogle = providers.some(
          (p) => p?.name?.toLowerCase() === 'google'
        );
        if (!cancelled) {
          setIsGoogleAvailable(hasGoogle);
          setExternalAuthLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setIsGoogleAvailable(true);
          setExternalAuthLoadError(
            'Google sign-in may be available, but the app could not verify provider availability right now.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetModalFields() {
    setFirstName('');
    setLastName('');
    setOrganizationName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  }

  function openModal() {
    resetModalFields();
    setShowModal(true);
  }

  function closeModal() {
    if (!isSubmitting) {
      setShowModal(false);
    }
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords must match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUserWithProfile({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organizationName: organizationName.trim() || null,
        phone: phone.trim() || null,
      });
      await refreshAuthSession();
      setSuccessMessage('Welcome! Redirecting…');
      setShowModal(false);
      setTimeout(() => navigate('/'), 600);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to register.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Register</h2>
              <p className="text-muted">
                Create a donor account. We will ask for your name, contact
                details, and password.
              </p>

              {successMessage && !showModal ? (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={openModal}
              >
                Register with email
              </button>

              {isGoogleAvailable ? (
                <>
                  <div className="text-center my-3 text-muted">or</div>
                  {externalAuthLoadError ? (
                    <div className="alert alert-warning" role="alert">
                      {externalAuthLoadError}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-outline-dark w-100"
                    onClick={() => {
                      try {
                        window.location.assign(buildExternalLoginUrl('Google', '/'));
                      } catch (e) {
                        setErrorMessage(
                          e instanceof Error
                            ? e.message
                            : 'Unable to start Google sign-in.'
                        );
                      }
                    }}
                  >
                    Continue with Google
                  </button>
                </>
              ) : null}

              {errorMessage && !showModal ? (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <p className="mt-3 mb-0">
                Already registered? <Link to="/login">Go to login</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal ? (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registerModalTitle"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          >
            {/* Fixed max height + scrollable body so the Create account button is always reachable. */}
            <div
              className="modal-dialog my-2 mx-auto"
              style={{
                maxWidth: 'min(520px, calc(100vw - 1.5rem))',
                height: 'calc(100vh - 1.5rem)',
                maxHeight: 'calc(100vh - 1.5rem)',
                margin: '0.75rem auto',
              }}
            >
              <div
                className="modal-content d-flex flex-column h-100"
                style={{ maxHeight: '100%', overflow: 'hidden' }}
              >
                <div className="modal-header flex-shrink-0">
                  <h2 className="modal-title h5" id="registerModalTitle">
                    Create your account
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={isSubmitting}
                    onClick={closeModal}
                  />
                </div>
                <form
                  className="d-flex flex-column flex-grow-1"
                  style={{ minHeight: 0, overflow: 'hidden' }}
                  onSubmit={handleModalSubmit}
                >
                  <div
                    className="modal-body flex-grow-1"
                    style={{
                      minHeight: 0,
                      overflowY: 'scroll',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarGutter: 'stable',
                    }}
                  >
                    <p className="text-muted small mb-3">
                      Join date is saved automatically when you submit (UTC).
                    </p>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" htmlFor="reg-firstName">
                          First name
                        </label>
                        <input
                          id="reg-firstName"
                          type="text"
                          className="form-control"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" htmlFor="reg-lastName">
                          Last name
                        </label>
                        <input
                          id="reg-lastName"
                          type="text"
                          className="form-control"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="reg-organizationName"
                      >
                        Organization name{' '}
                        <span className="text-muted">(optional)</span>
                      </label>
                      <input
                        id="reg-organizationName"
                        type="text"
                        className="form-control"
                        autoComplete="organization"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reg-email">
                        Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        className="form-control"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reg-phone">
                        Phone <span className="text-muted">(optional)</span>
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className="form-control"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reg-password">
                        Password
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        className="form-control"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={15}
                      />
                      <div className="form-text">
                        At least 15 characters (per site policy).
                      </div>
                    </div>
                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="reg-confirmPassword"
                      >
                        Confirm password
                      </label>
                      <input
                        id="reg-confirmPassword"
                        type="password"
                        className="form-control"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={15}
                      />
                    </div>
                    {errorMessage ? (
                      <div className="alert alert-danger" role="alert">
                        {errorMessage}
                      </div>
                    ) : null}
                    <div className="d-grid gap-2 mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating account…' : 'Create account'}
                      </button>
                    </div>
                  </div>
                  <div className="modal-footer flex-shrink-0 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={isSubmitting}
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default RegisterPage;
