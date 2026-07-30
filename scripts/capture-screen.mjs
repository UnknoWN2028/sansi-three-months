import { writeFile } from "node:fs/promises";

const outputPath = process.argv[2] ?? "implementation-mobile-screen.png";
const hash = process.argv[3] ?? "";
const debugPort = 9225;

const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.includes("127.0.0.1:8766"));

if (!target?.webSocketDebuggerUrl) {
  throw new Error("Could not find the anniversary preview tab.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (!message.id || !pending.has(message.id)) return;

  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");

if (hash) {
  await send("Runtime.evaluate", {
    expression: `location.hash = ${JSON.stringify(hash)}; location.reload();`,
  });
  await new Promise((resolve) => setTimeout(resolve, 1800));
}

const evaluation = await send("Runtime.evaluate", {
  expression: `(() => {
    const screen = document.querySelector('[data-phone-screen]');
    if (!screen) throw new Error('phone screen not found');
    const rect = screen.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio,
      url: location.href
    };
  })()`,
  returnByValue: true,
});

const bounds = evaluation.result.value;
if (Math.abs(bounds.width - 393) > 1 || Math.abs(bounds.height - 852) > 1) {
  throw new Error(`Expected 393 x 852 phone screen, got ${bounds.width} x ${bounds.height}.`);
}

const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: false,
  clip: {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    scale: 1,
  },
});

await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
socket.close();

console.log(JSON.stringify({ outputPath, ...bounds }, null, 2));
