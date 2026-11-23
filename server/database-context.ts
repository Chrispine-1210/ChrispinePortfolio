import { AsyncLocalStorage } from "node:async_hooks";

// Helpers importing the shared db must use the active request transaction too.
// Each database owns its own context; nested transactions retain savepoints.
export function contextualDatabase<T extends object>(database: T): T {
  const context = new AsyncLocalStorage<T>();
  return new Proxy(database, {
    get(_target, property) {
      const active = context.getStore() ?? database;
      const value: any = Reflect.get(active, property, active);
      if (property === "transaction") {
        return (callback: (transaction: T) => Promise<unknown>, ...options: unknown[]) =>
          value.call(active, (transaction: T) => context.run(transaction, () => callback(transaction)), ...options);
      }
      return typeof value === "function" ? value.bind(active) : value;
    },
  });
}
