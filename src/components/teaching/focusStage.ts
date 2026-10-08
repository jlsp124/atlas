// Enter the guided workspace with the real question still visible. Keep the
// assignment context above it and avoid hiding the model on short laptops.
export function focusStage(instant = false) {
  requestAnimationFrame(() => {
    const question = document.querySelector<HTMLElement>('.focus-meta');
    if (!question) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({
      top: question.getBoundingClientRect().top + scrollY - 24,
      behavior: reduced || instant ? 'instant' : 'smooth',
    });
  });
}
