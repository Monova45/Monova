export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
    readonly context?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Debes iniciar sesión.") {
    super(message, "AUTHENTICATION_REQUIRED", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message, "AUTHORIZATION_DENIED", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ProviderError extends AppError {
  constructor(message: string, provider: string) {
    super(message, "PROVIDER_ERROR", 502, { provider });
  }
}
