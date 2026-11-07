// Render Figma exports without Chrome's minimum native window width affecting the crop.
import { readFile, writeFile } from "node:fs/promises";
import { startChrome } from "./chrome.mjs";

const [, , input, output, offset = "0"] = process.argv;
if (!input || !output)
  throw new Error("Usage: node tools/dev/render-svg.mjs SVG PNG [OFFSET]");
const svg = await readFile(input, "utf8");
const browser = await startChrome(390, 844);
try {
  await browser.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await browser.navigate("about:blank");
  await browser.evaluate(`(async () => {
    document.documentElement.style.background = '#1D1D1D';
    document.body.style.margin = '0';
    const image = new Image();
    image.src = ${JSON.stringify(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)};
    image.style.cssText = 'position:absolute;left:${Number(offset)}px;top:${Number(offset)}px';
    document.body.append(image);
    await image.decode();
    await document.fonts.ready;
  })()`);
  const shot = await browser.send("Page.captureScreenshot", { format: "png" });
  await writeFile(output, Buffer.from(shot.data, "base64"));
} finally {
  await browser.close();
}
