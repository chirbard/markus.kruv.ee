// Work section: hovering, focusing or tapping a row shows that project's
// collage, and the collage drifts with the pointer. On a phone a tapped
// row opens its collage full-screen over the page instead, closed by the
// cross, Escape or the back gesture. The page works without this file:
// the HTML marks TARA as active, so its collage shows on desktop.
"use strict";

const EASE = 0.08; // share of the remaining distance covered per frame
const SETTLED = 0.001; // stop animating below this distance
const LEFT_LIMIT = -0.35; // furthest left drift, reached at the stage's left edge
const PHONE = window.matchMedia("(max-width: 47.99rem)"); // same breakpoint as style.css

function activateProjectRows(section, overlay) {
  const rows = section.querySelectorAll(".work li[data-p]");
  for (const row of rows) {
    const show = () => {
      section.dataset.active = row.dataset.p;
    };
    row.addEventListener("pointerenter", () => {
      if (!PHONE.matches) {
        show();
      }
    });
    row.addEventListener("focus", () => {
      if (!PHONE.matches) {
        show();
      }
    });
    row.addEventListener("click", () => {
      show();
      if (PHONE.matches) {
        overlay.open(row);
      }
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && PHONE.matches) {
        show();
        overlay.open(row);
      }
    });
  }
}

// When the active row scrolls out of the window, the highest row still in
// the window becomes active, so the stage never shows a project you can't
// see in the index. Desktop only; hovering still wins.
function followScroll(section) {
  const rows = Array.from(section.querySelectorAll(".work li[data-p]"));
  let queued = false;

  const inWindow = (row) => {
    const box = row.getBoundingClientRect();
    return box.bottom > 0 && box.top < window.innerHeight;
  };

  const check = () => {
    queued = false;
    if (PHONE.matches) {
      return;
    }
    const active = rows.find((row) => row.dataset.p === section.dataset.active);
    if (active && inWindow(active)) {
      return;
    }
    const highest = rows.find(inWindow);
    if (highest) {
      section.dataset.active = highest.dataset.p;
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(check);
      }
    },
    { passive: true },
  );
}

// The phone overlay. Opening pushes a history entry so the back gesture
// closes it instead of leaving the page; closing returns focus to the row.
function phoneOverlay(section, stage) {
  const close = stage.querySelector(".stage-close");
  let opener = null;

  const hide = () => {
    if (!section.classList.contains("is-open")) {
      return;
    }
    section.classList.remove("is-open");
    stage.removeAttribute("role");
    stage.removeAttribute("aria-modal");
    document.documentElement.style.overflow = "";
    if (opener) {
      opener.focus({ preventScroll: true });
    }
  };

  const open = (row) => {
    opener = row;
    section.classList.add("is-open");
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-modal", "true");
    document.documentElement.style.overflow = "hidden";
    history.pushState({ workOverlay: true }, "");
    close.focus({ preventScroll: true });
  };

  const closeByUser = () => {
    if (history.state && history.state.workOverlay) {
      history.back(); // popstate hides it
      return;
    }
    hide();
  };

  close.addEventListener("click", closeByUser);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeByUser();
    }
  });
  window.addEventListener("popstate", hide);
  PHONE.addEventListener("change", hide);
  return { open };
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
  activateProjectRows(section, phoneOverlay(section, stage));
  followScroll(section);

  const stillMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (stillMotion || !finePointer) {
    return;
  }
  driftWithPointer(section, stage);
}

setUpWork();
