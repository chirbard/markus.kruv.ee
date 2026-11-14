# markus.kruv.ee

My personal site: who I am, the work I have done, and how to reach me. One page of plain HTML and CSS with one small script.

**New here? Open this repo with your AI and ask it to explain the project, starting from `index.html`.**

## Run

```sh
python3 -m http.server 8000   # localhost:8000
./tools/check.sh              # Biome, ruff and shellcheck, no suppressions
```

`tools/README.md` explains the media scripts, the link preview and the headless Chrome checks. GitHub Pages serves `main` at the address in `CNAME`.

## Why this design

- **No build step.** The page is static text, images and a little motion. What is in the repo is what the browser gets, so there is nothing to install and nothing to break between edit and deploy.
- **Small on phones.** Images come in several sizes (`srcset`), so the first load is about 78 KB on a phone and 588 KB on desktop.
- **Raw captures stay out of git.** Screen recordings of logged-in national services show personal codes and session IDs. The originals live in the ignored `raw/`; only blurred copies go into `media/`.
