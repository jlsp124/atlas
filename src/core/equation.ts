// A small expression tree keeps symbols addressable across algebra frames.
// Text and MathML describe the same expression; the teaching layer moves stable tokens.
export type Expr =
  | { kind: 'atom'; id: string; text: string; source?: string }
  | {
      kind: 'op';
      id: string;
      op: '+' | '−' | '×' | '=';
      left: Expr;
      right: Expr;
    }
  | { kind: 'fraction'; id: string; top: Expr; bottom: Expr }
  | { kind: 'square' | 'root' | 'group'; id: string; value: Expr };
export const atom = (id: string, text = id, source?: string): Expr => ({
  kind: 'atom',
  id,
  text,
  source,
});
export const op = (
  id: string,
  operator: '+' | '−' | '×' | '=',
  left: Expr,
  right: Expr,
): Expr => ({ kind: 'op', id, op: operator, left, right });
export const fraction = (id: string, top: Expr, bottom: Expr): Expr => ({
  kind: 'fraction',
  id,
  top,
  bottom,
});
export const square = (value: Expr): Expr => ({
  kind: 'square',
  id: `square-${value.id}`,
  value,
});
export const root = (value: Expr): Expr => ({
  kind: 'root',
  id: 'root',
  value,
});
export const group = (value: Expr): Expr => ({
  kind: 'group',
  id: `group-${value.id}`,
  value,
});
export const symbols: Record<string, string> = {
  vi: 'v_i',
  vf: 'v_f',
  a: 'a',
  d: 'Δd',
  t: 'Δt',
  v: 'v',
};
export const variable = (id: string) =>
  atom(id, symbols[id] ?? id, `value-${id}`);
export function equationText(e: Expr): string {
  if (e.kind === 'atom') return e.text;
  if (e.kind === 'op')
    return `${equationText(e.left)} ${e.op} ${equationText(e.right)}`;
  if (e.kind === 'fraction')
    return `(${equationText(e.top)}) / (${equationText(e.bottom)})`;
  return e.kind === 'square'
    ? `${equationText(e.value)}²`
    : e.kind === 'root'
      ? `√(${equationText(e.value)})`
      : `(${equationText(e.value)})`;
}
export function substitute(e: Expr, known: Record<string, string>): Expr {
  if (e.kind === 'atom')
    return known[e.id] === undefined
      ? e
      : {
          ...e,
          text:
            Number(known[e.id].replace('−', '-')) < 0
              ? `(${known[e.id]})`
              : known[e.id],
        };
  if (e.kind === 'op')
    return {
      ...e,
      left: substitute(e.left, known),
      right: substitute(e.right, known),
    };
  if (e.kind === 'fraction')
    return {
      ...e,
      top: substitute(e.top, known),
      bottom: substitute(e.bottom, known),
    };
  return { ...e, value: substitute(e.value, known) };
}
export type EquationToken = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  width?: number;
  source?: string;
};
function measure(e: Expr): number {
  if (e.kind === 'atom') return Math.max(1.4, [...e.text].length * 0.64);
  if (e.kind === 'op') return measure(e.left) + measure(e.right) + 1.5;
  if (e.kind === 'fraction')
    return Math.max(measure(e.top), measure(e.bottom)) + 1;
  return (
    measure(e.value) +
    (e.kind === 'square'
      ? 0.8
      : e.kind === 'root' && e.value.kind === 'fraction'
        ? 2
        : 1.2)
  );
}
export function layoutEquation(e: Expr) {
  const tokens: EquationToken[] = [],
    width = measure(e);
  function place(node: Expr, x: number, y: number, size = 1) {
    const w = measure(node);
    if (node.kind === 'atom')
      tokens.push({
        id: node.id,
        text: node.text,
        x: x + w / 2,
        y,
        size,
        source: node.source,
      });
    else if (node.kind === 'op') {
      const left = measure(node.left);
      place(node.left, x, y, size);
      tokens.push({ id: node.id, text: node.op, x: x + left + 0.75, y, size });
      place(node.right, x + left + 1.5, y, size);
    } else if (node.kind === 'fraction') {
      place(node.top, x + (w - measure(node.top)) / 2, y - 0.8, size);
      place(node.bottom, x + (w - measure(node.bottom)) / 2, y + 0.8, size);
      tokens.push({
        id: node.id,
        text: '',
        x: x + w / 2,
        y,
        size,
        width: w - 0.3,
      });
    } else {
      const tallRoot = node.kind === 'root' && node.value.kind === 'fraction';
      const inset = node.kind === 'square' ? 0 : tallRoot ? 1.45 : 0.75;
      place(node.value, x + inset, y, size);
      if (node.kind === 'square')
        tokens.push({
          id: node.id,
          text: '2',
          x: x + measure(node.value) + 0.3,
          y: y - 0.55,
          size: size * 0.65,
        });
      if (node.kind === 'root') {
        tokens.push({
          id: node.id,
          text: '√',
          x: x + (tallRoot ? 0.6 : 0.3),
          y,
          size: size * (tallRoot ? 2 : 1.2),
        });
        tokens.push({
          id: 'radical-line',
          text: '',
          x: x + inset + measure(node.value) / 2,
          y: y - (tallRoot ? 1.55 : 0.65),
          size,
          width: measure(node.value),
        });
      }
      if (node.kind === 'group') {
        tokens.push({ id: `${node.id}-open`, text: '(', x: x + 0.2, y, size });
        tokens.push({
          id: `${node.id}-close`,
          text: ')',
          x: x + w - 0.2,
          y,
          size,
        });
      }
    }
  }
  place(e, 0, 0);
  return { tokens, width };
}
