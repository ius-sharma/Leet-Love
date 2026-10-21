import { test, expect } from '@playwright/test';
const base=process.env.ARRAYS_TEST_URL??'http://localhost:3000';
// Protected journeys require a real owner session. No production auth bypass exists.
test.use({storageState:process.env.LEETLOVE_E2E_OWNER_STATE});
test.skip(!process.env.LEETLOVE_E2E_OWNER_STATE,'Set LEETLOVE_E2E_OWNER_STATE to an authenticated owner browser-state file.');
test('chapter navigation, guided correction, persistence, and honest unavailable runner',async({page})=>{
  await page.goto(`${base}/arrays`);
  await expect(page.getByRole('heading',{name:/Make arrays/})).toBeVisible();
  await expect(page.locator('.array-mission-card')).toHaveCount(5);
  await page.getByRole('link',{name:/Heaviest crate/}).click();
  await page.getByRole('button',{name:'Let me try'}).click();
  await page.getByRole('button',{name:'Always start at zero'}).click();
  await expect(page.getByRole('status').filter({hasText:/Try again/})).toBeVisible();
  await page.getByRole('button',{name:'Use the first value'}).click();
  await page.getByRole('button',{name:'Update the record'}).click();
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Keep the record'}).click();
  await expect(page.getByRole('heading',{name:/The maximum is 9/})).toBeVisible();
  await page.getByRole('button',{name:'Turn the idea into code'}).click();
  await page.getByRole('textbox',{name:'Python solution'}).fill('class Solution:\n    def findMax(self, nums):\n        return max(nums)');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Python solution'})).toHaveValue(/return max/);
  await page.getByRole('navigation',{name:'Learning stages'}).getByRole('button',{name:/Check/}).click();
  await page.getByRole('radio',{name:'-8, the first value'}).check();
  await page.getByRole('button',{name:'Check my understanding'}).click();
  await expect(page.getByRole('status').filter({hasText:/Run your current code/})).toBeVisible();
  await expect(page.getByText('One more idea you can use.')).toHaveCount(0);
});
test('every guided mission reaches its correct end and mobile has no document overflow',async({page})=>{
  for(const [id,choices] of Object.entries({patrol:['Add 4','Add 9','Add 2','Add 7','Add 5'],reverse:['Swap both ends','Swap both ends'],pair:['Store this crate and continue','Store this crate and continue','Return the matching pair'],'sorted-pair':['Move left inward','Move left inward','Return these positions']})){
    await page.goto(`${base}/arrays/${id}`);await page.getByRole('button',{name:'Let me try'}).click();
    for(const name of choices)await page.getByRole('button',{name,exact:true}).click();
    await expect(page.getByRole('button',{name:'Turn the idea into code'})).toBeVisible();
  }
  await page.setViewportSize({width:390,height:844});
  for(const route of ['/arrays','/arrays/maximum']){await page.goto(base+route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
});

test('successful runner response enables completion; editing invalidates its verdict',async({page})=>{
  // UI contract fixture only: no actual Supabase or sandbox traffic in this test.
  const token=[Buffer.from('{"alg":"HS256"}').toString('base64url'),Buffer.from(JSON.stringify({sub:'test-user',exp:4102444800})).toString('base64url'),'test'].join('.');
  await page.addInitScript(({token})=>{const fixture={access_token:token,refresh_token:'test',expires_at:4102444800,token_type:'bearer',user:{id:'test-user'}};document.cookie='sb-arrays-test-auth-token=base64-'+btoa(JSON.stringify(fixture))+'; Path=/; SameSite=Lax';},{token});
  await page.route('https://arrays-test.supabase.co/**',r=>r.fulfill({json:{}}));
  await page.route('**/api/arrays/run',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{ready:true,url:'https://arrays-test.supabase.co',anonKey:'fixture'}});
    const {source}=route.request().postDataJSON();
    await route.fulfill({json:{source,passed:true,checks:[{label:'Fixture check',input:[[4,9]],passed:true,actual:9,expected:9}],trace:{version:1,sourceHash:'fixture',input:[[4,9]],events:[{id:0,line:2,kind:'before',locals:{nums:[4,9]}},{id:1,line:3,kind:'return',locals:{nums:[4,9]},result:9}],result:9,complete:true,runtime:'fixture'}}});
  });
  await page.goto(`${base}/arrays/maximum`);
  await page.getByRole('button',{name:'I know this concept — go to code'}).click();
  const editor=page.getByRole('textbox',{name:'Python solution'});
  await editor.fill('class Solution:\n    def findMax(self, nums):\n        return max(nums)');
  await page.getByRole('button',{name:'Run checks'}).click();
  await expect(page.getByRole('button',{name:'Final check'})).toBeVisible();
  await editor.fill('class Solution:\n    def findMax(self, nums):\n        return 0');
  await expect(page.getByRole('button',{name:'Final check'})).toHaveCount(0);
  await editor.fill('class Solution:\n    def findMax(self, nums):\n        return max(nums)');
  await page.getByRole('button',{name:'Run checks'}).click();
  await page.getByRole('button',{name:'Final check'}).click();
  await page.getByRole('radio',{name:'-8, the first value'}).check();
  await page.getByRole('button',{name:'Check my understanding'}).click();
  await expect(page.getByRole('heading',{name:'One more idea you can use.'})).toBeVisible();
});
