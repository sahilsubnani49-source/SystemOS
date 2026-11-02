import { Monitor } from '../data/services/MonitorService';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
interface ErrorUtilsLike {
  getGlobalHandler(): GlobalHandler;
  setGlobalHandler(handler: GlobalHandler): void;
}

let installed = false;

/**
 * Record uncaught JS errors in the System Monitor, then hand them to React Native's
 * own handler, so the dev red screen and release crash behaviour are unchanged.
 * A fatal error kills the JS runtime right after this returns, so the event is
 * flushed synchronously-ish (best effort) before passing it on.
 */
export function installGlobalErrorHandler(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed || !errorUtils) return;
  installed = true;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    Monitor.error('error', isFatal ? 'Fatal uncaught error' : 'Uncaught error', error);
    void Monitor.flush();
    previous(error, isFatal);
  });
}

// Installed on import, from index.ts, before any component module is evaluated.
installGlobalErrorHandler();
