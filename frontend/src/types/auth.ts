export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
  /** Backend enum name, e.g. ROLE_USER / ROLE_ADMIN */
  role?: string;
  belt?: string;
  xp?: number;
  coins?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
  tokenType?: string;
}

export interface AuthResponseData extends AuthTokens {
  user: AuthUser;
}

export interface RegisterResponseData {
  message: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  code?: string;
  status?: number;
  message?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorBody;
  timestamp?: string;
}

export class ApiClientError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  code?: string;

  constructor(
    message: string,
    status: number,
    opts?: { fieldErrors?: Record<string, string>; code?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.fieldErrors = opts?.fieldErrors;
    this.code = opts?.code;
  }
}
