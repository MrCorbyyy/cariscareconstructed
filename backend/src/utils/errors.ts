export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'error',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'bad_request', details);
export const unauthorized = (message = 'Authentication required') => new AppError(401, message, 'unauthorized');
export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(403, message, 'forbidden');
export const notFound = (message = 'Not found') => new AppError(404, message, 'not_found');
export const conflict = (message: string, details?: unknown) => new AppError(409, message, 'conflict', details);
export const unavailable = (message: string) => new AppError(503, message, 'service_unavailable');
