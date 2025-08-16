type DebouncedFunction = (...args: any) => void;

export const createDebouncedFunction = (
  fn: Function,
  delay: number = 300
): DebouncedFunction => {
  let timeout: NodeJS.Timeout | null;

  return (...args) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => fn(...args), delay);
  };
};
