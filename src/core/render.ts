import { createContext, use } from "./context";

enum ComponentStatus {
  MOUNT = 1,
  UPDATE = 2,
  UNMOUNT = 3,
}

interface HookNode<T = any> {
  value: T;
  next: HookNode | null;
}

interface ComponentCtx {
  hook: HookNode | null;
  status: ComponentStatus
}

const ComponentContext = createContext<ComponentCtx>({ hook: null });

function useHook() {}

export interface RenderAble {
  render(): void;
}

export function defineComponent<T extends RenderAble, Args extends any[] = never>(Component: { new(...args: Args): T }) {
  return (...args: Args) => {
    const component = new Component(...args);
    ComponentContext({ hooks: null }, () => {
      component.render();
    });
    return component;
  };
}