import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Scrolls window to top whenever the route (pathname) changes.
 * React Router v6+ keeps the browser's scroll position across navigations,
 * which causes the new page to open mid-page if the user scrolled before
 * clicking a link. Mounting this component inside the router resets scroll
 * on every transition.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
