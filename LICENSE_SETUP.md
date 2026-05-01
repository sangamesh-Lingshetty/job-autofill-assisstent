# JobFill Pro License Setup

## Current approach

This version uses a very simple direct license flow:

- no backend
- no Supabase
- no user accounts
- no authentication system

The extension stores Pro state in `chrome.storage.local` only:

- `isPro`
- `licenseKey`
- `lastValidatedAt`

## Product separation

If you sell multiple Lemon Squeezy products, you should filter licenses by product.

Current file:

- [background.js](/d:/others/autoFillform/background.js)

Use:

- `JOBFILL_PRODUCT_ID` for product-level separation
- `JOBFILL_VARIANT_ID` only if you want to separate plans inside the same product later

Recommended simple setup:

- set `JOBFILL_PRODUCT_ID`
- leave `JOBFILL_VARIANT_ID` empty for now

That means:

- DeepLock key: rejected
- JobFill key: accepted

If you later create multiple JobFill plans under the same product, then start checking `variant_id` too.

## How activation and validation work

The extension talks to Lemon Squeezy directly from the background service worker.

Current file:

- [background.js](/d:/others/autoFillform/background.js)

First-time activation uses:

```text
POST https://api.lemonsqueezy.com/v1/licenses/activate
```

It sends:

```text
license_key=<the key the user pasted>
instance_name=<generated local instance label>
```

If activation succeeds:

- `isPro = true`
- `licenseKey = <saved key>`
- `licenseInstanceId = <saved Lemon instance id>`
- `lastValidatedAt = Date.now()`

Silent rechecks later use:

```text
POST https://api.lemonsqueezy.com/v1/licenses/validate
```

It sends:

```text
license_key=<saved key>
instance_id=<saved instance id>
```

If Lemon returns invalid:

- `isPro = false`
- `licenseKey = ""`
- `licenseInstanceId = ""`
- `lastValidatedAt = 0`

The extension also rejects keys when Lemon says they are valid but they belong to the wrong `product_id` or `variant_id`.

## Silent daily revalidation

On popup open and extension startup:

1. Read `lastValidatedAt`
2. If it is still within 24 hours:
   - trust cached Pro state
3. If older than 24 hours:
   - validate the saved key again silently
4. If invalid:
   - remove Pro access automatically

This does not interrupt the user unless the key is no longer valid.

## Popup flow

The popup includes:

- `Enter your code`
- license input
- `Activate` button

Files:

- [popup.html](/d:/others/autoFillform/popup.html)
- [popup.js](/d:/others/autoFillform/popup.js)

## Limits

- free users still have the daily autofill limit
- Pro users bypass the daily autofill limit

The core autofill engine itself is unchanged.

## Important security note

This is intentionally an early-stage simple setup.

It is easy to ship and maintain, but it is not as secure as a backend-based system because validation happens from inside the extension.

If stronger protection is needed later, the next step is:

- move validation behind a backend
- keep the Lemon Squeezy secret off the client
