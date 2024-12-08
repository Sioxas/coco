export function createContext<T>(defaultValue: T) {
  const Context: ((value: T, children: () => void) => void) & { value?: T } = (value, children) => {
    const prevValue = Context.value;
    Context.value = value;
    try {
      children();
    } finally {
      Context.value = prevValue;
    }
  }
  Context.value = defaultValue;
  return Context as ((value: T, children: () => void) => void) & { value: T };
}

export interface UseAble<T> {
  value: T;
}

export function use<T>(context: UseAble<T>) {
  return context.value;
}