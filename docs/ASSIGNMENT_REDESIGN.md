# Assignment-first Atlas Beta

Implemented locally on October 7, 2026, from `6a1d5fc`. The V2 graphite/neutral shell, sidebar, themes, course colors and lowercase identity remain. The course experience now leads to units, material sets and the actual work, with optional explanations beside it.

## The learning experience

- Units list notes, worksheets, textbook work, labs and reviews as compact rows. Type, To do and text filters make the next material easy to find. Completion updates the list directly.
- Assignments open as a complete paper document. Students choose a question, use Next/Back, write on the original assignment, then return to their position in the document. Science walkthroughs have no default answer form.
- Physics highlights the relevant language and numbers, derives implicit values, identifies the unknown, shows why the equation fits, balances/rearranges it, substitutes and checks the resulting units. Persistent equation terms move between their actual positions; values travel from their prompt or related-question source. Direction/sign and reviewed teacher conventions remain explicit.
- Chemistry fills configurations with the actual species/electron count, abbreviates the preceding noble-gas core, builds conversion factors and cancels units. An eight-electron water example retains each electron as bonds and lone pairs develop. The missing molecule list is not invented; the worked example is labelled. Other models explain valence, atomic identity, VSEPR, trends and polarity.
- Biology connects the actual question to evidence and a response on paper. Bounded models include endosymbiosis, half-life, classification, cladograms and undisturbed fossil layers. A model is not presented as a missing classroom figure.
- Japanese retains typed recall, contextual explanation, kana/stroke controls and phrase connections. Due review prioritizes unresolved misses, hints and Hard ratings. Easy returns after four days, Okay after one day and Hard after ten minutes. Self-ratings do not establish mastery.

All 50 existing material entries and 353 contextual checkpoints remain. The 285 science questions currently comprise 60 numeric Physics walkthroughs, 30 configuration walkthroughs, 11 conversion walkthroughs, one labelled Lewis example and 183 paced written/setup guides. The other 68 checkpoints use Japanese recall. Numeric Physics animation is admitted only when the setup agrees with the existing reviewed answer; ambiguous or missing values use the written guide instead. These counts describe presentation coverage, not automatic grading of every class question.

## Motion and product details

Movement uses short, interruptible transitions with persistent diagram/equation objects and reduced-motion support. Prompt extraction, rearrangement, substitution, electron placement, unit cancellation and progress changes explain what changed. On small phones, advancing or restoring a step brings its working into view above the persistent controls. Returning from contextual help restores focus and position.

Actual route waits receive a delayed compact atlas mark; focused-question hydration has a quiet launch/skeleton state. Native route transitions, mobile sheets, focus/hover/pressed states, useful filtered-empty states and a custom 404 are included. There are no artificial loading delays. The surrounding theme remains neutral and the document keeps readable paper/ink contrast in both themes.

A small BETA tag sits by the identity. A persistent ? opens quick feedback with the public course, unit, material, question, step and route already attached. It preserves drafts, distinguishes confirmed receipt from failed/unavailable sends, and offers context-filled email. Help/About, Privacy, Sources and relevant support states use `atlas@jovanpahal.com`. Non-affiliation language lives quietly in About; the former “A few details” block has been removed from normal learning screens. See [Support](SUPPORT.md) for the remaining authenticated mailbox setup.

## Preservation and release boundary

The catalog, source ingestion, stable material/question IDs, original practice engine, account isolation and offline generation remain. The three independent Chemistry hand-ins are still metadata only. No source intake, private files or additional raw school material was needed for this redesign.

An additive `assignment_progress` event stores explicit status, focused-question position and done-on-paper markers. Legacy task history still projects into status. The server checks valid assignment/question membership and restricted-work boundaries. No database migration or new environment variable is needed. Deploy the matching server validator before publishing the client; an older server will reject a sync batch containing the new event. No production publication has been performed for this redesign.

## Verification

Final local gates are recorded in [QA](QA.md). Browser coverage includes the complete science document catalog, actual Physics rearrangement and saved position, persistent electron provenance, configuration totals/core notation, conversion cancellation, Biology evidence, Japanese recall/review, completion, feedback success/failure, 404 search, mobile working visibility, reduced motion, accessibility, account isolation, two-context sync and offline behavior.

The visual pass captured 80 states across 1920×1080, 1440×900, 1366×768, 390×844 and 360×800 in light/dark with no page errors or horizontal overflow. Additional phone inspection refined the compact header, restored-step visibility, Japanese controls and 404 support action. Automated checks and screenshot inspection do not establish live deployment, real classroom figure completeness or email delivery.
