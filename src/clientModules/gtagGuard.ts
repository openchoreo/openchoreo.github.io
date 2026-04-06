/**
 * Defines a no-op window.gtag if the Google Analytics script was blocked
 * (e.g. by an ad blocker), preventing "window.gtag is not a function" errors
 * thrown by @docusaurus/plugin-google-gtag on route changes.
 */
if (typeof window !== 'undefined' && typeof window.gtag !== 'function') {
  (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag = () => {};
}

export {};
