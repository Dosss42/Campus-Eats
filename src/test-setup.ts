// Polyfills for running unit tests under jsdom (the default Vitest environment).

// Node's own experimental `localStorage` global (behind --localstorage-file)
// can shadow jsdom's implementation and throw when touched. Services such as
// CartService and AuthService persist to localStorage, so fall back to a
// simple in-memory Storage when the real one isn't usable here.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

try {
  localStorage.setItem('__campuseats_probe__', '1');
  localStorage.removeItem('__campuseats_probe__');
} catch {
  const memoryStorage = createMemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
}

// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
