'use client';

import { RootStoreProvider } from '@/stores/store-setup';

/**
 * App-wide provider component
 * Wraps the application with the MobX Root Store Provider
 */
export function Provider(props: React.PropsWithChildren) {
  return <RootStoreProvider>{props.children}</RootStoreProvider>;
}
