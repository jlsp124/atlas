import { useSyncExternalStore } from 'react';
import { courses, concepts, questions } from '../content/catalog';
import { eventSchema, type LearnerEvent } from '../core/schema';
import { mergeEvents } from '../core/learning';
import { syncBatch } from '../core/sync-batch';

export const API = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path = '') => `${base}/${path.replace(/^\//, '')}`;
type User = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  analytics: boolean;
};
type LocalData = {
  events: LearnerEvent[];
  synced: string[];
  cursor: number;
  lastSync?: string;
  onboarding: boolean;
  analytics: boolean;
};
type ClientState = LocalData & {
  ready: boolean;
  selected: string[];
  theme: 'system' | 'light' | 'dark';
  user: User | null;
  connection: 'local' | 'online' | 'offline' | 'sign-in';
  storageError: boolean;
};
const empty: LocalData = {
  events: [],
  synced: [],
  cursor: 0,
  onboarding: false,
  analytics: false,
};
const initial: ClientState = {
  ...empty,
  ready: false,
  selected: courses.map((c) => c.id),
  theme: 'system',
  user: null,
  connection: API ? 'offline' : 'local',
  storageError: false,
};
let state = initial;
let scope = 'guest';
let device = '';
let csrf = '';
let initialized = false;
let syncing = false;
let signingOut = false;
let sessionGeneration = 0;
let lastEventTime = 0;
const listeners = new Set<() => void>();
const notify = () => {
  for (const f of listeners) f();
};
const key = () => `atlas:v1:${scope}`;
function readLocal(): LocalData {
  try {
    const stored = JSON.parse(
      localStorage.getItem(key()) || 'null',
    ) as LocalData | null;
    if (!stored) return { ...empty };
    const events = (Array.isArray(stored.events) ? stored.events : [])
      .map((e) => eventSchema.safeParse(e))
      .filter((r) => r.success)
      .map((r) => r.data as LearnerEvent);
    return {
      ...empty,
      ...stored,
      events,
      synced: Array.isArray(stored.synced) ? stored.synced : [],
      cursor: Number.isSafeInteger(stored.cursor) ? stored.cursor : 0,
    };
  } catch {
    return { ...empty };
  }
}
function project() {
  const selected = state.events
    .filter((e) => e.type === 'courses_selected')
    .at(-1);
  const theme = state.events.filter((e) => e.type === 'theme_changed').at(-1);
  state = {
    ...state,
    selected:
      selected?.type === 'courses_selected'
        ? selected.payload.courses
        : courses.map((c) => c.id),
    theme: theme?.type === 'theme_changed' ? theme.payload.theme : 'system',
  };
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = state.theme;
    try {
      localStorage.setItem('atlas:theme', state.theme);
    } catch {
      /* Theme can remain in memory. */
    }
  }
}
function persist() {
  try {
    const { events, synced, cursor, lastSync, onboarding, analytics } = state;
    localStorage.setItem(
      key(),
      JSON.stringify({
        events,
        synced,
        cursor,
        lastSync,
        onboarding,
        analytics,
      }),
    );
    state = { ...state, storageError: false };
  } catch {
    state = { ...state, storageError: true };
  }
  notify();
}
export function initialize() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    device = localStorage.getItem('atlas:device') || crypto.randomUUID();
    localStorage.setItem('atlas:device', device);
  } catch {
    device = crypto.randomUUID();
  }
  // This is a local workspace hint, never authentication or admin authority.
  // Keep queued account events in their own scope through offline navigation.
  let remembered: User | null = null;
  if (API)
    try {
      const hint = JSON.parse(
        localStorage.getItem('atlas:last-account') || 'null',
      );
      if (
        hint &&
        typeof hint.id === 'string' &&
        /^[0-9a-f-]{36}$/i.test(hint.id) &&
        typeof hint.username === 'string'
      )
        remembered = {
          id: hint.id,
          username: hint.username,
          role: 'user',
          analytics: false,
        };
    } catch {
      /* Missing or damaged hints leave the guest workspace available. */
    }
  if (remembered) scope = `account:${remembered.id}`;
  state = { ...state, ...readLocal(), user: remembered, ready: true };
  project();
  notify();
  window.addEventListener('storage', (e) => {
    if (e.key === key()) {
      state = { ...state, ...readLocal() };
      project();
      notify();
    }
  });
  window.addEventListener('online', () => {
    void reconnect();
  });
  if (API) {
    void reconnect();
    window.setInterval(() => {
      void reconnect();
    }, 30000);
  }
}
export function useLearner() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    () => state,
    () => initial,
  );
}
export function getState() {
  return state;
}
export function emit(
  type: LearnerEvent['type'],
  payload: LearnerEvent['payload'],
) {
  initialize();
  lastEventTime = Math.max(Date.now(), lastEventTime + 1);
  const event = eventSchema.parse({
    id: crypto.randomUUID(),
    device,
    at: new Date(lastEventTime).toISOString(),
    type,
    payload,
  });
  state = { ...state, events: mergeEvents(state.events, [event]) };
  project();
  persist();
  if (state.user && API) void synchronize();
  return event;
}
export function finishOnboarding() {
  state = { ...state, onboarding: true };
  persist();
}
export function replayOnboarding() {
  state = { ...state, onboarding: false };
  persist();
  window.dispatchEvent(new Event('atlas:onboarding'));
}
export function setAnalytics(enabled: boolean) {
  state = { ...state, analytics: enabled };
  persist();
  if (state.user && API)
    void request('/account/privacy', { analytics: enabled }).catch(() => {});
}
export async function request(
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
) {
  if (!API)
    throw new Error(
      'Online services have not been connected yet. Your local work still works.',
    );
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'x-atlas-client': 'atlas',
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
      keepalive: path === '/analytics',
    });
  } catch {
    state = { ...state, connection: 'offline' };
    notify();
    throw new Error(
      'Online services cannot be reached. Local learning still works.',
    );
  }
  const data = await response.json();
  if (!response.ok) {
    if (
      path !== '/analytics' &&
      state.analytics &&
      typeof window !== 'undefined'
    )
      window.dispatchEvent(
        new CustomEvent('atlas:product-event', {
          detail: {
            type: 'client_error',
            errorCode: 'api-failed',
            success: false,
          },
        }),
      );
    if (response.status === 401 && state.user) {
      state = { ...state, connection: 'sign-in' };
      notify();
    }
    throw new Error(data.error || 'Request failed');
  }
  state = { ...state, connection: 'online' };
  notify();
  return data;
}
function enterAccount(user: User, token: string, importGuest = false) {
  const guestEvents = importGuest ? state.events : [];
  const onboarding = state.onboarding;
  scope = `account:${user.id}`;
  csrf = token;
  try {
    localStorage.setItem(
      'atlas:last-account',
      JSON.stringify({ id: user.id, username: user.username }),
    );
  } catch {
    /* No session token is stored here. */
  }
  state = { ...state, ...readLocal(), user, onboarding, connection: 'online' };
  state = { ...state, events: mergeEvents(state.events, guestEvents) };
  project();
  persist();
}
export async function signIn(
  username: string,
  password: string,
  register = false,
  importGuest = false,
) {
  sessionGeneration++;
  const result = await request(register ? '/auth/register' : '/auth/login', {
    username,
    password,
  });
  // Verify browser cookie acceptance before claiming authenticated sync.
  const confirmed = await request('/session');
  if (!confirmed.user)
    throw new Error(
      'Your browser blocked the session cookie. Guest mode works; use a same-site frontend/API setup for sync.',
    );
  enterAccount(result.user, confirmed.csrf, importGuest);
  await synchronize();
  return result.user as User;
}
export async function signOut() {
  signingOut = true;
  sessionGeneration++;
  try {
    // A remembered account can render before reconnect has loaded its CSRF
    // token. Confirm the cookie's current session before ending it.
    const current = await request('/session');
    if (current.user) {
      csrf = current.csrf;
      await request('/auth/logout', {});
    }
    localStorage.removeItem('atlas:last-account');
    csrf = '';
    scope = 'guest';
    state = {
      ...initial,
      ...readLocal(),
      ready: true,
      connection: API ? 'online' : 'local',
    };
    project();
    notify();
  } finally {
    sessionGeneration++;
    signingOut = false;
  }
}
export async function deleteAccount(password: string) {
  await request('/account', { password }, 'DELETE');
  localStorage.removeItem(key());
  localStorage.removeItem('atlas:last-account');
  csrf = '';
  scope = 'guest';
  state = { ...initial, ...readLocal(), ready: true };
  project();
  notify();
}
export async function reconnect() {
  if (!API || syncing || signingOut) return;
  const generation = sessionGeneration;
  try {
    const result = await request('/session');
    if (generation !== sessionGeneration || signingOut) return;
    if (result.user) {
      if (!state.user || state.user.id !== result.user.id)
        enterAccount(result.user, result.csrf);
      else {
        csrf = result.csrf;
        state = { ...state, user: result.user };
        notify();
      }
      await synchronize();
    } else if (state.user) {
      state = { ...state, connection: 'sign-in' };
      notify();
    }
  } catch {
    /* A failed connection never discards local events. */
  }
}
export async function synchronize() {
  if (syncing || !state.user || !API || !csrf) return;
  syncing = true;
  const owner = state.user.id;
  try {
    await request('/account/privacy', { analytics: state.analytics });
    let more = true;
    let rounds = 0;
    while (more && rounds++ < 30) {
      const pending = syncBatch(
        state.events.filter((e) => !state.synced.includes(e.id)),
      );
      const result = await request('/sync', {
        events: pending,
        cursor: state.cursor,
      });
      if (state.user?.id !== owner) break;
      const incoming = (result.events as unknown[]).map((e) =>
        eventSchema.parse(e),
      );
      state = {
        ...state,
        events: mergeEvents(state.events, incoming),
        synced: [
          ...new Set([
            ...state.synced,
            ...result.accepted,
            ...incoming.map((e) => e.id),
          ]),
        ],
        cursor: result.cursor,
        lastSync: new Date().toISOString(),
        connection: 'online',
      };
      project();
      persist();
      more =
        result.hasMore ||
        state.events.some((e) => !state.synced.includes(e.id));
    }
  } catch {
    /* Unsynced events remain queued; retry on reconnect. */
  } finally {
    syncing = false;
  }
}
export function track(type: string, course?: string, concept?: string) {
  if (!state.analytics || !API) return;
  // The collector validates a strict public-metadata allowlist. No learner payload is copied.
  void import('./analytics').then(({ trackProduct }) => {
    trackProduct(type as import('../core/product-analytics').ProductEventType, {
      ...(course
        ? {
            course:
              course as import('../core/product-analytics').ProductMetadata['course'],
          }
        : {}),
      ...(concept ? { concept } : {}),
    });
  });
}
export function exportProgress() {
  const blob = new Blob(
    [JSON.stringify({ version: 1, events: state.events }, null, 2)],
    { type: 'application/json' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'atlas-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
export async function importProgress(file: File) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error('Import must be smaller than 10 MB');
  const data = JSON.parse(await file.text());
  if (
    data.version !== 1 ||
    !Array.isArray(data.events) ||
    data.events.length > 30000
  )
    throw new Error('Unsupported progress export');
  const events: LearnerEvent[] = data.events.map((e: unknown) =>
    eventSchema.parse(e),
  );
  for (const e of events) {
    const id = 'concept' in e.payload ? e.payload.concept : undefined;
    if (id && !concepts.some((c) => c.id === id))
      throw new Error('Import refers to a concept not in this version');
  }
  for (const e of events)
    if (
      e.type === 'question_answered' &&
      !questions.some((q) => q.id === e.payload.question)
    )
      throw new Error('Import refers to an unknown question');
  state = { ...state, events: mergeEvents(state.events, events) };
  project();
  persist();
}
