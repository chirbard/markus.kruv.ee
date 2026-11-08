// Render the link-preview image (og.png): the hero at 1200x630, the size
// LinkedIn, Slack and mail clients expect. Chevrons are frozen at their
// start frame (three at rest). Re-run when the hero changes.
import { writeFile } from "node:fs/promises";
import { startChrome } from "./chrome.mjs";

const [, , page = "index.html", output = "og.png"] = process.argv;
const browser = await startChrome(1200, 630);
try {
  await browser.navigate(page);
  await browser.evaluate(`(async () => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
    await document.fonts.ready;
  })()`);
  const shot = await browser.send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
  });
  await writeFile(output, Buffer.from(shot.data, "base64"));
} finally {
  await browser.close();
}
