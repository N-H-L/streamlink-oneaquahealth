# Submission images

All 3:2, which is the ratio Devpost asks for, and all well under its 5 MB limit. Captured from the
live demo on 2026-09-25. The narrative log is `../hackathon/EVIDENCE.md`; the paste-ready captions
are in `../hackathon/PASTE.md`.

## Upload order

Devpost uses the first image as the card, so the thumbnail goes first.

1. A thumbnail (see below)
2. `01-board.png` 2700x1800
3. `02-record.png` 2700x1800
4. `03-validation.png` 2700x1800
5. `04-check-phone-card.png` 2400x1600

`04-check-phone.png` is the raw portrait screenshot. It is the source for the card above and is not
meant to be uploaded on its own, since a tall image sits badly in a 3:2 gallery.

## Thumbnail

Five to choose from, all 2400x1600. Logo only, set in Outfit, with "Stream" solid and "Link" light:

- `thumbnail-l3.png` wordmark alone on deep teal, stream motif along the bottom. Biggest, reads at any size.
- `thumbnail-l1.png` app icon above the wordmark, tagline under a short rule. The most conventional lockup.
- `thumbnail-l2.png` the same on a light background, icon and wordmark side by side over a wave.

With the product in shot:

- `thumbnail-b.png` headline left, the board in a browser frame right.
- `thumbnail-a.png` headline and the three numbers, no screenshot.

## Rebuilding

- Screenshots: `node out/checks/shots.mjs` (drives the deployed site at a 1350x900 viewport, 2x).
- Thumbnails and the phone card: `node out/thumb/render.mjs l1 l2 l3 a b phone` (sources in `out/thumb/`).

Neither script is committed, because `out/` is not.
