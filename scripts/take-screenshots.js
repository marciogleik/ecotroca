import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('Taking screenshot of landing page...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'public/screenshot-landing.png', fullPage: true });

  console.log('Taking screenshot of login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshot-login.png' });

  // Helper to login
  const login = async (email, password) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for auth and redirect
  };

  console.log('Taking screenshot of prefeitura dashboard...');
  await login('prefeitura@ecotroca.com', 'prefeitura123');
  await page.screenshot({ path: 'public/screenshot-prefeitura.png' });

  console.log('Taking screenshot of escola dashboard...');
  await login('escola@ecotroca.com', 'escola123');
  await page.screenshot({ path: 'public/screenshot-escola.png' });

  console.log('Taking screenshot of sicredi dashboard...');
  await login('sicredi@ecotroca.com', 'sicredi123');
  await page.screenshot({ path: 'public/screenshot-sicredi.png' });

  await browser.close();
  console.log('Done!');
})();
