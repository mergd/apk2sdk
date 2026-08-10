export class BeliHttpError extends Error {
  readonly body: string;

  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    body: string,
  ) {
    super(`Beli request failed: ${method} ${path} returned ${status}`);
    this.name = "BeliHttpError";
    this.body = body.slice(0, 1_000);
  }
}

export class BeliContractError extends Error {
  constructor(readonly operation: string, detail: string) {
    super(`Invalid Beli response for ${operation}: ${detail}`);
    this.name = "BeliContractError";
  }
}
