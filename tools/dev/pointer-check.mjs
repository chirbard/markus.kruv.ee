import assert from "node:assert/strict";
import { sleep, startChrome } from "./chrome.mjs";

const url = process.argv[2] ?? "index.html";
const browser = await startChrome();
const { send, evaluate: evalJs } = browser;
try {
  await browser.navigate(url);
  await evalJs(
    `(()=>{const s=document.getElementById('work');window.scrollTo(0,s.getBoundingClientRect().top+scrollY-40);})()`,
  );
  await sleep(300);
  const box = await evalJs(
    `(()=>{const b=document.querySelector('#work .stage').getBoundingClientRect();return [b.left,b.top,b.right,b.bottom];})()`,
  );
  const report = () =>
    evalJs(
      `(()=>{const st=document.querySelector('#work .stage');const l=document.querySelector('#work .collage[data-p="tara"] .layer');return 'mx='+st.style.getPropertyValue('--mx')+' my='+st.style.getPropertyValue('--my')+' translate='+getComputedStyle(l).translate;})()`,
    );
  const reports = [];
  for (const [x, y] of [
    [box[0] + 20, box[1] + 20],
    [box[2] - 10, box[3] - 300],
  ]) {
    for (let k = 0; k < 10; k++) {
      await send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: x - 50 + k * 5,
        y,
      });
      await sleep(30);
    }
    await sleep(1200);
    const state = await evalJs(
      `({x: Number(document.querySelector(".stage").style.getPropertyValue("--mx")), y: Number(document.querySelector(".stage").style.getPropertyValue("--my"))})`,
    );
    reports.push(state);
    console.log(
      `pointer at ${Math.round(x)},${Math.round(y)}:`,
      await report(),
    );
  }
  assert(
    reports[0].x < 0 && reports[1].x > 0,
    "Pointer drift must change direction",
  );
  assert.notEqual(reports[0].y, reports[1].y, "Vertical drift must respond");
} finally {
  await browser.close();
}
