import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const help = '📷 Help my plant';
const demo = '🌱 MY money tree is DYING';
const plan = 'Build my 14-day revive plan →';
const start = async (app, screen) => {
  await app.open();
  await screen.getByRole('button', help).tap();
  await screen.getByRole('button', 'Skip photo for now').tap();
};

test('demo completes fourteen independent days, undo, celebration and new plant', async ({ app, screen, browser }) => {
  await app.open();
  await browser.evaluate(() => localStorage.setItem('unrelated.fixture', 'keep'));
  await screen.getByRole('button', demo).tap();
  await expect(screen.getByRole('heading', 'Overwatering / root rot')).toBeVisible();
  await expect(screen.getByText('LIKELY · 85%')).toBeVisible();
  await screen.getByRole('button', plan).tap();
  await expect(browser.locator('.day')).toHaveCount(14);
  for(let day=1;day<=14;day++) {
    await screen.getByRole('button', `Mark day ${day} done`).tap();
    await expect(screen.getByRole('status', 'Plan progress')).toHaveText(`${day} / 14 days done`);
  }
  await screen.getByRole('button', 'Mark day 14 done').tap();
  await expect(screen.getByRole('status', 'Plan progress')).toHaveText('13 / 14 days done');
  await screen.getByRole('button', 'Mark day 14 done').tap();
  await app.restart();
  await expect(screen.getByRole('status', 'Plan progress')).toHaveText('14 / 14 days done');
  await screen.getByRole('button', /doing better/).tap();
  await expect(screen.getByRole('heading', 'You saved Money tree.')).toBeVisible();
  await screen.getByRole('button', 'Back to my plan').tap();
  await expect(screen.getByRole('status', 'Plan progress')).toHaveText('14 / 14 days done');
  await screen.getByRole('button', 'Start over with a new plant').tap();
  await expect(screen.getByRole('heading', 'Your plant can be saved.')).toBeVisible();
  expect(await browser.evaluate(() => localStorage.getItem('unrelated.fixture'))).toBe('keep');
  expect(await browser.evaluate(() => Object.keys(localStorage).filter(k=>k.startsWith('planttriage.plan.')).length)).toBe(1);
  await browser.reload();
  await expect(screen.getByRole('heading', 'Your plant can be saved.')).toBeVisible();
  await screen.getByRole('button', help).tap();
  await screen.getByRole('button', 'Skip photo for now').tap();
  await expect(screen.getByRole('button', 'Diagnose →')).toBeDisabled();
});

test('symptom selection, deselection, focus, back and change symptoms', async ({ app, screen, browser }) => {
  await start(app, screen);
  await expect(screen.getByRole('button', 'Diagnose →')).toBeDisabled();
  const chip = screen.getByRole('button', /Yellowing leaves/);
  await chip.focus();
  await chip.press('Enter');
  await expect(chip).toHaveAttribute('aria-pressed','true');
  await expect(chip).toBeFocused();
  await chip.press('Space');
  await expect(chip).toHaveAttribute('aria-pressed','false');
  await expect(screen.getByRole('button', 'Diagnose →')).toBeDisabled();
  await chip.tap();
  await screen.getByRole('button', '← Back').tap();
  await screen.getByRole('button', 'Next — pick symptoms →').tap();
  await browser.reload();
  await expect(chip).toHaveAttribute('aria-pressed','true');
  await screen.getByRole('button', 'Diagnose →').tap();
  await screen.getByRole('button', '← Change symptoms').tap();
  await chip.tap();
  await screen.getByRole('button', /Spots on leaves/).tap();
  await screen.getByRole('button', 'Diagnose →').tap();
  await expect(screen.getByRole('heading', 'Pests (insects / mites)')).toBeVisible();
});

const diagnoses = [
  ['root rot', ['Yellowing leaves','Drooping stems','Wilting'], 'Overwatering / root rot', 'STOP watering'],
  ['underwatering', ['Brown / crispy tips','Wilting'], 'Underwatering', 'Bottom-water'],
  ['sunburn', ['Brown / crispy tips','Spots on leaves'], 'Sunburn / light damage', 'Move it out of direct sun'],
  ['pests', ['Spots on leaves'], 'Pests (insects / mites)', 'Isolate the plant'],
  ['nutrients', ['Yellowing leaves'], 'Nutrient deficiency', "Don't feed a stressed plant"],
];
for (const [name, symptoms, heading, firstAid] of diagnoses) {
  test(`${name} has its own diagnosis and all fourteen tailored days`, async ({app,screen,browser}) => {
    await start(app,screen);
    for(const symptom of symptoms as string[]) await screen.getByRole('button',symptom,{exact:false}).tap();
    await screen.getByRole('button','Diagnose →').tap();
    await expect(screen.getByRole('heading',heading as string)).toBeVisible();
    await expect(browser.locator('.tell-apart')).toContainText('How to tell for sure');
    await screen.getByRole('button',plan).tap();
    await expect(browser.locator('.day')).toHaveCount(14);
    await expect(browser.locator('.day').first()).toContainText(firstAid as string);
    await expect(browser.locator('.day').last()).toContainText('Graduation day');
  });
}

test('close alternative can be chosen after the soil/light check and survives reload', async ({app,screen,browser}) => {
  await start(app,screen);
  await screen.getByRole('button',/Brown \/ crispy tips/).tap();
  await screen.getByRole('button','Diagnose →').tap();
  await expect(screen.getByText('WORTH CHECKING · 60%')).toBeVisible();
  await expect(browser.locator('.runner-up')).toContainText('Sunburn / light damage');
  await screen.getByRole('button','Use this alternative after checking').tap();
  await expect(screen.getByRole('heading','Sunburn / light damage')).toBeVisible();
  await expect(screen.getByText('WORTH CHECKING · 45%')).toBeVisible();
  await browser.reload();
  await expect(screen.getByRole('heading','Sunburn / light damage')).toBeVisible();
  await screen.getByRole('button','Use this alternative after checking').tap();
  await browser.reload();
  await expect(screen.getByRole('heading','Underwatering')).toBeVisible();
  await expect(screen.getByText('WORTH CHECKING · 45%')).toBeVisible();
  await screen.getByRole('button','Use this alternative after checking').tap();
  await screen.getByRole('button',plan).tap();
  await expect(browser.locator('.day').first()).toContainText('Move it out of direct sun');
});

test('photo upload remove reselect and draft reload keep the before image on device', async ({app,screen,browser}) => {
  await app.open();
  await screen.getByRole('button',help).tap();
  const input=screen.getByLabel('Choose a plant photo');
  await expect(screen.getByRole('image','Your plant')).toBeHidden();
  await input.setInputFiles('tests/fixtures/plant-before.png');
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  await browser.reload();
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  await screen.getByRole('button','✕ Remove photo').tap();
  await expect(screen.getByRole('image','Your plant')).toBeHidden();
  await input.setInputFiles('tests/fixtures/plant-before.png');
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  await screen.getByRole('button','Next — pick symptoms →').tap();
  await screen.getByRole('button',/Spots on leaves/).tap();
  await screen.getByRole('button','Diagnose →').tap();
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  const source=await screen.getByRole('image','Your plant').getAttribute('src');
  expect(source).toMatch(/^data:image\/jpeg;base64,/);
});

test('before and actual recovery photos persist, remove, and return to unmodified plan', async ({app,screen,browser}) => {
  await app.open();
  await screen.getByRole('button',help).tap();
  await screen.getByLabel('Choose a plant photo').setInputFiles('tests/fixtures/plant-before.png');
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  await screen.getByRole('button','Next — pick symptoms →').tap();
  await screen.getByRole('button',/Spots on leaves/).tap();
  await screen.getByRole('button','Diagnose →').tap();
  await screen.getByRole('button',plan).tap();
  await screen.getByRole('button','Mark day 1 done').tap();
  await screen.getByRole('button',/doing better/).tap();
  await expect(screen.getByRole('image','Before')).toBeVisible();
  await screen.getByLabel('Add a recovery photo').setInputFiles('tests/fixtures/plant-after.png');
  await expect(screen.getByRole('image','After')).toBeVisible();
  expect(await screen.getByRole('image','Before').getAttribute('src')).not.toBe(await screen.getByRole('image','After').getAttribute('src'));
  await browser.reload();
  await expect(screen.getByRole('image','After')).toBeVisible();
  await screen.getByRole('button','Remove recovery photo').tap();
  await expect(screen.getByRole('image','After')).toBeHidden();
  await screen.getByRole('button','Back to my plan').tap();
  await expect(screen.getByRole('status','Plan progress')).toHaveText('1 / 14 days done');
  await screen.getByRole('button',/doing better/).tap();
  await screen.getByRole('button','🌿 Diagnose another plant').tap();
  await screen.getByRole('button',help).tap();
  await expect(screen.getByRole('image','Your plant')).toBeHidden();
});

test('invalid and oversized files explain errors and preserve a valid photo', async ({app,screen,browser}) => {
  await app.open(); await screen.getByRole('button',help).tap();
  const input=screen.getByLabel('Choose a plant photo');
  await input.setInputFiles('tests/fixtures/not-image.txt');
  await expect(screen.getByRole('alert').filter({hasText:'Choose a JPG'})).toBeVisible();
  await input.setInputFiles('tests/fixtures/broken.png');
  await expect(screen.getByRole('alert').filter({hasText:'could not be opened'})).toBeVisible();
  await input.setInputFiles('tests/fixtures/plant-before.png');
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  const source=await screen.getByRole('image','Your plant').getAttribute('src');
  await browser.evaluate(() => {
    const zone=document.getElementById('dropzone')!;
    const transfer=new DataTransfer();
    transfer.items.add(new File([new Uint8Array(10*1024*1024+1)],'oversize.png',{type:'image/png'}));
    zone.dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true}));
  });
  await expect(screen.getByRole('alert').filter({hasText:'too large'})).toBeVisible();
  expect(await screen.getByRole('image','Your plant').getAttribute('src')).toBe(source);
});

test('drag drop accepts valid image and canceled selection leaves it unchanged', async ({app,screen,browser}) => {
  await app.open(); await screen.getByRole('button',help).tap();
  await browser.evaluate(async () => {
    const response=await fetch('/tests/fixtures/plant-before.png');
    const transfer=new DataTransfer(); transfer.items.add(new File([await response.blob()],'drop.png',{type:'image/png'}));
    document.getElementById('dropzone')!.dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true}));
  });
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
  await browser.evaluate(() => {
    const input=document.getElementById('photo-input') as HTMLInputElement;
    input.value=''; input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(screen.getByRole('image','Your plant')).toBeVisible();
});

test('corrupt stored state recovers without deleting personal records', async ({app,screen,browser}) => {
  await app.open();
  await browser.evaluate(() => {
    localStorage.setItem('planttriage.plan.legacy','{"checked":[true],"issue":"pests"}');
    localStorage.setItem('planttriage.active.v1','not json');
  });
  await browser.reload();
  await expect(screen.getByRole('heading','Your plant can be saved.')).toBeVisible();
  await expect(screen.getByRole('status').filter({hasText:'could not be restored'})).toBeVisible();
  expect(await browser.evaluate(()=>localStorage.getItem('planttriage.plan.legacy'))).toBe('{"checked":[true],"issue":"pests"}');
  await screen.getByRole('button',demo).tap();
  await expect(screen.getByRole('heading','Overwatering / root rot')).toBeVisible();
});

test('storage unavailable warns while plan remains functional in this tab', async ({app,screen,browser}) => {
  await app.open();
  await browser.evaluate(()=> {Storage.prototype.setItem=()=>{throw new DOMException('fixture quota','QuotaExceededError')};});
  await screen.getByRole('button',demo).tap();
  await screen.getByRole('button',plan).tap();
  await screen.getByRole('button','Mark day 1 done').tap();
  await expect(screen.getByRole('status','Plan progress')).toHaveText('1 / 14 days done');
  await expect(screen.getByRole('status').filter({hasText:'could not be saved'})).toBeVisible();
});

test('all screens fit 320px and expose keyboard selection and reduced motion', async ({app,screen,browser}) => {
  await browser.setViewport({width:320,height:640});
  await app.open();
  const fits=async()=>expect(await browser.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await fits();
  await screen.getByRole('button',help).focus();
  await screen.getByRole('button',help).press('Enter'); await fits();
  await screen.getByRole('button','Skip photo for now').tap(); await fits();
  await expect(screen.getByRole('heading',/wrong/)).toBeFocused();
  await screen.getByRole('button',/Spots on leaves/).press('Enter');
  await screen.getByRole('button','Diagnose →').tap(); await fits();
  await screen.getByRole('button',plan).tap(); await fits();
  await screen.getByRole('button','Mark day 1 done').press('Enter');
  await expect(screen.getByRole('button','Mark day 1 done')).toHaveAttribute('aria-pressed','true');
  await expect(screen.getByRole('button','Mark day 1 done')).toBeFocused();
  await browser.evaluate(() => { window.matchMedia=(()=>({matches:true})) as typeof window.matchMedia; });
  await screen.getByRole('button',/doing better/).tap(); await fits();
  expect(await browser.evaluate(()=>document.querySelector('.confetti')!.childElementCount)).toBe(0);
});

test('recovery photo errors keep before image and permit another selection', async ({app,screen}) => {
  await app.open();
  await screen.getByRole('button',demo).tap();
  await screen.getByRole('button',plan).tap();
  await screen.getByRole('button',/doing better/).tap();
  const input=screen.getByLabel('Add a recovery photo');
  await input.setInputFiles('tests/fixtures/broken.png');
  await expect(screen.getByRole('alert').filter({hasText:'could not be opened'})).toBeVisible();
  await input.setInputFiles('tests/fixtures/plant-after.png');
  await expect(screen.getByRole('image','After')).toBeVisible();
  await expect(screen.getByRole('alert').filter({hasText:'could not be opened'})).toBeHidden();
});

test('malformed stored plan is rejected and invalid saved photo cannot become markup', async ({app,screen,browser}) => {
  await app.open();
  await browser.evaluate(()=>localStorage.setItem('planttriage.active.v1',JSON.stringify({
    version:1,screen:'plan',symptoms:['spots'],issue:'pests',planId:'bad',checked:[true],
  })));
  await browser.reload();
  await expect(screen.getByRole('heading','Your plant can be saved.')).toBeVisible();
  await expect(screen.getByRole('status').filter({hasText:'could not be restored'})).toBeVisible();
  await browser.evaluate(()=>localStorage.setItem('planttriage.active.v1',JSON.stringify({
    version:1,screen:'photo',symptoms:[],photo:'data:image/png;base64,AA==" onerror="document.body.dataset.injected=true',
  })));
  await browser.reload();
  await expect(screen.getByRole('heading','Show me your plant')).toBeVisible();
  await expect(screen.getByRole('image','Your plant')).toBeHidden();
  expect(await browser.evaluate(()=>document.body.dataset.injected)).toBeUndefined();
});
