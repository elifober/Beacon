import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset scroll position on route changes. Uses pathname only (not hash) so
 * in-page navigations like / → /#mission still defer to LandingPage's hash handler.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
