export const formalLabOrder = [
  'Objective',
  'Introduction',
  'Materials',
  'Procedure',
  'Results',
  'Calculations',
  'Discussion',
  'Conclusion',
  'Literature Cited',
];
export const formalLabFormat =
  'Letter-sized white pages; 1-inch margins; 12-point Times New Roman; single spacing. Centre the title about one-third down the title page and put identifying fields at lower right. Leave the back of the title page blank. Procedure and conclusion use impersonal, third-person past tense. Literature Cited goes on a separate final page, alphabetized, with corresponding in-text citations.';

export function physicsLabPrompt(id: string, title: string) {
  const specific =
    id === 'physics-ticker-lab'
      ? 'This is the informal inclined-cart ticker-tape lab. The captured instructions specify 60 dots per second and marks every sixth dot (0.100 s). Confirm that my own timer and marks match. Ask for a clear picture of my tape with a ruler, or my time/position table, the start mark, distance units, incline setup, observations, measurement uncertainty, and any obscured measurements. Never assume an unrecorded (0,0) point. Use consecutive positions for displacement, v = Δd/Δt, and interval midpoint times for the velocity–time plot. Explain the position–time graph, velocity–time fit and acceleration from its slope. Distinguish a fitted slope from a first-to-last estimate. Do not substitute the review-package tape, which uses 0.050 s per dot.'
      : id === 'physics-uniform-lab'
        ? 'This is the Describing Motion formal toy-car investigation: does the car show uniform motion? The available instructions call for at least ten measured intervals, a position/time table, interval-displacement/velocity table, sample interval and total-average velocity calculations, a position–time best fit with graphical and computer slopes, and a velocity–time graph using midpoint times. First confirm those requirements against my actual teacher sheet. Ask for my complete time/position data, origin and direction, actual equipment, procedure, observations, timing/distance uncertainties, and calculations already done. Do not invent extra trials to reach ten intervals. Do not confuse this formal lab with the separate informal sprint lab.'
        : id === 'physics-position-lab'
          ? 'This is Informal Lab 1: Position, Time and Velocity. The captured teacher instructions call for sprint measurements and two hand-drawn graphs; they do not require a formal report. Ask for our group’s distance/time table, the start point, uncertain readings, equipment, observations and the original graph questions. Confirm any partner/group names only if my teacher asks for them. Help interpret our actual position–time and velocity–time graphs.'
          : 'This is a blank formal-report resource, not an experiment or a completed report. First ask which experiment I actually performed and request its teacher instructions, rubric, my measured data and uncertainties, observations, actual procedure and calculations so far. The boiling-point model is a teacher formatting example, not a source of measurements to reuse.';
  return `Help me with my Physics 11 lab: ${title}, for Mr. Wadson at College Heights.\n\nDo not start writing a report. First gather the evidence needed: my measured data (I can upload a picture of the table/tape), observations, teacher instructions/rubric, actual equipment and procedure, required instrument uncertainties, relevant group details only if requested, and calculations I have already done. Ask a small, specific set of questions and wait for my answers.\n\n${specific}\n\nAfter the evidence is available, help one section at a time. Explain and check calculations, units, tables, labelled graphs, uncertainty, results, procedure, conclusion and error analysis where actually required. Use only my own data. Identify missing readings explicitly; never fabricate experimental results, uncertainty, trial counts or a teacher requirement. Do not copy another student’s completed report.\n\nFor a formal report, preserve Wadson’s verified order: ${formalLabOrder.join('; ')}. ${formalLabFormat} Define equation symbols, show one worked sample of each calculation type, put repeated calculations in tables, include units and instrument uncertainty, and connect each discussed error to its effect. Percent error, when there is a justified accepted value, is |experimental − accepted| / |accepted| × 100%; it is a percentage. No universal two-decimal rounding rule is established. Keep extra digits until final rounding. If my supplied teacher instructions differ, flag the difference before proceeding.\n\nBegin by requesting the specific evidence needed for this lab. Wait before drafting anything.`;
}
