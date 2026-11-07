import { mkdir, writeFile } from "node:fs/promises";
import { startChrome } from "./chrome.mjs";

const [, , url, output, mode] = process.argv;
if (!url || !output)
  throw new Error("Usage: node tools/dev/capture.mjs PAGE OUTPUT_DIRECTORY");
await mkdir(output, { recursive: true });
for (const [name, width, height] of [
  ["desktop", 1280, 1900],
  ["phone", 500, 900],
]) {
  const browser = await startChrome(width, height);
  try {
    await browser.send("Animation.enable");
    await browser.send("Animation.setPlaybackRate", { playbackRate: 0 });
    await browser.navigate(url);
    await browser.evaluate(
      `(async () => { for (const img of document.images) img.loading = 'eager'; await Promise.all([...document.images].map(img => img.decode())); })()`,
    );
    if (mode === "layout") {
      for (const time of [0, 3000, 7000]) {
        await browser.evaluate(
          `for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${time}; }`,
        );
        await browser.evaluate(
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        );
        const size = await browser.evaluate(
          "({width: innerWidth, height: document.documentElement.scrollHeight})",
        );
        const shot = await browser.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, ...size, scale: 1 },
        });
        await writeFile(
          `${output}/${name}-layout-${time}.png`,
          Buffer.from(shot.data, "base64"),
        );
      }
      continue;
    }
    const projects = await browser.evaluate(
      `Array.from(document.querySelectorAll('#work .work li'), row => row.dataset.p)`,
    );
    for (const project of projects) {
      await browser.navigate(url);
      await browser.evaluate(
        `(async () => { for (const img of document.images) img.loading = 'eager'; await Promise.all([...document.images].map(img => img.decode())); for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; } })()`,
      );
      await browser.evaluate(
        `window.scrollTo(0, document.querySelector('#work').offsetTop)`,
      );
      if (name === "phone")
        await browser.evaluate(
          `document.querySelector('#work li[data-p="${project}"]').click()`,
        );
      else
        await browser.evaluate(
          `document.querySelector('#work').dataset.active = '${project}'`,
        );
      for (const time of [0, 3000, 7000]) {
        // Flush style so transitions created by the row change are included.
        await browser.evaluate("document.body.getBoundingClientRect().height");
        await browser.evaluate(
          `for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = ${time}; }`,
        );
        await browser.send("Runtime.evaluate", {
          expression:
            "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
          awaitPromise: true,
        });
        await browser.evaluate(
          `for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = ${time}; }`,
        );
        await browser.evaluate(
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        );
        const shot = await browser.send("Page.captureScreenshot", {
          format: "png",
        });
        await writeFile(
          `${output}/${name}-${project}-${time}.png`,
          Buffer.from(shot.data, "base64"),
        );
      }
      if (name === "phone") {
        await browser.evaluate("history.back()");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } finally {
    await browser.close();
  }
}
