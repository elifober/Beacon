import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('beacon_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('beacon_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('beacon_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed-bottom p-3 bg-dark text-white shadow-lg" 
      style={{ zIndex: 1050 }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-8 mb-3 mb-md-0">
            <p className="mb-0">
              We use strictly necessary cookies to authenticate your session and keep your account secure. 
              By continuing to use this site, you consent to our use of these essential cookies. 
              Read our <Link to="/privacy-policy" className="text-info text-decoration-none">Privacy Policy</Link> for more details.
            </p>
          </div>
          <div className="col-md-4 text-md-end text-center">
            <button 
              className="btn btn-outline-light me-2 mb-2 mb-md-0" 
              onClick={handleDecline}
            >
              Essential Only
            </button>
            <button 
              className="btn btn-primary mb-2 mb-md-0" 
              onClick={handleAccept}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}