import { test, expect } from '@playwright/test';
const base=process.env.ARRAYS_TEST_URL??'http://localhost:3000';

test('landing preview teaches the pointer movement and the explorer remains reachable',async({page})=>{
  await page.goto(base);
  await expect(page.getByRole('heading',{name:/Don’t just solve it/})).toBeVisible();
  await page.screenshot({path:'test-results/landing-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Move the right pointer'}).click();
  await expect(page.locator('.ll-equation')).toContainText('13');
  await page.getByRole('button',{name:'Move the right pointer'}).click();
  await expect(page.locator('.ll-equation')).toContainText('Match found');
  await expect(page.locator('.ll-preview-explanation')).toContainText('[1, 2]');
  await page.getByRole('button',{name:'Try it again'}).click();
  await expect(page.locator('.ll-equation')).toContainText('17');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Explore problems'}).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Your invited Google email')).toBeVisible();
});

test('mobile menu, FAQs and learning links work without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/landing-mobile.png',fullPage:true});
  await page.locator('summary').filter({hasText:'Do I need an account to start?'}).click();
  await expect(page.getByText(/LeetLove is currently in private beta/)).toBeVisible();
  await page.getByRole('button',{name:'Open navigation'}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:/Learning paths/}).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Your invited Google email')).toBeVisible();
});
