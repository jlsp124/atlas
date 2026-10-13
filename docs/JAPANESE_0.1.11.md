# Japanese review 0.1.11

The typed answer input remains mounted and enabled after checking. Check, reveal
and rating pointer actions preserve input focus. Starting and advancing render
and focus synchronously within the user gesture, with `preventScroll`, so a later
effect does not have to reopen the keyboard. Enter checks an answer; an active
IME composition is confirmed before it can submit. Typed responses remain
ephemeral, and the existing review outcomes, adaptive queue and vocabulary are
unchanged.

On mobile, only the active review occupies the visible viewport. Its height and
top follow VisualViewport resize/scroll events, with a dynamic-height/window-size
fallback. The question, input, feedback and rating controls have reserved space;
feedback does not shift the input. The surrounding header, navigation and help
launcher are hidden during the session and return when it ends. The hook does
not scroll the page between cards or change other subjects. Desktop retains its
normal review layout.

The viewport behavior follows the [VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
and [focus with preventScroll](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
contracts. The software keyboard can shrink the visible viewport while the
layout viewport remains unchanged.

## Validation

Browser checks cover complete kana, romaji and Japanese → English sessions,
including longer greetings and a hard card returning. They verify the same DOM
input, no blur before advancing, stable question/input geometry, unchanged page
scroll and controls above the simulated keyboard. Phone runs use touch taps.
Additional checks cover viewport offsets, absence of VisualViewport, IME Enter,
reveal, ending cleanup, narrow recognition/English → Japanese sessions and
accessibility. Existing desktop review, persistence and device-sync tests remain.

These are Chromium browser checks with realistic phone sizes and simulated
keyboard/viewport events. They do not certify the physical iPhone Safari keyboard.
