import assert from "node:assert/strict";
import { sleep, startChrome } from "./chrome.mjs";

const url = process.argv[2] ?? "index.html";
const browser = await startChrome();
const { send, evaluate: ev } = browser;
try {
  await browser.navigate(url);
  const top = await ev(
    `document.querySelector('#work .work').getBoundingClientRect().top+scrollY`,
  );
  for (const dy of [-100, 300, 600, 900, 600, 200]) {
    const before = await ev(`document.getElementById('work').dataset.active`);
    await send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: 1200,
      y: 400,
      deltaX: 0,
      deltaY: await ev(`${top} + ${dy} - scrollY`),
    });
    await sleep(300);
    const expected = await ev(
      `(() => { const rows = [...document.querySelectorAll('#work .work li')]; const visible = row => { const b = row.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; }; const previous = rows.find(row => row.dataset.p === '${before}'); return previous && visible(previous) ? previous.dataset.p : rows.find(visible)?.dataset.p; })()`,
    );
    assert.equal(
      await ev(`document.getElementById('work').dataset.active`),
      expected,
      "Highlight must follow the visible rows",
    );
    console.log(
      `scrolled to list+${dy}: active=` +
        (await ev(`document.getElementById('work').dataset.active`)) +
        ", highest visible=" +
        (await ev(
          `[...document.querySelectorAll('#work .work li')].find(r=>{const b=r.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight}).dataset.p`,
        )),
    );
  }
} finally {
  await browser.close();
}
