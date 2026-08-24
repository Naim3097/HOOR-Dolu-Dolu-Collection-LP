# Asset pipeline (dev-only)

These pages regenerate `landing/assets/` from the originals in `/assets`.
They run in the browser against the local dev server, which exposes a
`POST /__save` endpoint on loopback only.

```bash
node .claude/server.js
```

- <http://localhost:5273/tools/optimize.html> — reads `landing/assets/manifest.json`,
  writes WebP renders (480/900/1400) into `landing/assets/img/` and refreshes
  `landing/assets/lqip.json` (blur placeholders + dimensions).
- <http://localhost:5273/tools/video.html> — re-encodes the campaign MOVs to
  silent 720w VP9 WebM plus a poster frame into `landing/assets/video/`.
  Edit the `JOBS` list at the top to point at the source files.

Add a new photograph by appending a row to `manifest.json`, re-running
optimize.html, then referencing the new name in `landing/js/data.js`.
Never deploy this folder or the dev server.
