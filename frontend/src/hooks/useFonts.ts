import { useEffect } from 'react';

/**
 * Injects the HomeSync Google Fonts stylesheet once per page load. Was
 * copy-pasted verbatim into ~10 page files; consolidated here as the single
 * source of truth.
 */
export function useFonts() {
  useEffect(() => {
    if (document.getElementById('homesync-fonts')) return;
    const link = document.createElement('link');
    link.id = 'homesync-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}
