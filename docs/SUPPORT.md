# Atlas Beta support

The product identity is **atlas@jovanpahal.com**, centralized in `src/content/product.ts`. Help/About, feedback confirmation, Privacy, Sources and context-filled email fallbacks use it. Future transactional email should use the Atlas identity once a sending service is configured; this release does not add automated email or send test messages.

Feedback uses the existing private request inbox. The persistent ? control includes public course, unit, assignment, question, step and route automatically. It captures no answers, uploads or other browsing. Suggestions open the same form. Failed/unavailable sends retain the draft and offer an explicit mailto action. The submission is not labelled received until the API confirms it. Drafts remain in the tab's session storage until cleared after sending or the tab closes.

## Mailbox setup remaining

On October 7, the authenticated Hostinger Mail API returned one accessible mailbox, with no `atlas@jovanpahal.com` address. The connector exposes mailbox discovery, mail operations and webhooks, but no mailbox provisioning endpoint. This does not establish whether an alias exists outside the connector's scope, and no email delivery has been verified.

In authenticated Hostinger hPanel, open **Emails → the email plan for jovanpahal.com → Mailboxes → Add mailboxes**, enter **atlas** and a unique password, then **Create**. Use an available mailbox slot; if a purchase is needed, decide that in hPanel. Confirm the mailbox and receiving/sending settings there. [Hostinger's mailbox instructions](https://www.hostinger.com/support/1583217-how-to-create-and-manage-mailboxes-for-hostinger-email/).

Mailbox setup does not block the frontend redesign. The in-app feedback inbox uses the Atlas API independently of email.
