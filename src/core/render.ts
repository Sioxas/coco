import { createContext, use } from "./context";

export enum ComponentStatus {
  MOUNT = 1,
  UPDATE = 2,
  UNMOUNT = 3,
}

export interface Hook<T = any> {
  value: T;
  next: Hook | null;
}

export interface ComponentCtx {
  hook: Hook | null;
  status: ComponentStatus;
  key?: number | string;
}

export const ComponentContext = createContext<ComponentCtx>({ hook: null, status: ComponentStatus.MOUNT });

let workInProgressHook: Hook | null = null;

function renderWithHooks(render: () => void) {
  workInProgressHook = null;
  render();
}

export function useHook(): Hook {
  const ctx = use(ComponentContext);
  if (ctx.status === ComponentStatus.MOUNT) {
    const hook: Hook = { value: null, next: null };
    if (workInProgressHook) {
      workInProgressHook.next = hook;
    } else {
      ctx.hook = hook;
    }
    workInProgressHook = hook;
  }
  if (ctx.status === ComponentStatus.UPDATE) {
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next;
    } else {
      workInProgressHook = ctx.hook;
    }
  }
  if (!workInProgressHook) {
    throw new Error("hook must be called in the body of a function component");
  }
  return workInProgressHook;
}

export enum ComponentType {
  CLASS = 'ClassComponent',
  FUNCTION = 'FunctionComponent'
}

export interface RenderAble {
  render(): void;
}

interface ComponentKeyModifier {
  key: (k: string|number) => void;
}

type ComponentModifier<T> = T extends Object ? T & ComponentKeyModifier : ComponentKeyModifier;

export function defineComponent<T extends RenderAble, Args extends any[] = never>(Component: { new(...args: Args): T }): ((...args: Args) => ComponentModifier<T>)
export function defineComponent<T, Args extends any[] = never>(Component: (...args: Args) => T): ((...args: Args) => ComponentModifier<T>)
export function defineComponent<T, Args extends any[] = never>(Component: any) {
  const initialCtx: ComponentCtx = { hook: null, status: ComponentStatus.MOUNT };
  if (Component.type === ComponentType.CLASS) {
    return (...args: Args) => {
      const component = new Component(...args);
      ComponentContext(initialCtx, () => component.render());
      component.key = (k: string|number) => {
        initialCtx.key = k;
      }
      return component;
    };
  } else {
    return (...args: Args) => {
      let ret: ComponentModifier<T> | undefined;
      ComponentContext(initialCtx, () => {
        renderWithHooks(() => {
          ret = Component(...args);
        });
      });
      if (!ret) {
        ret = {
          key: (k: string|number) => {
            initialCtx.key = k;
          }
        } as ComponentModifier<T>;
      } else {
        ret.key = (k: string|number) => {
          initialCtx.key = k;
        };
      }
      return ret;
    };
  }
}

