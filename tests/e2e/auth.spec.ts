import { test, expect } from '@playwright/test';
const base=process.env.ARRAYS_TEST_URL??'http://localhost:3000';

test('owner sign-in and signup have no password or public registration bypass',async({page})=>{
  for(const route of ['/login','/signup']){
    await page.goto(base+route);
    await expect(page.getByLabel('Your invited Google email')).toBeVisible();
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Join the waitlist',exact:true})).toBeVisible();
  }
  await page.goto(base+'/login');await page.screenshot({path:'test-results/login-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/signup');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/signup-mobile.png',fullPage:true});
});

test('anonymous visitors cannot open workspace routes or retrieve private artifacts',async({page,request})=>{
  for(const route of ['/arrays','/arrays/maximum','/problems','/learn/maximum-average-subarray-i','/create','/s/not-a-public-beta']){
    await page.goto(base+route);await expect(page).toHaveURL(/\/login/);
  }
  const response=await request.get(base+'/api/studio?public=00000000-0000-0000-0000-000000000000');
  expect([401,403,503]).toContain(response.status());
  const execution=await request.post(base+'/api/arrays/run',{headers:{Origin:base},data:{mission:'maximum',source:'pass'}});
  expect([401,403,503]).toContain(execution.status());
});

test('other emails go to the waitlist without an OAuth redirect or account creation',async({request})=>{
  const response=await request.post(base+'/auth/google',{headers:{Origin:base},form:{email:'another.student@gmail.com',next:'https://evil.test'},maxRedirects:0});
  expect(response.status()).toBe(303);expect(response.headers().location).toBe(base+'/waitlist?notice=restricted');
  const denied=await request.post(base+'/auth/google',{headers:{Origin:'https://evil.test'},form:{email:'sharmaeditzayush@gmail.com'},maxRedirects:0});
  expect(denied.status()).toBe(403);
});

test('callback errors stay local and logout rejects cross-origin requests',async({request})=>{
  const callback=await request.get(base+'/auth/callback?next=https://evil.test',{maxRedirects:0});
  expect([303,307]).toContain(callback.status());
  expect(callback.headers().location).toMatch(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/(login|waitlist)`));
  const logout=await request.post(base+'/auth/logout',{headers:{Origin:'https://evil.test'},maxRedirects:0});
  expect(logout.status()).toBe(403);
});

test('waitlist consent and service failures never display a false success',async({page,request})=>{
  await page.goto(base+'/waitlist?notice=restricted');
  await expect(page.getByRole('status')).toContainText('invite-only');
  await expect(page.getByLabel('Your email address')).toBeVisible();
  await expect(page.getByRole('button',{name:'Join the waitlist',exact:true})).toBeDisabled();
  const response=await request.post(base+'/api/waitlist',{headers:{Origin:base},data:{email:'bad',consent:false}});
  expect(response.status()).toBe(400);
  const forged=await request.post(base+'/api/waitlist',{headers:{Origin:'https://evil.test'},data:{email:'student@gmail.com',consent:true}});
  expect(forged.status()).toBe(403);
  await page.screenshot({path:'test-results/waitlist-desktop.png',fullPage:true});
});
