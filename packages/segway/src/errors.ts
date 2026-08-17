export class SegwayHttpError extends Error {
  readonly name = "SegwayHttpError";

  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly responseBody: string,
  ) {
    super(`Segway API ${method} ${path} failed with ${status}`);
  }
}

export class SegwayContractError extends Error {
  readonly name = "SegwayContractError";

  constructor(readonly operation: string, detail: string) {
    super(`Unexpected Segway response for ${operation}: ${detail}`);
  }
}

export class SegwayApiError extends Error {
  readonly name = "SegwayApiError";

  constructor(
    readonly operation: string,
    readonly code: string | number,
    readonly apiMessage: string,
  ) {
    super(`Segway API ${operation} returned ${code}: ${apiMessage}`);
  }
}
