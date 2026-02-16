import { lazy, ComponentType } from 'react';

/**
 * Retries a dynamic import up to `retries` times with a 1s delay between attempts.
 * Returns the module promise that React.lazy expects.
 */
export const retryImport = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  retries = 3
): Promise<{ default: ComponentType<any> }> => {
  return importFn().catch((err) => {
    if (retries > 0) {
      return new Promise<{ default: ComponentType<any> }>((resolve) =>
        setTimeout(resolve, 1000)
      ).then(() => retryImport(importFn, retries - 1));
    }
    throw err;
  });
};

/**
 * Wrapper around React.lazy that automatically retries failed dynamic imports.
 * Use this for ALL lazy-loaded components to handle flaky mobile networks.
 */
export const lazyWithRetry = (
  importFn: () => Promise<{ default: ComponentType<any> }>
): React.LazyExoticComponent<ComponentType<any>> => {
  return lazy(() => retryImport(importFn));
};
