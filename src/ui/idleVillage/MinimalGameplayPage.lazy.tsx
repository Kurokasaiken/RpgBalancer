import { lazy } from 'react';

/**
 * Lazy wrapper for MinimalGameplayPage to keep routing bundle slim and
 * provide a single entry point for Suspense boundaries/tests.
 */
export const MinimalGameplayPageLazy = lazy(() =>
  import('./MinimalGameplayPage').then((module) => ({
    default: module.default,
  }))
);

export default MinimalGameplayPageLazy;
