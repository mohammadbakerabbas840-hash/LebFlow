import { useEffect, useState, type SetStateAction } from 'react';

/** Only use for non-sensitive prototype data. Validation stays with the feature. */
export function useLocalStorage<T>(key: string, parse: (raw: string) => T, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  });
  const [revision, setRevision] = useState(0);
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    if (!revision) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [key, value, revision]);

  const update = (next: SetStateAction<T>) => {
    setValue(next);
    setRevision((previous) => previous + 1);
  };
  return { value, update, storageFailed, dismissStorageError: () => setStorageFailed(false) };
}
