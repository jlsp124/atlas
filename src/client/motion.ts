import { useLayoutEffect, useRef, type RefObject } from 'react';

type Position = { rect: DOMRect; text: string; visible: boolean };
const timing = { duration: 340, easing: 'cubic-bezier(.22, .7, .2, 1)' };

/** Move the actual destination from its previous location or its visible source.
 * No timers, detached clones, spring bounce or delayed input locks.
 */
export function useContinuity(
  root: RefObject<HTMLElement | null>,
  step: number,
) {
  const previous = useRef(new Map<string, Position>());
  const viewport = useRef({ width: 0, x: 0, y: 0 });
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animations: Animation[] = [];
    const next = new Map<string, Position>();
    const resized =
      viewport.current.width !== 0 &&
      viewport.current.width !== window.innerWidth;
    for (const node of container.querySelectorAll<HTMLElement>(
      '[data-move-id]',
    )) {
      const id = node.dataset.moveId!;
      const rect = node.getBoundingClientRect();
      const visible = node.dataset.on !== 'false';
      const text = node.textContent ?? '';
      const last = previous.current.get(id);
      next.set(id, { rect, visible, text });
      if (reduced || resized || !visible || !previous.current.size) continue;
      const originId = node.dataset.origin;
      const source = originId
        ? [...container.querySelectorAll<HTMLElement>('[data-origin-id]')].find(
            (el) => el.dataset.originId === originId,
          )
        : undefined;
      const from =
        last?.visible && last.text === text
          ? {
              x: last.rect.x + viewport.current.x - window.scrollX,
              y: last.rect.y + viewport.current.y - window.scrollY,
            }
          : source?.getBoundingClientRect();
      if (
        from &&
        (Math.abs(from.x - rect.x) > 1 || Math.abs(from.y - rect.y) > 1)
      ) {
        animations.push(
          node.animate(
            [
              {
                transform: `translate(${from.x - rect.x}px, ${from.y - rect.y}px)`,
                opacity: 0.65,
              },
              { transform: 'translate(0, 0)', opacity: 1 },
            ],
            timing,
          ),
        );
      } else if (!last?.visible || last.text !== text) {
        animations.push(
          node.animate(
            [
              { opacity: 0, transform: 'translateY(5px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { ...timing, duration: 200 },
          ),
        );
      }
    }
    previous.current = next;
    viewport.current = {
      width: window.innerWidth,
      x: window.scrollX,
      y: window.scrollY,
    };
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [root, step]);
}
