// Feature: an orb on the desk that watches the pointer (branch feature/desk-orb).
import path from "node:path";
import sharp from "sharp";

/** The orb's place in a 1440 x 900 window. */
const ORB = { x: 443, y: 428, size: 88 };

const look = async (page) => sharp(await page.screenshot({ clip: { x: ORB.x, y: ORB.y, width: ORB.size, height: ORB.size } })).raw().toBuffer();

/** Mean difference between two pictures of the orb, 0 to 255. */
function difference(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

/** Where the eye's glow sits in the picture: the mean x of its bright blue pixels. */
function eyeX(picture) {
  const channels = picture.length / (ORB.size * ORB.size);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < ORB.size * ORB.size; i++) {
    const [r, , b] = [picture[i * channels], picture[i * channels + 1], picture[i * channels + 2]];
    if (b > 190 && b > r + 40) {
      sum += i % ORB.size;
      count++;
    }
  }
  return count ? sum / count : null;
}

export default async function deskOrb({ open, check, at, sceneReady, settle, frames, pointAt, out }) {
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);

  await page.mouse.move(120, 760, { steps: 6 });
  await page.waitForTimeout(900);
  const left = await look(page);
  await page.mouse.move(1420, 420, { steps: 6 });
  await page.waitForTimeout(900);
  const right = await look(page);
  check("orb: it has a glowing eye", eyeX(left) !== null && eyeX(right) !== null);
  check("orb: the eye follows the pointer from left to right", eyeX(right) - eyeX(left) > 6, `eye at ${eyeX(left)?.toFixed(1)} then ${eyeX(right)?.toFixed(1)}`);

  // The camera's own lean toward the pointer takes a moment longer to settle.
  await page.waitForTimeout(1500);
  const still = await frames(page);
  await page.waitForTimeout(1200);
  check("orb: once the pointer rests, the scene draws no frames", (await frames(page)) === still, `${(await frames(page)) - still} frames`);
  await page.screenshot({ path: path.join(out, "orb-1440x900.png") });

  // A click anywhere makes it blink, then it settles again.
  await page.mouse.move(700, 860, { steps: 4 });
  await page.waitForTimeout(2400);
  const open0 = await look(page);
  await page.mouse.down();
  await page.waitForTimeout(110);
  const shut = await look(page);
  await page.mouse.up();
  await page.waitForTimeout(700);
  check("orb: it blinks on a click", difference(open0, shut) > 1.5 && difference(open0, await look(page)) < 1, `mid-blink ${difference(open0, shut).toFixed(2)}`);

  // It is decoration: it has no label and opens nothing.
  await page.mouse.move(ORB.x + ORB.size / 2, ORB.y + ORB.size / 2, { steps: 4 });
  await page.waitForTimeout(400);
  await page.mouse.click(ORB.x + ORB.size / 2, ORB.y + ORB.size / 2);
  await page.waitForTimeout(900);
  check("orb: clicking it opens nothing", at("/")(page.url()));

  // With a page open it stops watching.
  const monitor = await pointAt(page, "monitor-left");
  await page.mouse.click(monitor.x, monitor.y);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  await page.waitForTimeout(1200);
  const resting = await frames(page);
  await page.mouse.move(300, 300, { steps: 8 });
  await page.mouse.move(900, 600, { steps: 8 });
  await page.waitForTimeout(500);
  check("orb: with a page open, moving the pointer draws no frames", (await frames(page)) === resting, `${(await frames(page)) - resting} frames`);
  check("orb: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const calm = await open("/", { reducedMotion: "reduce" });
  await sceneReady(calm.page);
  await calm.page.waitForTimeout(800);
  const before = await look(calm.page);
  await calm.page.mouse.move(100, 800, { steps: 6 });
  await calm.page.waitForTimeout(600);
  check("orb: reduced motion: it holds still", difference(before, await look(calm.page)) < 0.5);
  await calm.context.close();
}
