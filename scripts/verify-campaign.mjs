const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { nextRandom } from '../src/systems/rng.js';
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jamt.save.v1')));
async function setRange(id,value,event='change') { await page.locator(id).evaluate((el,{value,event})=>{el.value=String(value);el.dispatchEvent(new Event(event,{bubbles:true}));},{value,event}); }
async function dismissStory() { await page.waitForTimeout(150); if(await page.locator('#story-skip').isVisible()) await page.locator('#story-skip').click(); }
async function done() { await page.locator('#mgt-done-btn').click(); await dismissStory(); }
async function launch(id) {
  await dismissStory();
  await page.locator('#btn-campaign').click();
  const choices=page.locator('[data-camp-choice]:not([disabled])');
  if(await choices.count()) await choices.first().click();
  await page.locator(`[data-camp-mg="${id}"]`).click();
  if(id==='solarAligner') await page.locator('#sa-start-btn').click();
  else if(id==='leakHunter') await page.locator('#lh-start-btn').click();
  else await page.locator('#mgt-start-btn').click();
}
const tasks={
  async siteSelector() { for(const site of ['peak','terrace','floor']) await page.locator(`.ss-inspect[data-site="${site}"]`).click(); await page.locator('.ss-pick[data-site="terrace"]').click(); await page.locator('#ss-lock-btn').click(); await done(); },
  async moduleLayout() { for(const [id,slot] of Object.entries({habitat:'core',solar:'ridge',comms:'ridge',greenhouse:'east',lifeSupport:'core',lab:'east'})) await page.locator(`.ml-slot-btn[data-mod="${id}"][data-slot="${slot}"]`).click(); await page.locator('#ml-commit-btn').click(); await done(); },
  async solarAligner() { const angle=parseInt(await page.locator('#sa-sun').textContent()); await setRange('#sa-slider',angle,'input'); for(let i=0;i<6;i++) await page.locator(`[data-spot-id="${i}"]`).dispatchEvent('pointerdown'); await page.locator('#sa-lock').click(); await page.locator('#sa-done-btn').click(); await dismissStory(); },
  async powerRouter() { await page.locator('[data-circuit="lab"]').click(); await page.locator('#pr-lock-wave').click(); await page.locator('[data-circuit="greenhouse"]').click(); await page.locator('#pr-lock-wave').click(); await done(); },
  async leakHunter() {
    const rng={rngState:(await save()).seed};
    const zones=[[.14,.36,.2,.78],[.4,.62,.18,.78],[.66,.86,.2,.78]];
    for(const [minX,maxX,minY,maxY] of zones) {
      const x=minX+nextRandom(rng)*(maxX-minX),y=minY+nextRandom(rng)*(maxY-minY);
      const box=await page.locator('#lh-board').boundingBox();
      await page.mouse.click(box.x+x*box.width,box.y+y*box.height);
    }
    await page.locator('#lh-done-btn').click(); await dismissStory();
  },
  async greenhouseBalance() { await page.locator('#gb-plant-btn').click(); await setRange('#gb-lamps',73); await setRange('#gb-mist',70); await setRange('#gb-co2',65); await page.locator('#gb-harvest-btn').click(); await page.locator('#gb-pick-btn').click(); await done(); },
  async shelterResponse() { for(let i=0;i<4;i++) await page.locator(`[data-idx="${i}"]`).click(); await done(); },
  async shieldBuilder() { await page.locator('.sb-inc[data-mat="poly"]').click(); await page.locator('#sb-lock-btn').click(); await done(); },
  async commsDelay() { await setRange('#cd-angle',54); for(let i=0;i<3;i++) { await page.locator('#cd-send-btn:not([disabled])').click(); await page.waitForTimeout(2700); } await done(); },
};
try {
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#welcome-start').click(); await page.locator('#story-skip').click(); await page.keyboard.press('Escape'); await dismissStory();
  await page.locator('#minigame-root [data-action="close"]').click();
  const settings=await save(); settings.settings.reducedMotion=true;
  await page.evaluate(s=>localStorage.setItem('jamt.save.v1',JSON.stringify(s)),settings); await page.reload();
  const scenarios=[['siteSelector','moduleLayout','solarAligner'],['powerRouter','leakHunter','greenhouseBalance'],['shelterResponse','shieldBuilder','commsDelay'],['siteSelector','moduleLayout','solarAligner'],['powerRouter','leakHunter','greenhouseBalance']];
  for(let run=0;run<5;run++) {
    for(const id of scenarios[run]) { await launch(id); await tasks[id](); console.log('completed',run+1,id); }
    assert.equal((await save()).campaign.completedRuns,run+1);
  }
  await page.getByRole('heading',{name:'🌍 Welcome Back to Earth, Commander!'}).waitFor({timeout:20000});
  await page.screenshot({path:'/private/tmp/astronaut-browser-qa/earth-report.png'});
  assert.equal((await save()).campaign.returnedToEarth,true);
  await page.reload();
  await page.getByRole('heading',{name:'🌍 Welcome Back to Earth, Commander!'}).waitFor();
  assert.equal((await save()).campaign.completedRuns,5);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,runs:5,tasks:15,endingPersisted:true,browserErrors:errors}));
} catch(error) { await page.screenshot({path:'/private/tmp/astronaut-browser-qa/campaign-failure.png'});console.error('browser errors',errors);throw error; }
finally {await browser.close();}
