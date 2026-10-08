import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return reduced;
}
// FLIP snapshots are bounded to the current question, never the whole assignment.
// New tokens can copy a named source; existing tokens retain their DOM and identity.
export function useTeachingMotion(
  ref: RefObject<HTMLDivElement | null>,
  frame: string | number,
) {
  const reduced = useReducedMotion();
  const previous = useRef(
    new Map<string, { x: number; y: number; text: string }>(),
  );
  const animations = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    animations.current.forEach((a) => a.cancel());
    animations.current = [];
    const stage = ref.current;
    if (!stage) return;
    const root = stage.getBoundingClientRect();
    const nodes = [...stage.querySelectorAll<HTMLElement>('[data-motion]')];
    const next = new Map<string, { x: number; y: number; text: string }>();
    const positions = new Map(
      nodes.map((el) => {
        const box = el.getBoundingClientRect();
        return [
          el.dataset.motion!,
          { x: box.left - root.left, y: box.top - root.top },
        ];
      }),
    );
    for (const el of nodes) {
      if (el.dataset.active === 'false') continue;
      const id = el.dataset.motion!,
        to = positions.get(id)!;
      const prior = previous.current.get(id);
      const copy = el.dataset.copy === 'true' && prior?.text !== el.textContent;
      const from =
        (copy && el.dataset.origin
          ? positions.get(el.dataset.origin)
          : prior) ??
        (el.dataset.origin ? positions.get(el.dataset.origin) : undefined);
      next.set(id, { ...to, text: el.textContent ?? '' });
      if (
        reduced ||
        matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !el.animate
      )
        continue;
      const transform = getComputedStyle(el).transform;
      const end = transform === 'none' ? '' : transform;
      if (
        from &&
        (Math.abs(from.x - to.x) > 2 || Math.abs(from.y - to.y) > 2)
      ) {
        animations.current.push(
          el.animate(
            [
              {
                transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) ${end}`,
              },
              { transform: end || 'none' },
            ],
            { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' },
          ),
        );
      } else if (!previous.current.has(id))
        animations.current.push(
          el.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 180 }),
        );
    }
    previous.current = next;
    return () => {
      animations.current.forEach((a) => a.cancel());
    };
  }, [frame, reduced]);
  return reduced;
}
