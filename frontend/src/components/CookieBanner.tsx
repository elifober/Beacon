import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * Cookie consent banner (UI + preference persistence).
 *
 * Architecture notes:
 * - Stores a consent choice in `localStorage` so users aren't prompted every visit.
 * - Does not (and cannot) directly manage HttpOnly auth cookies; those are set by the backend.
 * - The Cookie Policy page documents the categories and how to change preferences.
 */
export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('beacon_cookie_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('beacon_cookie_consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('beacon_cookie_consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="cookie-banner fixed-bottom shadow" style={{ zIndex: 1050 }}>
      <div className="container py-2 px-3">
        <div className="row align-items-center g-2 gy-2">
          <div className="col-md">
            <p className="cookie-banner__text mb-0">
              We use strictly necessary cookies to authenticate your session and keep your account secure.
              By continuing to use this site, you consent to our use of these essential cookies.
              Read our{' '}
              <Link to="/privacy-policy" className="link-light link-underline-opacity-75">
                Privacy Policy
              </Link>{' '}
              for more details.
            </p>
          </div>
          <div className="col-md-auto d-flex flex-wrap gap-2 justify-content-md-end justify-content-center">
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={handleDecline}
            >
              Essential Only
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleAccept}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
