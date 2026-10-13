import { useLayoutEffect, type RefObject } from 'react';

/** The keyboard shrinks the visual viewport, not necessarily the layout viewport.
 * https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
 * This only runs for an active review; it never scrolls or focuses between cards.
 */
export function useJapaneseReviewViewport(
  root: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useLayoutEffect(() => {
    const surface = root.current;
    if (!active || !surface) return;
    const mobile = matchMedia('(max-width: 800px)');
    const viewport = window.visualViewport;
    let frame = 0;
    function update() {
      if (mobile.matches) {
        document.documentElement.dataset.japaneseReview = 'open';
        surface!.style.setProperty(
          '--jp-review-height',
          `${viewport?.height ?? innerHeight}px`,
        );
        surface!.style.setProperty(
          '--jp-review-top',
          `${viewport?.offsetTop ?? 0}px`,
        );
      } else delete document.documentElement.dataset.japaneseReview;
    }
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    mobile.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mobile.removeEventListener('change', schedule);
      delete document.documentElement.dataset.japaneseReview;
    };
  }, [root, active]);
}
