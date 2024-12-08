import classNames from "classnames";
import { ComponentType, defineComponent, RenderAble } from "./render";
import { createContext, use } from "./context";

const ElementContext = createContext<HTMLElement[] | null>(null);

class BaseComponent<T extends keyof HTMLElementTagNameMap = any> implements RenderAble {
  static type = ComponentType.CLASS;
  protected element: HTMLElementTagNameMap[T];

  constructor(tag: T, private renderChildren?: () => void) {
    this.element = document.createElement(tag);
  }

  render() {
    const current = use(ElementContext);
    if (!current) {
      throw new Error('Component must in render function');
    }
    if (this.renderChildren) {
      const children: HTMLElement[] = [];
      ElementContext(children, () => {
        this.renderChildren?.();
      });
      this.element.replaceChildren(...children);
    }
    current.push(this.element);
  }

  style(styles: Partial<CSSStyleDeclaration>) {
    Object.assign(this.element.style, styles);
    return this;
  }

  classNames(...args: classNames.ArgumentArray) {
    this.element.className = classNames(...args);
  }

  id(id: string) {
    this.element.id = id;
    return this;
  }

  on<K extends keyof HTMLElementEventMap>(
    type: K, 
    listener: (target: BaseComponent<T>, event: HTMLElementEventMap[K]) => void, 
    options?: boolean | AddEventListenerOptions
  ) {
    const handler = (event: HTMLElementEventMap[K]) => listener(this, event);
    this.element.addEventListener(type, handler as EventListenerOrEventListenerObject, options);
    return this;
  }
}

export function renderRoot(root: HTMLElement, redner: () => void) {
  const children: HTMLElement[] = [];
  ElementContext(children, redner);
  root.replaceChildren(...children);
}

export const HStack = defineComponent(
  class HStackComponent extends BaseComponent<'div'> {
    constructor(children: () => void) {
      super('div', children);
      this.style({ display: 'flex' });
    }
    gap(gap: string) {
      this.style({ gap });
      return this;
    }
  }
);

export const VStack = defineComponent(class VStackComponent extends BaseComponent<'div'> {
  constructor(children: () => void) {
    super('div', children);
    this.style({ display: 'flex', flexDirection: 'column' });
  }
  gap(gap: string) {
    this.style({ gap });
    return this;
  }
});

export const Text = defineComponent(class TextComponent extends BaseComponent<'span'> {
  constructor(text: string) {
    super('span');
    this.element.textContent = text;
  }
});

export const Image = defineComponent(class ImageComponent extends BaseComponent<'img'> {
  constructor(src: string) {
    super('img');
    this.element.src = src;
  }
});

export const Button = defineComponent(class ButtonComponent extends BaseComponent<'button'> {
  constructor(text: string) {
    super('button');
    this.element.textContent = text;
  }
  onClick(listener: (target: BaseComponent, event: MouseEvent) => void) {
    this.on('click', listener);
  }
});

export const Link = defineComponent(class LinkComponent extends BaseComponent<'a'> {
  constructor(text: string, href: string, target = '_blank') { 
    super('a');
    this.element.textContent = text;
    this.element.href = href;
    this.element.target = target;
  }
});
