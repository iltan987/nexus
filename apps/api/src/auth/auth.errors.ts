import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  type HttpException,
} from '@nestjs/common';

// Define all possible auth error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_CONFLICT: 'EMAIL_CONFLICT',
  USERNAME_CONFLICT: 'USERNAME_CONFLICT',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Extract the type from the object
export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// Define error metadata
interface AuthErrorMetadata {
  message: string;
  httpException: new (message: string) => HttpException;
}

// Map error codes to their metadata
export const AUTH_ERROR_MAP: Record<AuthErrorCode, AuthErrorMetadata> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: {
    message: 'Invalid credentials',
    httpException: UnauthorizedException,
  },
  [AUTH_ERROR_CODES.EMAIL_CONFLICT]: {
    message: 'Email already in use',
    httpException: ConflictException,
  },
  [AUTH_ERROR_CODES.USERNAME_CONFLICT]: {
    message: 'Username already in use',
    httpException: ConflictException,
  },
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
    message: 'User not found',
    httpException: UnauthorizedException,
  },
  [AUTH_ERROR_CODES.INTERNAL_ERROR]: {
    message: 'An internal error occurred. Please try again later.',
    httpException: InternalServerErrorException,
  },
};

// Result types
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: AuthErrorCode };

export type SignInResult = AuthResult<{ access_token: string }>;
export type RegisterResult = AuthResult<void>;
export type UpdateProfileResult = AuthResult<void>;

// Utility functions for creating results
export function createSuccessResult<T>(data: T): AuthResult<T> {
  return { success: true, data };
}

export function createVoidSuccessResult(): AuthResult<void> {
  return { success: true, data: undefined };
}

export function createErrorResult(
  code: AuthErrorCode,
  customMessage?: string,
): AuthResult<never> {
  const errorMetadata = AUTH_ERROR_MAP[code];
  return {
    success: false,
    error: customMessage || errorMetadata.message,
    code,
  };
}

// Utility function to convert result to HTTP exception
export function throwHttpExceptionFromResult(result: AuthResult<any>): never {
  if (result.success) {
    throw new Error('Cannot throw exception from successful result');
  }

  const errorMetadata = AUTH_ERROR_MAP[result.code];
  const ExceptionClass = errorMetadata.httpException;
  throw new ExceptionClass(result.error);
}

// Export error utilities for reuse in other modules
export { AUTH_ERROR_CODES as AuthErrorCodes };
