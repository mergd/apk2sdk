export class EightSleepHttpError extends Error {
  readonly name = "EightSleepHttpError";

  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly responseBody: string,
  ) {
    super(`Eight Sleep API ${method} ${path} failed with ${status}`);
  }
}

export class EightSleepContractError extends Error {
  readonly name = "EightSleepContractError";

  constructor(readonly operation: string, detail: string) {
    super(`Unexpected Eight Sleep response for ${operation}: ${detail}`);
  }
}
