export abstract class TypedEventTarget<T extends Record<keyof T, unknown>> {
  readonly #eventTarget = new EventTarget();

  public addEventListener<K extends keyof T>(
    type: K,
    listener: (event: CustomEvent<T[K]>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.#eventTarget.addEventListener(
      type as string,
      listener as EventListener,
      options,
    );
  }

  public removeEventListener<K extends keyof T>(
    type: K,
    listener: (event: CustomEvent<T[K]>) => void,
    options?: boolean | EventListenerOptions,
  ): void {
    this.#eventTarget.removeEventListener(
      type as string,
      listener as EventListener,
      options,
    );
  }

  protected dispatchEvent<K extends keyof T>(
    type: K,
    detail: T[K],
  ): boolean {
    return this.#eventTarget.dispatchEvent(
      new CustomEvent(type as string, { detail }),
    );
  }
}
