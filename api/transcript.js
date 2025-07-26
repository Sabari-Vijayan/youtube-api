import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { videoId } = req.body;
  const browser = await puppeteer.launch({ args: chrome.args, executablePath: await chrome.executablePath });
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`);
  await page.click('button[aria-label="More actions"]');
  await page.click('ytd-menu-service-item-renderer yt-formatted-string:contains("Open transcript")');
  // scrape from page ...
  await browser.close();
  res.json({ transcript });
}
