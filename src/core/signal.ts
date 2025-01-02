let currentComputed: Computed | null = null;
interface Signal<T> {
  // Get the value of the signal
  get(): T;
}

interface Subscriber {
  notify(signal: Signal<unknown>): void;
}

class Observable {
  subs: Subscriber[] = [];

  subscribe(subscriber: Subscriber) {
    this.subs.push(subscriber);
    return () => {
      this.unsubscribe(subscriber);
    }
  }

  unsubscribe(subscriber: Subscriber) {
    const index = this.subs.indexOf(subscriber);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }
}


class State<T = unknown> extends Observable implements Signal<T> {
  constructor(public value: T) {
    super();
  }
  set(value: T) {
    if (this.value === value) {
      return;
    }
    this.value = value;
    for (const subscriber of this.subs) {
      subscriber.notify(this);
    }
  }
  get() {
    if (currentComputed) {
      currentComputed.addDep(this);
    }
    return this.value;
  }
}

enum ComputedState {
  Clean,
  Dirty,
  Computing,
  Checked,
}
class Computed<T = unknown> extends Observable implements Signal<T>, Subscriber {
  state = ComputedState.Dirty;
  value: T | undefined;
  constructor(private cb: () => T) {
    super();
    this.compute();
  }

  deps: (State | Computed)[] = [];
  computingDeps: (State | Computed)[] = [];

  addDep(dep: State | Computed) {
    if (this.computingDeps.indexOf(dep) === -1) {
      this.computingDeps.push(dep);
      // dep.subscribe(this);
    }
  }

  notify(signal: State | Computed): void {
    if (!this.deps.includes(signal)) {
      console.warn('notifier is not in the deps', signal);
    }
    this.state = ComputedState.Dirty;
    for (const sub of this.subs) {
      sub.notify(this);
    }
  }

  compute() {
    if (this.state === ComputedState.Computing) {
      throw new Error('Circular dependency detected');
    }
    this.computingDeps = [];
    this.state = ComputedState.Computing;
    const prevComputed = currentComputed;
    currentComputed = this;
    try {
      this.value = this.cb();
      this.state = ComputedState.Clean;
      // deps to remove
      for (const dep of this.deps) {
        if (this.computingDeps.indexOf(dep) === -1) {
          dep.unsubscribe(this);
        }
      }
      // deps to add
      for (const dep of this.computingDeps) {
        if (this.deps.indexOf(dep) === -1) {
          dep.subscribe(this);
        }
      }
      this.deps = this.computingDeps
      this.computingDeps = [];
    } finally {
      currentComputed = prevComputed;
    }
  }

  get(): T {
    if (this.state !== ComputedState.Clean) {
      this.compute();
    }
    if (currentComputed) {
      currentComputed.addDep(this);
    }
    return this.value as T;
  }
}

class Watcher implements Subscriber {
  pending = false;
  computed: Computed;
  constructor(cb: () => void) {
    this.computed = new Computed(cb);
    this.computed.subscribe(this);
  }
  notify(signal: Signal<unknown>): void {
    if (this.pending) {
      return;
    }
    this.pending = true;
    queueMicrotask(() => {
      this.pending = false;
      this.computed.get();
    });
  }
  unwatch() {
    this.computed.unsubscribe(this);
  }
}

export function signal<T>(value: T): State<T> {
  return new State(value);
}

export function computed<T>(cb: () => T): Computed<T> {
  return new Computed(cb);
}

export function watch(cb: () => void) {
  const watcher = new Watcher(cb);
  return () => {
    watcher.unwatch();
  }
}