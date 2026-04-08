import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeDonorProfile } from '../lib/authAPI';
import { useAuth } from '../context/AuthContext';

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { authSession, isLoading, refreshAuthSession } = useAuth();
  const didSuggestName = useRef(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!authSession?.isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (!authSession.needsProfileCompletion) {
      navigate('/', { replace: true });
      return;
    }
    if (didSuggestName.current) {
      return;
    }
    const email = authSession.email ?? '';
    if (email) {
      didSuggestName.current = true;
      const local = (email.split('@')[0] ?? '').replace(/[._]/g, ' ').trim();
      const parts = local.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        setFirstName(parts[0] ?? '');
        setLastName(parts.slice(1).join(' '));
      } else if (parts.length === 1) {
        setFirstName(parts[0] ?? '');
        setLastName('');
      }
    }
  }, [
    authSession?.isAuthenticated,
    authSession?.needsProfileCompletion,
    authSession?.email,
    isLoading,
    navigate,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await completeDonorProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organizationName: organizationName.trim() || null,
        phone: phone.trim() || null,
      });
      await refreshAuthSession();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to save profile.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Complete your profile</h2>
              <p className="text-muted small mb-3">
                You signed in with Google. Add your donor details so we can
                recognize you. Your join date is saved when you submit (UTC).
              </p>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="cp-firstName">
                      First name
                    </label>
                    <input
                      id="cp-firstName"
                      type="text"
                      className="form-control"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="cp-lastName">
                      Last name
                    </label>
                    <input
                      id="cp-lastName"
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
                  <label className="form-label" htmlFor="cp-email">
                    Email
                  </label>
                  <input
                    id="cp-email"
                    type="email"
                    className="form-control"
                    value={authSession?.email ?? ''}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="cp-organizationName">
                    Organization name{' '}
                    <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="cp-organizationName"
                    type="text"
                    className="form-control"
                    autoComplete="organization"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="cp-phone">
                    Phone <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="cp-phone"
                    type="tel"
                    className="form-control"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
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
                  {isSubmitting ? 'Saving…' : 'Save and continue'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteProfilePage;
