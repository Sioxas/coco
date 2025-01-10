export interface VNode {
  type: string;
  props?: Record<string, any>;
  children?: Array<VNode | string>;
}

function createElement(vnode: VNode | string): HTMLElement | Text {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.type);
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      (el as any)[key] = value;
    }
  }
  if (vnode.children) {
    vnode.children.forEach(child => el.appendChild(createElement(child)));
  }
  return el;
}

function diffChildren(oldChildren: Array<VNode | string>, newChildren: Array<VNode | string>) {
  // 检测新旧子节点是否包含key
  const isKeyed = newChildren.every(child => typeof child !== "string" && child.props?.key);
  if (!isKeyed) {
    // fallback 原有逻辑
    const len = Math.max(oldChildren.length, newChildren.length);
    const patches: Array<(parent: HTMLElement, el: HTMLElement) => void> = [];
    for (let i = 0; i < len; i++) {
      patches.push(diff(oldChildren[i], newChildren[i]));
    }
    return (parent: HTMLElement, el: HTMLElement) => {
      for (let i = 0; i < len; i++) {
        patches[i] && patches[i](el, el.childNodes[i] as HTMLElement);
      }
    };
  } else {
    // key-based diff
    const oldMap: Record<string, HTMLElement> = {};
    const oldDomNodes = Array.from(el.childNodes) as HTMLElement[];

    // 建立 key -> DOM 的映射
    oldChildren.forEach((child, i) => {
      if (typeof child !== "string" && child.props?.key) {
        oldMap[child.props.key] = oldDomNodes[i];
      }
    });

    const patches: Array<(parent: HTMLElement, el: HTMLElement) => void> = [];
    newChildren.forEach((child, idx) => {
      if (typeof child !== "string" && child.props?.key && oldMap[child.props.key]) {
        patches.push(diff(oldMap[child.props.key], child));
        delete oldMap[child.props.key];
      } else {
        patches.push(diff(null, child));
      }
    });
    // 剩余未使用的旧节点则remove
    const toRemove = Object.values(oldMap);
    return (parent: HTMLElement, el: HTMLElement) => {
      const newDomNodes: HTMLElement[] = [];
      
      // 遍历新children，生成新DOM顺序
      newChildren.forEach((child) => {
        if (typeof child !== "string" && child.props?.key && oldMap[child.props.key]) {
          const domNode = oldMap[child.props.key];
          const patchFn = diff(oldMap[child.props.key + "_vnode"], child);
          patchFn && patchFn(el, domNode);
          newDomNodes.push(domNode);
          delete oldMap[child.props.key];
        } else {
          // 生成或替换节点
          const patchFn = diff(undefined, child);
          const placeholder = document.createElement("div");
          patchFn && patchFn(el, placeholder);
          newDomNodes.push(placeholder.nextSibling as HTMLElement ?? placeholder);
          if(placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        }
      });

      // 移除未使用节点
      Object.values(oldMap).forEach((unusedNode) => {
        if (unusedNode && unusedNode.parentNode === el) {
          el.removeChild(unusedNode);
        }
      });

      // 重新按新顺序插入 DOM (简单清空再插)
      while (el.firstChild) el.removeChild(el.firstChild);
      newDomNodes.forEach(node => el.appendChild(node));
    };
  }
}

export function diff(oldVNode: VNode | string | null, newVNode: VNode | string) {
  if (!oldVNode) {
    return (parent: HTMLElement) => parent.appendChild(createElement(newVNode));
  }
  if (!newVNode) {
    return (parent: HTMLElement, el: HTMLElement) => parent.removeChild(el);
  }
  if (typeof oldVNode === "string" || typeof newVNode === "string") {
    if (oldVNode !== newVNode) {
      return (parent: HTMLElement, el: HTMLElement) => parent.replaceChild(createElement(newVNode), el);
    }
    return () => {};
  }
  if (oldVNode.type !== newVNode.type) {
    return (parent: HTMLElement, el: HTMLElement) => parent.replaceChild(createElement(newVNode), el);
  }
  return (parent: HTMLElement, el: HTMLElement) => {
    // 更新 props
    if (newVNode.props) {
      for (const [prop, value] of Object.entries(newVNode.props)) {
        (el as any)[prop] = value;
      }
    }
    const oldChildren = (oldVNode as VNode).children || [];
    const newChildren = (newVNode as VNode).children || [];
    const patchChildren = diffChildren(oldChildren, newChildren);
    patchChildren(parent, el);
  };
}

export function updateElement(parent: HTMLElement, oldVNode: VNode | string, newVNode: VNode | string) {
  const patch = diff(oldVNode, newVNode);
  patch && patch(parent, parent.firstChild as HTMLElement);
}
