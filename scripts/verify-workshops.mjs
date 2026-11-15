const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { nextRandom } from '../src/systems/rng.js';
import { ROVER_MAP, moveRover } from '../src/minigames/workshopModels.js';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('jamt.save.v1')));
const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: `/private/tmp/astronaut-browser-qa/${name}.png`, fullPage: true }); };
try {
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#welcome-start').click();
  await page.locator('#story-next').waitFor();
  await shot('opening-dialogue');
  await page.locator('#story-skip').click();
  await page.keyboard.press('Escape');
  await page.locator('#story-skip').waitFor();
  await page.locator('#story-skip').click();
  await page.locator('#minigame-root [data-action="close"]').click();
  const training = async (id) => {
    await page.locator('[data-destination="training"]').click();
    await page.locator(`[data-launch-task="${id}"]`).click();
    await page.locator('#mgt-start-btn').click();
  };
  await training('waterPurifier');
  await shot('water-purifier');
  const target = ['screen', 'carbon', 'membrane', 'disinfect'];
  const labels = {screen:'Particle screen',carbon:'Carbon filter',membrane:'Fine membrane',disinfect:'Disinfection'};
  for (let i = 0; i < 4; i++) {
    const names = await page.locator('.filter-stage strong').allTextContents();
    const at = names.indexOf(labels[target[i]]);
    if (at !== i) { await page.locator(`[data-stage="${at}"]`).click(); await page.locator(`[data-stage="${i}"]`).click(); }
  }
  await page.locator('#water-test').click();
  await page.locator('#mgt-done-btn').click();
  assert.equal((await save()).progression.taskRecords.waterPurifier.bestStars, 3);
  await training('circuitRepair');
  const randomState = { rngState: (await save()).seed };
  const rotations = Array.from({length:9}, () => 1 + Math.floor(nextRandom(randomState)*3));
  for (let i = 0; i < 9; i++) for(let turn=0; turn < 4-rotations[i]; turn++) await page.locator(`[data-tile="${i}"]`).click();
  await page.locator('#circuit-verify:not([disabled])').waitFor();
  await shot('restored-circuit');
  await page.locator('#mgt-pause-btn').click();
  const paused = await page.locator('#mgt-timer-pill').textContent();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#mgt-timer-pill').textContent(), paused);
  await page.locator('#mgt-pause-btn').click();
  await page.locator('#circuit-verify').click();
  await page.locator('#mgt-done-btn').click();
  await training('sampleAnalysis');
  for (const bin of ['basalt','anorthosite','breccia']) { await page.locator('#sample-inspect').click(); await page.locator(`[data-bin="${bin}"]`).click(); }
  await page.locator('#mgt-done-btn').click();
  await training('roverExplorer');
  const route = (() => {
    const map = ROVER_MAP;
    const queue = [[map.base, 0, []]], visited = new Set();
    while(queue.length) {
      const [position, prev, route] = queue.shift();
      const idx = map.samples.indexOf(position), mask = idx < 0 ? prev : prev | (1 << idx), key = position+':'+mask;
      if(visited.has(key)) continue; visited.add(key);
      if(mask === 7 && position === map.base) return route;
      for(const direction of ['north','east','south','west']) { const next=moveRover(position,direction,48); if(next.moved) queue.push([next.position,mask,[...route,direction]]); }
    }
  })();
  for (const direction of route) await page.locator(`[data-drive="${direction}"]`).click();
  await shot('rover-returned');
  await page.locator('#rover-return').click(); await page.locator('#mgt-done-btn').click();
  const state = await save();
  assert.ok(state.progression.discoveries.includes('trailblazer'));
  assert.ok(state.progression.discoveries.includes('lunar-geologist'));
  assert.equal(state.progression.xp, 220);
  assert.equal(state.campaign.completedRuns, 0);
  await page.locator('[data-destination="collection"]').click();
  await shot('collection');
  assert.equal(await page.locator('.collection-patch.is-earned').count(), 2);
  await page.locator('#desk-close').click();
  await page.reload();
  assert.equal((await save()).progression.xp, 220);
  await page.locator('[data-destination="training"]').click();
  await shot('training-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await shot('training-mobile');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false);
  await page.locator('#desk-close').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot('base-hub');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ok:true, games:4, xp:state.progression.xp, stars:state.progression.stars, roverMoves:route.length, browserErrors:errors, screenshots:8}));
} catch (error) { await shot('failure'); console.error('Browser errors:', errors); throw error; }
finally { await browser.close(); }
