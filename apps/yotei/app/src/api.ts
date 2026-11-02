import { draftFromWire, type PlanDraft, type WireParseResponse } from '@yotei/core';
import { Tokens } from './tokens';

/** The SystemOS backend Yotei signs in to. Release builds set it in eas.json. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://systemos-kappa.vercel.app').replace(/\/$/, '');

export class SignedOutError extends Error {
  constructor() {
    super('Your session ended. Sign in again.');
    this.name = 'SignedOutError';
  }
}

/** FastAPI errors come back as { detail: string | [...] }. */
async function detail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === 'string') return body.detail;
  } catch {
    // not JSON
  }
  return `Request failed (${res.status})`;
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res.ok) throw new Error(await detail(res));
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  await Tokens.set(body.access_token, body.refresh_token);
}

let refreshing: Promise<string> | null = null;

/** One refresh at a time: parallel 401s share it. */
function refresh(): Promise<string> {
  refreshing ??= (async () => {
    const { refresh: token } = await Tokens.get();
    if (!token) throw new SignedOutError();
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    });
    if (!res.ok) {
      await Tokens.clear();
      throw new SignedOutError();
    }
    const body = (await res.json()) as { access_token: string; refresh_token: string };
    await Tokens.set(body.access_token, body.refresh_token);
    return body.access_token;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function authed(path: string, init: RequestInit): Promise<Response> {
  const { access } = await Tokens.get();
  if (!access) throw new SignedOutError();
  const call = (token: string) =>
    fetch(`${API_URL}${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
  const res = await call(access);
  return res.status === 401 ? call(await refresh()) : res;
}

/** POST /api/yotei/parse → a verified PlanDraft. Throws with the backend's own message. */
export async function parsePlan(markdown: string): Promise<PlanDraft> {
  let res: Response;
  try {
    res = await authed('/api/yotei/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    });
  } catch (e) {
    if (e instanceof SignedOutError) throw e;
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  if (!res.ok) throw new Error(await detail(res));
  return draftFromWire((await res.json()) as WireParseResponse);
}
