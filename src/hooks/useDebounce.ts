import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const debouncedSetValue = debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay);

    debouncedSetValue(value);

    return () => {
      debouncedSetValue.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}