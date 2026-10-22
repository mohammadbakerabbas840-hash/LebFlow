import { test, expect } from '@playwright/test';

for (const locale of ['en','ar','fr'] as const) {
  test(`assistant renders citations, handles failures and stays responsive in ${locale}`,async({page})=>{
    await page.setViewportSize({width:375,height:900});
    await page.route('**/api/v1/me',route=>route.fulfill({json:{data:{id:999,name:'Sample User',email:'sample@example.com',locale,dob:'1995-01-01',idNumberMasked:'***123',documents:[],identityVerified:false}}}));
    await page.route('**/api/v1/preferences',route=>route.fulfill({json:{data:{savedServices:[],readNotifications:[],appointmentAlerts:true,expiryAlerts:true,incompleteAlerts:true,updateAlerts:true}}}));
    await page.route('**/api/v1/cases',route=>route.fulfill({json:{data:[]}}));
    await page.route('**/api/v1/notifications',route=>route.fulfill({json:{data:[]}}));
    let fail=false;
    await page.route('**/api/v1/ai/chat',async route=>{
      expect(route.request().postDataJSON()).toMatchObject({locale,serviceId:'passport'});
      await route.fulfill(fail ? {status:503,json:{code:'assistant_unavailable'}} : {json:{answer:'<script>window.injected = true</script> Check the official requirements.',status:'answered',citations:[{id:'service:passport',title:'Passport guide',evidenceLevel:'core',lastReviewedAt:null,content:{sourceNote:'Requirements may change.'},sources:[{title:'General Security',url:'https://www.general-security.gov.lb/ar/posts/11'}]}]}});
    });
    await page.goto('/#/assistant?service=passport');
    const assistant=page.locator('.ai-assistant');
    await expect(assistant).toHaveClass(/ai-assistant--page/);
    await expect(assistant.getByRole('combobox')).toHaveValue('passport');
    await expect(page.locator('nav [aria-current=page]')).toHaveText({en:'AI assistant',ar:'المساعد الذكي',fr:'Assistant IA'}[locale]);
    await assistant.locator('textarea').fill('What do I need to renew my passport?');
    await assistant.locator('form button').click();
    await expect(assistant.locator('.ai-answer')).toContainText('<script>window.injected = true</script>');
    await expect(assistant.locator('.ai-question')).toHaveText(/What do I need to renew my passport/);
    expect(await page.evaluate(()=>Reflect.get(window,'injected'))).toBeUndefined();
    await expect(assistant.getByRole('link',{name:'General Security'})).toHaveAttribute('href','https://www.general-security.gov.lb/ar/posts/11');
    for (const width of [375,768,1440]) {
      await page.setViewportSize({width,height:1000});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
      await page.screenshot({path:`artifacts/screenshots/assistant-${locale}-${width}.png`,fullPage:true});
    }
    fail=true;
    await assistant.locator('textarea').fill('What about renewing it for a child?');
    await assistant.locator('form button').click();
    await expect(assistant.getByRole('alert')).toBeVisible();
    await expect(assistant.locator('.ai-answer')).toHaveCount(0);
  });
}

test('Laravel serves the built frontend directly and the assistant requires sign-in',async({page,request})=>{
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.ai-assistant')).toHaveCount(0);
  await page.locator('nav').getByRole('button',{name:'AI assistant',exact:true}).click();
  await expect(page).toHaveURL(/#\/assistant$/);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Ask LebFlow',exact:true})).toBeVisible();
  const assistant=page.locator('.ai-assistant');
  await assistant.getByRole('button',{name:'Sign in to ask a question'}).click();
  await expect(page).toHaveURL(/#\/account$/);
  expect((await request.get('/api/v1/connection-test')).status()).toBe(404);
  expect((await request.get('/api/v1/unknown')).status()).toBe(404);
});

test('assistant page supports examples, follow-ups, clearing and service-specific navigation',async({page})=>{
  await page.route('**/api/v1/me',route=>route.fulfill({json:{data:{id:999,name:'Sample User',email:'sample@example.com',locale:'en',documents:[]}}}));
  await page.route('**/api/v1/preferences',route=>route.fulfill({json:{data:{savedServices:[],readNotifications:[],appointmentAlerts:true,expiryAlerts:true,incompleteAlerts:true,updateAlerts:true}}}));
  await page.route('**/api/v1/cases',route=>route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/notifications',route=>route.fulfill({json:{data:[]}}));
  const requests: {message:string;history:{role:string;content:string}[];serviceId:string}[]=[];
  await page.route('**/api/v1/ai/chat',route=>{
    requests.push(route.request().postDataJSON());
    return route.fulfill({json:{answer:'Check the relevant civil registry office.',status:'insufficient_evidence',citations:[]}});
  });
  await page.goto('/#/assistant');
  const assistant=page.locator('.ai-assistant');
  await assistant.getByRole('button',{name:'How do I apply for my child’s first ID?',exact:true}).click();
  await expect(assistant.locator('textarea')).toHaveValue('How do I apply for my child’s first ID?');
  await expect(assistant.locator('textarea')).toBeFocused();
  expect(requests).toHaveLength(0);
  await assistant.getByRole('button',{name:'Ask',exact:true}).click();
  await expect(assistant.locator('.ai-answer')).toContainText('The stored information is insufficient');
  expect(requests[0]).toMatchObject({serviceId:'identity',history:[]});
  await assistant.locator('textarea').fill('What about a newborn?');
  await assistant.getByRole('button',{name:'Ask',exact:true}).click();
  await expect(assistant.locator('.ai-question')).toContainText('What about a newborn?');
  expect(requests[1].history).toEqual([
    {role:'user',content:'How do I apply for my child’s first ID?'},
    {role:'assistant',content:'Check the relevant civil registry office.'},
  ]);
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('What about a newborn?');
  await assistant.getByText('Recent conversation',{exact:true}).click();
  await assistant.getByRole('button',{name:'Clear conversation'}).click();
  await expect(assistant.locator('.ai-answer')).toHaveCount(0);
  await page.goto('/#/services/passport');
  await assistant.locator('summary').click();
  await assistant.getByRole('button',{name:'Open the AI assistant page'}).click();
  await expect(page).toHaveURL(/#\/assistant\?service=passport$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(assistant.getByRole('combobox')).toHaveValue('passport');
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goForward();
  await expect(assistant.getByRole('combobox')).toHaveValue('passport');
  await page.goto('/#/assistant?service=not-a-real-service');
  await expect(assistant.getByRole('combobox')).toHaveValue('');
});

test('research mode sends the explicit choice and renders inline official citations',async({page})=>{
  await page.route('**/api/v1/me',route=>route.fulfill({json:{data:{id:999,name:'Sample User',email:'sample@example.com',locale:'en',dob:'1995-01-01',idNumberMasked:null,documents:[],identityVerified:false}}}));
  await page.route('**/api/v1/preferences',route=>route.fulfill({json:{data:{savedServices:[],readNotifications:[],appointmentAlerts:true,expiryAlerts:true,incompleteAlerts:true,updateAlerts:true}}}));
  await page.route('**/api/v1/cases',route=>route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/notifications',route=>route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/ai/chat',route=>{
    expect(route.request().postDataJSON().research).toBe(true);
    const answer='Check the civil registry. [source]';
    return route.fulfill({json:{answer,status:'researched',citations:[],annotations:[{start:answer.indexOf('[source]'),end:answer.length,title:'DGCS official guidance',url:'https://www.dgcs.gov.lb/arabic/identitycard'}]}});
  });
  await page.goto('/#/services/identity');
  const assistant=page.locator('.ai-assistant');
  await assistant.locator('summary').click();
  await assistant.getByRole('checkbox').check();
  await assistant.locator('textarea').fill('How do I apply for a child’s first ID?');
  await assistant.locator('form button').click();
  await expect(assistant.getByRole('link',{name:'[1: DGCS official guidance]'})).toHaveAttribute('href','https://www.dgcs.gov.lb/arabic/identitycard');
});
