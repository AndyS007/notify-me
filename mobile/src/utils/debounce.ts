/**
 * Trailing-edge debounce: invokes `fn` only after `delayMs` has elapsed
 * without a new call. The returned function also exposes `.cancel()` so
 * callers can drop a pending invocation (e.g. on unmount).
 */
export type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
};

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  delayMs: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  }) as Debounced<Args>;

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
