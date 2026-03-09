import { useState, useCallback } from 'react';

/**
 * Custom hook для управления состоянием
 * @param initialValue - начальное значение состояния
 * @returns объект с текущим значением и функциями для управления им
 */
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse };
}

export default useToggle;
