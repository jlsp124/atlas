// Student-facing explanations; the source catalog and learning IDs stay unchanged.
export const representationCopy: Record<string, string> = {
  'unit-cancellation':
    'Choose a conversion factor that cancels the starting unit and leaves the unit you want.',
  'powered-units':
    'Square the whole conversion factor when the unit is squared.',
  'scientific-notation':
    'For a nonzero number, the coefficient’s magnitude is at least 1 and less than 10. The power of ten sets the scale.',
  'graph-slope': 'Compare the vertical change with the horizontal change.',
  velocity: 'Divide signed displacement by the time it took.',
  acceleration: 'Divide the change in velocity by the time it took.',
  'kinematic-equations':
    'These work when acceleration stays constant. Choose the relation that leaves out the quantity you don’t have.',
  'half-life':
    'Each half-life halves the remaining parent. Multiply the number of half-lives by the half-life to find the age.',
};
export const representationFormulas: Record<string, string> = {
  'powered-units': String.raw`\left(\frac{1\,\mathrm{m}}{100\,\mathrm{cm}}\right)^2=\frac{1\,\mathrm{m}^2}{10{,}000\,\mathrm{cm}^2}`,
  'kinematic-equations': String.raw`\begin{aligned}v_f&=v_i+at\\\Delta x&=v_i t+\tfrac12 at^2\\v_f^2&=v_i^2+2a\Delta x\end{aligned}`,
};
export const exampleSteps: Record<string, string[]> = {
  'kinematic-equations': [
    'Need final velocity, with initial velocity, acceleration and time known.',
    'Final velocity is 2 + 3 × 4 = 14 m/s.',
  ],
};
