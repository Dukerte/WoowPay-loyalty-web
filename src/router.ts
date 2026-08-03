type ScreenName = string;
type ScreenFactory = () => HTMLElement;

export function createRouter(
  container: HTMLElement,
  screens: Record<ScreenName, ScreenFactory>
) {
  function push(name: ScreenName, ...args: unknown[]) {
    void args;
    container.innerHTML = '';
    const factory = screens[name];
    if (!factory) throw new Error(`Unknown screen: ${name}`);
    container.appendChild(factory());
  }
  return { push };
}
