import { useEffect, useState } from 'react';
import { workspaceCourses } from '../content/workspaces';
import {
  API,
  deleteAccount,
  emit,
  exportProgress,
  importProgress,
  replayOnboarding,
  setAnalytics,
  signIn,
  signOut,
  synchronize,
  url,
  useLearner,
} from '../client/store';
import { CourseMark, Icon } from './Icons';
export default function Account() {
  const state = useLearner(),
    [register, setRegister] = useState(false),
    [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [bring, setBring] = useState(true),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [deletion, setDeletion] = useState(false);
  useEffect(() => {
    setRegister(new URLSearchParams(location.search).has('create'));
  }, []);
  const pending = state.events.filter(
    (e) => !state.synced.includes(e.id),
  ).length;
  async function act(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(done);
      setPassword('');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-screen">
      <div className="screen-heading">
        <div>
          <p className="meta">A little more yours</p>
          <h1>Your setup</h1>
        </div>
      </div>
      <div className="settings-grid">
        <section>
          <h2>Your courses</h2>
          <div className="course-picks">
            {workspaceCourses.map((c) => (
              <label className="course-pick" key={c.id}>
                <CourseMark course={c.id} />
                <span>{c.title}</span>
                <input
                  type="checkbox"
                  disabled={!state.ready}
                  checked={state.selected.includes(c.id)}
                  onChange={(e) =>
                    emit('courses_selected', {
                      courses: e.target.checked
                        ? [...state.selected, c.id]
                        : state.selected.filter((x) => x !== c.id),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <section className="settings-section">
            <h2>Appearance</h2>
            <label>
              Theme
              <select
                disabled={!state.ready}
                value={state.theme}
                onChange={(e) =>
                  emit('theme_changed', {
                    theme: e.target.value as 'system' | 'light' | 'dark',
                  })
                }
              >
                <option value="system">Follow system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </section>
          <details className="settings-section">
            <summary>Your data</summary>
            <p>
              Keep a backup of your progress or bring one from another browser.
            </p>
            <div className="button-row">
              <button className="secondary" onClick={exportProgress}>
                Export progress
              </button>
              <label className="file-label">
                Import progress
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      void act(() => importProgress(f), 'Progress imported.');
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <button
              className="quiet"
              onClick={() => {
                replayOnboarding();
                location.href = url();
              }}
            >
              Replay introduction
            </button>
            <p className="small muted">
              On a shared computer, sign out when you finish. Your guest and
              account progress stay separate.
            </p>
          </details>
          <details className="settings-section">
            <summary>Privacy</summary>
            <label className="check-line">
              <input
                type="checkbox"
                checked={state.analytics}
                disabled={!state.ready}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Share minimal usage to help improve atlas
            </label>
            <p className="small muted">
              Optional. Typed answers, searches, passwords and private homework
              aren’t sent to analytics.
            </p>
            <a href={url('privacy/')}>Privacy details</a>
          </details>
        </section>
        <aside className="account-panel">
          <h2>
            {state.user ? `Hi, ${state.user.username}.` : 'Save your setup'}
          </h2>
          <p>Your classes and progress stay synced on your other devices.</p>
          {state.user && state.connection !== 'sign-in' ? (
            <>
              <p className="sync-status" role="status">
                {state.connection === 'offline'
                  ? 'Saved on this device · waiting to sync'
                  : pending
                    ? `${pending} changes waiting to sync`
                    : 'Progress synced'}
              </p>
              <div className="button-row">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void act(synchronize, 'Sync checked.')}
                >
                  Sync now
                </button>
                <button
                  className="quiet"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      signOut,
                      'Signed out. Your guest setup is restored.',
                    )
                  }
                >
                  Sign out
                </button>
              </div>
              {state.user.role === 'admin' && (
                <a className="quiet" href={url('admin/')}>
                  Open admin
                  <Icon name="arrow" size={16} />
                </a>
              )}
              <details className="settings-section">
                <summary>Account controls</summary>
                <button
                  className="quiet danger"
                  onClick={() => setDeletion((d) => !d)}
                >
                  Delete account
                </button>
                {deletion && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(
                        () => deleteAccount(password),
                        'Account deleted.',
                      );
                    }}
                  >
                    <p>
                      This permanently deletes your account and its server data.
                      Your separate guest progress stays here.
                    </p>
                    <label>
                      Confirm with your password
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </label>
                    <button className="secondary danger" disabled={busy}>
                      Permanently delete my account
                    </button>
                  </form>
                )}
              </details>
            </>
          ) : API ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  () =>
                    signIn(username, password, register, !state.user && bring),
                  'Signed in.',
                );
              }}
            >
              {state.connection === 'sign-in' && (
                <p className="scope-note">
                  Sign in again to sync the progress saved on this device.
                </p>
              )}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={!register ? 'active' : ''}
                  disabled={!state.ready}
                  onClick={() => setRegister(false)}
                >
                  Sign in
                </button>
                {!state.user && (
                  <button
                    type="button"
                    className={register ? 'active' : ''}
                    disabled={!state.ready}
                    onClick={() => setRegister(true)}
                  >
                    Create account
                  </button>
                )}
              </div>
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!state.ready}
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9_]+"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!state.ready}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  minLength={register ? 12 : 1}
                  maxLength={128}
                />
              </label>
              <p className="small muted">
                {register ? 'At least 12 characters. ' : ''}Keep it somewhere
                safe; password recovery isn’t available yet.
              </p>
              {!state.user && (
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={bring}
                    onChange={(e) => setBring(e.target.checked)}
                  />
                  Bring my progress from this device
                </label>
              )}
              <button className="primary" disabled={busy || !state.ready}>
                {busy ? 'Connecting…' : register ? 'Create account' : 'Sign in'}
              </button>
            </form>
          ) : (
            <p className="service-note">
              Account sync isn’t connected here yet. Your setup and progress
              stay on this device.
            </p>
          )}
          <p className="status-message" role="status">
            {message}
          </p>
        </aside>
      </div>
    </div>
  );
}
