# DEADSTOCK — dev handoff

| File | What |
| --- | --- |
| `DEADSTOCK-dev-spec.md` | Spec: scope, screen map, flows, data model (11 tables), rules, tokens |
| `deadstock-tokens.css` | Colors, type and component classes. Use these, no raw hex |
| `screens/` | Source of all 108 artboards (`*.dc.html`) + `canvas.json` layout |

Live links:

- Design canvas (clickable): https://claude.ai/artifact/1fS1tPty1d9aWA6zM6Ffro
- Spec doc (live, commentable): https://claude.ai/code/artifact/0ebd917d-64c2-46f9-976d-5c4a282cfdd6

Notes:

- `screens/*.dc.html` are design source, not production code. They need the canvas runtime to render, so open them on the canvas. Copy markup, spacing and inline styles from them.
- Naming: `-375` mobile, `-1440` desktop, `-EN` English. Shop dashboard is Georgian only.
- Copy rule: as few words as possible. Icon or 1–2 words. Every icon button has `aria-label` + `title`.
- Open: terms & privacy text (Legal-*) is a draft waiting for a lawyer.
