import { useState } from 'react';
import defaultLogo from '../assets/maulana-azad-logo.png';

/**
 * Returns the app logo URL, prioritizing the Settings-uploaded logo
 * stored in localStorage as 'uploadedLogo'. Falls back to bundled logo.
 */
export function useAppLogo(): string {
  const [logoUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('uploadedLogo');
      return (stored && stored.length > 0) ? stored : defaultLogo;
    } catch {
      return defaultLogo;
    }
  });

  return logoUrl;
}

/**
 * Synchronous access to the logo; useful in non-react code paths.
 */
export function getAppLogo(): string {
  try {
    const stored = localStorage.getItem('uploadedLogo');
    return stored && stored.length > 0 ? stored : defaultLogo;
  } catch {
    return defaultLogo;
  }
}
