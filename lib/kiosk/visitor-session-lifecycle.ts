export class VisitorSessionLifecycle {
  private generation = 0;
  private activeRequest: AbortController | null = null;

  beginRequest() {
    this.activeRequest?.abort();
    const controller = new AbortController();
    this.activeRequest = controller;
    return {
      controller,
      generation: this.generation,
    };
  }

  isCurrent(generation: number, controller: AbortController) {
    return (
      generation === this.generation &&
      controller === this.activeRequest &&
      !controller.signal.aborted
    );
  }

  finish(controller: AbortController) {
    if (controller === this.activeRequest) this.activeRequest = null;
  }

  reset() {
    this.generation += 1;
    this.activeRequest?.abort();
    this.activeRequest = null;
  }

  get currentGeneration() {
    return this.generation;
  }

  get hasActiveRequest() {
    return this.activeRequest !== null;
  }
}
