import { use } from "./context";
import { ComponentContext, ComponentStatus, useHook } from "./render";
import { Computed, computed, signal, SignalState } from "./signal";

export function useState<T>(initialState: T | (() => T)): [T, (newState: T) => void] {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = typeof initialState === "function" ? (initialState as () => T)() : initialState;
  }
  const state = hook.value;
  function setState(newState: T) {
    hook.value = newState;
  }
  return [state, setState];
}

export function useSignal<T>(initialState: T) {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = signal(initialState);
  }
  return hook.value as SignalState<T>;
}

export function useComputed<T>(cb: () => T) {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = computed(cb);
  }
  return hook.value as Computed<T>;
}

function depsChanged(prevDeps: any[], deps: any[]) {
  if (!prevDeps || !deps) {
    return true;
  }
  if (prevDeps.length !== deps.length) {
    return true;
  }
  return prevDeps.some((dep, index) => dep !== deps[index]);
}

export function useMemo<T>(cb: () => T, deps: any[]) {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = {
      state: cb(),
      deps: deps,
    };
  }
  if (ctx.status === ComponentStatus.UPDATE) {
    const prevDeps: any[] = hook.value.deps;
    if (depsChanged(prevDeps, deps)) {
      hook.value = {
        state: cb(),
        deps: deps,
      };
    }
  }
  return hook.value.state as T;
}

export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: any[]) {
  return useMemo(() => cb, deps);
}

export function useRef<T>(initialValue: T) {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = { current: initialValue };
  }
  return hook.value as { current: T };
}

export function useEffect(cb: () => (void | (() => void)), deps: any[]) {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = {
      cleanup: cb(),
      deps,
    };
  }
  if (ctx.status === ComponentStatus.UPDATE) {
    const prevDeps: any[] = hook.value.deps;
    if (depsChanged(prevDeps, deps)) {
      if (hook.value.cleanup) {
        hook.value.cleanup?.();
      }
      hook.value = {
        cleanup: cb(),
        deps,
      };
    }
  }
  if (ctx.status === ComponentStatus.UNMOUNT) {
    hook.value.cleanup?.();
  }
}
