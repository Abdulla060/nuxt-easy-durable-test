import type { Hooks } from "crossws";

export const defineDurableHandler = (
  instance: (url: URL) => string,
  hooks: Partial<Hooks>,
) => Object.assign(defineWebSocketHandler(hooks), { instance });
