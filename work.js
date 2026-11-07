// Work section: hovering, focusing or tapping a row shows that project's
// collage, and the collage drifts with the pointer. The page works without
// this file: the HTML marks TARA as active, so its collage shows.
"use strict";

const EASE = 0.08; // share of the remaining distance covered per frame
const SETTLED = 0.001; // stop animating below this distance
const LEFT_LIMIT = -0.35; // furthest left drift, reached at the stage's left edge

function activateProjectRows(section) {
  const rows = section.querySelectorAll(".work li[data-p]");
  for (const row of rows) {
    const show = () => {
      section.dataset.active = row.dataset.p;
    };
    row.addEventListener("pointerenter", show);
    row.addEventListener("focus", show);
    row.addEventListener("click", show);
  }
}

function driftWithPointer(section, stage) {
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;

  const step = () => {
    current.x += (target.x - current.x) * EASE;
    current.y += (target.y - current.y) * EASE;
    stage.style.setProperty("--mx", current.x.toFixed(4));
    stage.style.setProperty("--my", current.y.toFixed(4));
    const distance = Math.abs(target.x - current.x) + Math.abs(target.y - current.y);
    if (distance < SETTLED) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(step);
  };

  const aim = (x, y) => {
    target.x = x;
    target.y = y;
    if (frame === 0) {
      frame = requestAnimationFrame(step);
    }
  };

  // -1..1 from the stage's centre. Left of the stage (over the index) it
  // stops at LEFT_LIMIT, so reading the list doesn't push the collage
  // into it; over the images the full range applies.
  section.addEventListener("pointermove", (event) => {
    const box = stage.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;
    aim(Math.max(LEFT_LIMIT, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  });
  section.addEventListener("pointerleave", () => aim(0, 0));
}

function setUpWork() {
  const section = document.getElementById("work");
  const stage = section ? section.querySelector(".stage") : null;
  if (!section || !stage) {
    return;
  }
  activateProjectRows(section);

  const stillMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (stillMotion || !finePointer) {
    return;
  }
  driftWithPointer(section, stage);
}

setUpWork();
