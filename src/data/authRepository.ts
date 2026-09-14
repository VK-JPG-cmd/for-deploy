
import { saveAuthSession } from '../utils/authStorage';
import { getAuthBaseUrl, getFallbackUrls, setResolvedHost } from '../config/apiConfig';
import { Storage } from '../utils/storage';

const getBaseUrl = () => getAuthBaseUrl();

async function fetchWithTimeout(urlPath: string, options: any, timeout = 25000): Promise<Response> {
  const base = getBaseUrl();
  const url = urlPath.startsWith('http') ? urlPath : `${base}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    console.error(`[Auth] Network fetch error for ${url}:`, err);
    throw err;
  }
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  user_id: number;
  parent_name: string;
  token_type: string;
  access_token: string;
}

export interface AuthError {
  message: string;
  field?: string; // 'email' | 'password' | 'general'
}

/**
 * Sends login credentials to the Parental Control backend.
 * The backend validates:
 *  - Email must end with @gmail.com
 *  - Password is verified against the bcrypt hash stored in Neon PostgreSQL
 *
 * Returns a LoginResponse on success, or throws an AuthError on failure.
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  let loginData: LoginResponse;
  const cleanEmail = payload.email.trim().toLowerCase();
  const usernamePrefix = cleanEmail.split('@')[0];

  try {
    let response = await fetchWithTimeout(`${getBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        username: cleanEmail,
        user_name: usernamePrefix,
        password: payload.password,
      }),
    });

    // Fallback if backend FastAPI server expects x-www-form-urlencoded (OAuth2PasswordRequestForm)
    if (response.status === 422 || response.status === 415) {
      const formDetails = new URLSearchParams();
      formDetails.append('username', cleanEmail);
      formDetails.append('password', payload.password);
      response = await fetchWithTimeout(`${getBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: formDetails.toString(),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422 && Array.isArray(data.detail)) {
        const firstError = data.detail[0];
        const field = firstError?.loc?.[1] ?? 'general';
        const msg: string = firstError?.msg ?? 'Validation error.';
        throw { message: msg.replace('Value error, ', ''), field } as AuthError;
      }
      throw {
        message: data.detail ?? 'Invalid email or password. Access denied.',
        field: 'general',
      } as AuthError;
    }

    // Guard: reject any response body that explicitly signals failure (even on HTTP 200)
    if ((data as any).status === 'error') {
      throw {
        message: (data as any).detail ?? 'Invalid email or password.',
        field: 'general',
      } as AuthError;
    }

    loginData = data as LoginResponse;
  } catch (networkError) {
    // If it's a validation/auth failure thrown by us in try block, rethrow it
    if ((networkError as any).field) {
      throw networkError;
    }
    console.error('[Auth] Server offline or database connection failed during login:', networkError);
    throw {
      message: 'Authentication server is currently offline or unreachable. Please try again later.',
      field: 'general',
    } as AuthError;
  }

  await saveAuthSession(loginData.access_token, loginData.user_id, loginData.parent_name);
  return loginData;
}

/**
 * Registers a new parent account on the backend table apt_users_b.
 */
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ status: string; message: string; user_id: number }> {
  let response: Response;
  const cleanEmail = payload.email.trim().toLowerCase();
  const usernamePrefix = cleanEmail.split('@')[0];

  try {
    response = await fetchWithTimeout(`${getBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: usernamePrefix,
        name: payload.name.trim(),
        full_name: payload.name.trim(),
        email: cleanEmail,
        password: payload.password,
        password_hash: payload.password,
        role: 'PARENT',
      }),
    });
  } catch (err) {
    console.error('[Auth] Server offline or database connection failed during registration:', err);
    throw {
      message: 'Registration server is currently offline or unreachable. Please try again later.',
      field: 'general',
    } as AuthError;
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    const txt = await response.text().catch(() => '');
    data = { detail: txt || 'Server error during registration.' };
  }

  if (!response.ok) {
    if (response.status === 422 && Array.isArray(data.detail)) {
      const firstError = data.detail[0];
      const field = firstError?.loc?.[1] ?? 'general';
      const msg: string = firstError?.msg ?? 'Validation error.';
      throw { message: msg.replace('Value error, ', ''), field } as AuthError;
    }
    throw {
      message: data.detail ?? 'Registration failed. Please try again.',
      field: 'general',
    } as AuthError;
  }

  const assignedId = data?.user_id || Math.floor(Math.random() * 8999) + 1000;
  await Storage.saveRegisteredAccount({
    name: payload.name.trim(),
    email: cleanEmail,
    password: payload.password,
    user_id: assignedId,
  });

  return data;
}
