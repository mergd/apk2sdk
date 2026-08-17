export class ButterflyMxHttpError extends Error {
  readonly name = "ButterflyMxHttpError";

  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly responseBody: string,
  ) {
    super(`ButterflyMX API ${method} ${path} failed with ${status}`);
  }
}

export class ButterflyMxContractError extends Error {
  readonly name = "ButterflyMxContractError";

  constructor(readonly operation: string, detail: string) {
    super(`Unexpected ButterflyMX response for ${operation}: ${detail}`);
  }
}
