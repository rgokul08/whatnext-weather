import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const routes = ["/", "/forecast", "/map", "/favorites", "/compare", "/weather/current-location"];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--autoplay-policy=no-user-gesture-required", "--no-sandbox"] });
const failures = [];

try {
  for (const route of routes) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    const state = await page.evaluate(() => {
      const video = document.querySelector("video.cinematic-video");
      return {
        title: document.title,
        hasRoot: Boolean(document.querySelector("#root")),
        hasVideo: Boolean(video),
        videoSrc: video?.currentSrc || "",
        videoPaused: video?.paused ?? true,
        videoMuted: video?.muted ?? false,
        hasPlaybackControl: Boolean(document.querySelector(".video-playback-control"))
      };
    });

    if (!state.hasRoot || !state.hasVideo || !state.videoSrc || state.videoPaused || !state.videoMuted || !state.hasPlaybackControl) {
      failures.push(`${route}: invalid page/video state ${JSON.stringify(state)}`);
    }
    if (consoleErrors.length) failures.push(`${route}: console warnings/errors\n${consoleErrors.join("\n")}`);
    if (pageErrors.length) failures.push(`${route}: page errors\n${pageErrors.join("\n")}`);
    console.log(`${route} ok — video playing=${!state.videoPaused}, muted=${state.videoMuted}`);
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("\nBrowser route checks failed:\n" + failures.join("\n\n"));
  process.exit(1);
}
console.log(`\nAll ${routes.length} route checks passed with no console warnings/errors.`);
