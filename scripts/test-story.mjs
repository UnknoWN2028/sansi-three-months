import { writeFile } from "node:fs/promises";

const targets = await fetch("http://127.0.0.1:9225/json").then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.includes("127.0.0.1:8766"));

if (!target?.webSocketDebuggerUrl) {
  throw new Error("Could not find the anniversary preview tab.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleErrors = [];
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));

  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text);
  }

  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    consoleErrors.push(
      message.params.args.map((argument) => argument.value ?? argument.description ?? "").join(" "),
    );
  }

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

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return response.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await evaluate(`location.hash = ""; location.reload();`);
await new Promise((resolve) => setTimeout(resolve, 1800));

const initial = await evaluate(`(() => ({
  imagesReady: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  imageCount: document.images.length,
  audioReadyState: document.querySelector("audio")?.readyState ?? -1,
  startButtons: document.querySelectorAll(".story-button").length,
  lightButtons: document.querySelectorAll(".light-point").length,
}))()`);

await evaluate(`document.querySelector(".story-button")?.click()`);
await new Promise((resolve) => setTimeout(resolve, 850));

const afterStart = await evaluate(`(() => ({
  started: document.querySelector(".story-button")?.dataset.started,
  buttonText: document.querySelector(".story-button")?.textContent?.trim(),
}))()`);

await evaluate(`document.querySelectorAll(".light-point").forEach((button) => button.click())`);
await new Promise((resolve) => setTimeout(resolve, 350));

const afterLights = await evaluate(`(() => {
  const finale = document.querySelector("#finale");
  finale?.scrollIntoView({ behavior: "auto", block: "start" });
  return {
    found: document.querySelectorAll('.light-point[data-found="true"]').length,
    status: document.querySelector(".light-status p")?.textContent?.trim(),
    finaleUnlocked: finale?.dataset.unlocked,
  };
})()`);

await new Promise((resolve) => setTimeout(resolve, 900));

const bounds = await evaluate(`(() => {
  const rect = document.querySelector("[data-phone-screen]").getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
})()`);

const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: false,
  clip: { ...bounds, scale: 1 },
});

await writeFile("implementation-finale-screen.png", Buffer.from(screenshot.data, "base64"));
socket.close();

console.log(
  JSON.stringify(
    {
      initial,
      afterStart,
      afterLights,
      consoleErrors,
      screenshot: "implementation-finale-screen.png",
    },
    null,
    2,
  ),
);
