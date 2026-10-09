# Subject experiences

The October 8, 2026 product brief supersedes the shared interaction contract in
V3. The visual identity, source/privacy boundaries, stable IDs, account sync,
offline access and Physics 0.1.1 experience remain the reference foundation.
Each subject uses the interaction that helps with its actual class material.

- Home is the compact course destination. Mobile uses Home, Calendar, Search
  and You; the course sidebar belongs to desktop. Bottom details are factual,
  not productivity scores. School-year progress measures continuous calendar
  time across the approved district dates, separately from instructional days.
- Physics keeps guided problem solving and its existing controls.
- Life Sciences separates real assignments, teacher notes, Key ideas and
  optional definitions review. Brief question help explains what to include;
  students write on their original assignments. Question and concept backlinks
  preserve the existing checkpoint identities. Factual video blanks may have a
  filled copy only when a trustworthy answer source is available.
- Japanese uses current weekly sets, vocabulary, kana, grammar and adaptive
  review. Reading aids are a display preference. Grammar assignments and
  additional taught kana require actual course evidence. Typed review answers
  are ephemeral; review records contain IDs, outcomes and ratings only.
- Chemistry separates assignments, faithful class notes and labs. Help scales
  with the question. Formal independent hand-ins stay metadata only.

The private source registry, photos and student work never enter the public
repository, static build or Docker context. A recorded material is not proof
that its questions or answers have been reviewed, nor that it was assigned.
Missing source pages and uncertain assignment/date claims stay explicit.

Product analytics remain opt-in and private. Account operations and aggregate
product behavior are separate. No typed answers, tutoring content, files,
messages, secrets or search text belong in product-event payloads. Release
reports use aggregate metadata and approximate active-time buckets.

Publish complete stages individually: run the checks, commit/push, and match
successful verification and live frontend/API release receipts to the exact
commit. See DEPLOYMENT.md for the current production workflow.
