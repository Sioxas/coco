export function createContext<T>(defaultValue: T) {
  let currentValue = defaultValue;

  const Context = (value: T, children: () => void) => {
    const prevValue = currentValue;
    currentValue = value;
    try {
      children();
    } finally {
      currentValue = prevValue;
    }
  }

  return Object.assign(Context, {
    get value() {
      return currentValue;
    }
  });
}

export interface UseAble<T> {
  value: T;
}

export function use<T>(context: UseAble<T>) {
  return context.value;
}