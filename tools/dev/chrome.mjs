import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
export function pageUrl(value = "index.html") {
  return /^[a-z]+:/.test(value) ? value : pathToFileURL(resolve(value)).href;
}
export async function startChrome(width = 1280, height = 800) {
  const profile = await mkdtemp(`${tmpdir()}/markus-chrome-`);
  const chrome = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--remote-debugging-port=0",
      `--window-size=${width},${height}`,
      "--allow-file-access-from-files",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const endpoint = await new Promise((done, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error(`Chrome startup timed out: ${output}`)),
      15000,
    );
    chrome.on("error", reject);
    chrome.stderr.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        done(match[1]);
      }
    });
  });
  const address = new URL(endpoint);
  const targets = await (await fetch(`http://${address.host}/json`)).json();
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("Chrome has no page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    ws.addEventListener("open", done);
    ws.addEventListener("error", reject);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (message) => {
    const data = JSON.parse(message.data);
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.error) request.reject(new Error(JSON.stringify(data.error)));
    else request.done(data.result);
  });
  function send(method, params = {}) {
    return new Promise((done, reject) => {
      id += 1;
      pending.set(id, { done, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function navigate(url) {
    await send("Page.navigate", { url: pageUrl(url) });
    await sleep(300);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await evaluate('document.readyState === "complete"')) return;
      await sleep(100);
    }
    throw new Error(`Page did not load: ${url}`);
  }
  async function close() {
    const exited = new Promise((done) => chrome.once("exit", done));
    await send("Browser.close");
    ws.close();
    await exited;
    await rm(profile, { recursive: true, force: true });
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { send, evaluate, navigate, close };
}
