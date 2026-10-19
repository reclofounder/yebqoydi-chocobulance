// Node 25 defines its own experimental global `localStorage`. Without a valid
// `--localstorage-file` it is a bare stub (no getItem/setItem) that shadows jsdom's real
// Storage, and merely reading it prints a warning. Always point the global at jsdom's Storage
// (never reading Node's) so DOM tests behave like a browser on every supported Node.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;

if (dom) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: dom.window.localStorage,
    configurable: true,
    writable: true,
  });
}
