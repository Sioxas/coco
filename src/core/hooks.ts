import { use } from "./context";
import { ComponentContext, ComponentStatus, useHook } from "./render";
import { Computed, computed, signal, SignalState } from "./signal";

export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((state: T) => T)) => void] {
  const ctx = use(ComponentContext);
  const hook = useHook();
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = typeof initialState === "function" ? (initialState as () => T)() : initialState;
  }
  const state = hook.value as T;
  function setState(newState: T | ((state: T) => T)) {
    const value = typeof newState === "function" ? (newState as (state: T) => T)(state) : newState;
    if (value !== state) {
      hook.value = value;
      ctx.dirty = true;
    }
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

type Cleanup = void | (() => void);
type EffectCallback = () => Cleanup;
type DependencyList = ReadonlyArray<any>;

function depsChanged(prevDeps: DependencyList, newDeps: DependencyList): boolean {
  if (prevDeps.length !== newDeps.length) return true;
  return prevDeps.some((dep, i) => !Object.is(dep, newDeps[i]));
}

export function useEffect(callback: EffectCallback, deps?: DependencyList) {
  const ctx = use(ComponentContext);
  const hook = useHook();

  // Validate inputs
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error('useEffect deps must be an array or undefined');
  }

  // Handle mount
  if (ctx.status === ComponentStatus.MOUNT) {
    hook.value = {
      cleanup: callback(),
      deps: deps ?? [],
    };
  }

  // Handle updates
  if (ctx.status === ComponentStatus.UPDATE) {
    const prevDeps = hook.value.deps;
    // Run effect if deps is undefined (no deps) or deps changed
    if (!deps || depsChanged(prevDeps, deps)) {
      if (typeof hook.value.cleanup === 'function') {
        hook.value.cleanup();
      }
      hook.value = {
        cleanup: callback(),
        deps: deps ?? [],
      };
    }
  }

  // Handle unmount
  if (ctx.status === ComponentStatus.UNMOUNT) {
    if (typeof hook.value.cleanup === 'function') {
      hook.value.cleanup();
    }
  }
}

export function useMemo<T>(cb: () => T, deps: any[]) {
  const hook = useHook();
  const prevDeps: any[] = hook.value.deps;
  if (depsChanged(prevDeps, deps)) {
    hook.value = {
      state: cb(),
      deps: deps,
    };
  }
  return hook.value.state as T;
}

export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: any[]) {
  return useMemo(() => cb, deps);
}

export function useRef<T>(initialValue: T) {
  return useMemo(() => ({ current: initialValue }), []);
}
