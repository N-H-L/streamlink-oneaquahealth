# Submission images

Captured from the live demo on 2026-09-25 at 2× (phone at 3×). Devpost shows the first image as the
thumbnail, so upload them in this order. Suggested captions:

| File | Caption to paste |
|---|---|
| `01-board.png` | The city board: 1,186 days since the lab last visited a typical Coimbra stream. "Act on this next" names one stream and says why. |
| `02-record.png` | One stream's shared record — stream, animals and people — with the four ranking factors and the reason for each. |
| `03-validation.png` | Every record type the app writes, checked by the official HL7 validator against the OneAquaHealth IG: 0 errors, and 5/5 deliberately broken records rejected. |
| `04-check-phone.png` | The volunteer check on a phone: the OneAquaHealth citizen app's own questions, as pictures, offline if needed. |

Recapture with `node out/checks/shots.mjs` (the script is in `out/`, which is not committed; it drives
the deployed site with playwright-core).

## Thumbnail

Two versions, 2400x1350 (Devpost wants 16:9, at least 1200x675). Pick one and upload it first, so it
becomes the card image; the four screenshots follow it.

- `thumbnail-b.png` shows the product, which is usually the better card in a gallery of competitors.
- `thumbnail-a.png` is type only, and stays readable when the card is shown small.

Rebuild either with `node out/thumb/render.mjs a b` (sources in `out/thumb/`, not committed).
