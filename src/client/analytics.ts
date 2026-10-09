import { API, base, getState, request } from './store';
import { atlasVersion } from '../content/product';
import {
  activeTimeSeconds,
  productEventTypes,
  productMetadataSchema,
  publicRoute,
  routeMetadata,
  type ProductEventType,
  type ProductMetadata,
} from '../core/product-analytics';

type Visit = {
  id: string;
  actor: string;
  last: number;
  route: string;
  version: string;
};
let running = false;
let current: Visit | null = null;
let sending = false;
let lastInteraction = 0;
let previousTick = 0;
let started = false;
let transientVisitor = '';
const activityTypes = new Set<ProductEventType>([
  'route_activity',
  'route_exited',
  'route_performance',
]);
const consented = () => {
  const state = getState();
  return (
    !!API &&
    state.analytics &&
    state.ready &&
    (!state.user || state.connection === 'online')
  );
};
export function deviceClass() {
  return window.innerWidth <= 640
    ? 'mobile'
    : window.innerWidth <= 1024
      ? 'tablet'
      : 'desktop';
}
function visitor() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('atlas:analytics-visitor') || 'null',
    );
    if (
      saved &&
      typeof saved.id === 'string' &&
      /^[0-9a-f-]{36}$/i.test(saved.id) &&
      typeof saved.created === 'number' &&
      Date.now() - saved.created < 30 * 86400000
    )
      return saved.id as string;
    const value = { id: crypto.randomUUID(), created: Date.now() };
    localStorage.setItem('atlas:analytics-visitor', JSON.stringify(value));
    return value.id;
  } catch {
    transientVisitor ||= crypto.randomUUID();
    return transientVisitor;
  }
}
function session(active = false) {
  const actor = getState().user?.id ?? 'guest';
  const now = Date.now();
  const route = publicRoute(window.location.pathname, base);
  if (!current) {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem('atlas:analytics-session') || 'null',
      );
      if (
        saved &&
        saved.actor === actor &&
        saved.version === atlasVersion &&
        typeof saved.last === 'number' &&
        now - saved.last < 30 * 60000 &&
        typeof saved.id === 'string' &&
        /^[0-9a-f-]{36}$/i.test(saved.id)
      )
        current = saved;
    } catch {
      /* Analytics can work without browser persistence. */
    }
  }
  if (
    !current ||
    current.actor !== actor ||
    current.version !== atlasVersion ||
    now - current.last >= 30 * 60000
  ) {
    current = {
      id: crypto.randomUUID(),
      actor,
      last: now,
      route,
      version: atlasVersion,
    };
    started = false;
  }
  if (active) current.last = now;
  try {
    sessionStorage.setItem('atlas:analytics-session', JSON.stringify(current));
  } catch {
    /* No private content or authentication lives here. */
  }
  return current;
}
export function trackProduct(
  type: ProductEventType,
  metadata: ProductMetadata = {},
) {
  if (typeof window === 'undefined' || !consented()) return;
  const parsed = productMetadataSchema.safeParse(metadata);
  if (!parsed.success || !productEventTypes.includes(type)) return;
  const route = publicRoute(window.location.pathname, base);
  if (route === '/admin/') return;
  const visit = session(
    (!activityTypes.has(type) &&
      type !== 'session_started' &&
      type !== 'client_error') ||
      type === 'route_activity',
  );
  const payload = {
    id: crypto.randomUUID(),
    session: visit.id,
    visitor: visitor(),
    type,
    version: atlasVersion,
    device: deviceClass(),
    consent: true,
    route,
    ...routeMetadata(route),
    ...parsed.data,
  };
  void request('/analytics', payload).catch(() => {
    /* Optional analytics never block schoolwork or persist private request content. */
  });
}
export function startProductAnalytics() {
  if (running || typeof window === 'undefined') return () => {};
  running = true;
  lastInteraction = Date.now();
  previousTick = Date.now();
  let routeRecorded = false;
  let recordedSession = current?.id;
  let performanceRecorded = false;
  let wasConsented = false;
  const recordVisit = () => {
    if (!consented()) {
      if (wasConsented) {
        current = null;
        started = false;
        routeRecorded = false;
        performanceRecorded = false;
        try {
          sessionStorage.removeItem('atlas:analytics-session');
          localStorage.removeItem('atlas:analytics-visitor');
        } catch {
          /* Consent withdrawal still stops every new event. */
        }
      }
      wasConsented = false;
      return;
    }
    wasConsented = true;
    if (
      document.visibilityState !== 'visible' ||
      !document.hasFocus() ||
      Date.now() - lastInteraction >= 60000
    )
      return;
    if (publicRoute(window.location.pathname, base) === '/admin/') return;
    const visit = session();
    if (visit.id !== recordedSession) {
      routeRecorded = false;
      recordedSession = visit.id;
    }
    if (!started) {
      trackProduct('session_started');
      started = true;
    }
    if (!routeRecorded) {
      const route = publicRoute(window.location.pathname, base);
      const previousRoute = publicRoute(visit.route);
      void request('/analytics', {
        id: crypto.randomUUID(),
        session: visit.id,
        visitor: visitor(),
        type: 'route_viewed',
        version: atlasVersion,
        device: deviceClass(),
        consent: true,
        route,
        ...(previousRoute !== route ? { previousRoute } : {}),
        ...routeMetadata(route),
      }).catch(() => {});
      const meta = routeMetadata(route);
      if (meta.material)
        trackProduct(
          meta.feature === 'notes'
            ? 'notes_opened'
            : meta.feature === 'labs'
              ? 'lab_opened'
              : 'assignment_opened',
          meta,
        );
      else if (meta.concept) trackProduct('key_idea_opened', meta);
      else if (meta.course) trackProduct('course_opened', meta);
      if (meta.feature && !meta.material && !meta.concept)
        trackProduct('feature_entered', meta);
      visit.route = route;
      try {
        sessionStorage.setItem(
          'atlas:analytics-session',
          JSON.stringify(visit),
        );
      } catch {
        /* Optional. */
      }
      routeRecorded = true;
    }
    if (!performanceRecorded) {
      const nav = performance.getEntriesByType('navigation')[0] as
        PerformanceNavigationTiming | undefined;
      if (nav && nav.domContentLoadedEventEnd > 0) {
        const ms = nav.domContentLoadedEventEnd;
        trackProduct('route_performance', {
          durationBucket:
            ms < 1000
              ? 'under-1s'
              : ms < 3000
                ? '1-3s'
                : ms < 10000
                  ? '3-10s'
                  : '10s-plus',
        });
        performanceRecorded = true;
      }
    }
  };
  const pulse = () => {
    recordVisit();
    const now = Date.now();
    const activeSeconds = activeTimeSeconds(
      previousTick,
      now,
      lastInteraction,
      document.visibilityState === 'visible',
      document.hasFocus(),
    );
    previousTick = now;
    if (activeSeconds && !sending && consented()) {
      sending = true;
      trackProduct('route_activity', {
        activeSeconds: activeSeconds as 5 | 10 | 15 | 20 | 25 | 30,
      });
      sending = false;
    }
  };
  const interaction = () => {
    lastInteraction = Date.now();
  };
  const focus = () => {
    previousTick = Date.now();
    lastInteraction = Date.now();
    recordVisit();
  };
  const suspend = () => {
    pulse();
    previousTick = Date.now();
    trackProduct(
      'route_exited',
      routeMetadata(publicRoute(window.location.pathname, base)),
    );
  };
  const visibility = () => {
    if (document.visibilityState === 'hidden') suspend();
    else focus();
  };
  const custom = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (
      !detail ||
      typeof detail.type !== 'string' ||
      !productEventTypes.includes(detail.type) ||
      activityTypes.has(detail.type)
    )
      return;
    const { type, ...metadata } = detail;
    trackProduct(type, metadata);
  };
  const click = (event: MouseEvent) => {
    interaction();
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>(
      '[data-atlas-feature],a[href]',
    );
    if (!target) return;
    if (target.dataset.atlasFeatureManaged === 'true') return;
    const feature = target.dataset.atlasFeature;
    if (feature) {
      const parsed = productMetadataSchema.safeParse({ feature });
      if (parsed.success)
        trackProduct(
          feature === 'notes'
            ? 'notes_opened'
            : feature === 'labs'
              ? 'lab_opened'
              : feature === 'key-ideas'
                ? 'key_idea_opened'
                : 'feature_entered',
          parsed.data,
        );
    }
    if (target instanceof HTMLAnchorElement) {
      try {
        const link = new URL(target.href, window.location.href);
        if (link.origin !== window.location.origin) return;
        const meta = routeMetadata(publicRoute(link.pathname, base));
        if (meta.feature && !feature) trackProduct('feature_entered', meta);
        if (
          publicRoute(link.pathname, base) !==
          publicRoute(window.location.pathname, base)
        ) {
          pulse();
          trackProduct('route_exited');
        }
      } catch {
        /* Invalid links are not analytics payloads. */
      }
    }
  };
  const error = () => {
    trackProduct('client_error', {
      errorCode: 'runtime-error',
      success: false,
    });
  };
  const rejection = () => {
    trackProduct('client_error', {
      errorCode: 'unhandled-rejection',
      success: false,
    });
  };
  const timer = window.setInterval(pulse, 15000);
  document.addEventListener('pointerdown', interaction, { passive: true });
  document.addEventListener('keydown', interaction);
  document.addEventListener('scroll', interaction, {
    passive: true,
    capture: true,
  });
  document.addEventListener('click', click);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('focus', focus);
  window.addEventListener('blur', suspend);
  window.addEventListener('pagehide', suspend);
  window.addEventListener('atlas:product-event', custom);
  window.addEventListener('error', error);
  window.addEventListener('unhandledrejection', rejection);
  recordVisit();
  return () => {
    pulse();
    window.clearInterval(timer);
    document.removeEventListener('pointerdown', interaction);
    document.removeEventListener('keydown', interaction);
    document.removeEventListener('scroll', interaction, true);
    document.removeEventListener('click', click);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('focus', focus);
    window.removeEventListener('blur', suspend);
    window.removeEventListener('pagehide', suspend);
    window.removeEventListener('atlas:product-event', custom);
    window.removeEventListener('error', error);
    window.removeEventListener('unhandledrejection', rejection);
    running = false;
  };
}
