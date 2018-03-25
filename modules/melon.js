const Promise = require('bluebird');
const Puppeteer = require('puppeteer');

module.exports = class Melon {
  constructor() {
    return new Promise((resolve, reject) => {
      Puppeteer.launch()
        .then((browser) => {
          this.browser = browser;
          resolve(this);
        }).catch((e) => {
          reject(e);
        });
    });
  }

  async getBookAttributes(bookId) {
    const page = await this.browser.newPage();
    await page.goto(`${Melon.baseUrl()}${bookId}`);

    const isUnderage = await Melon.isUnderagePage(page);

    if (isUnderage) {
      await Melon.throughUnderage(page);
    }

    const description = await page.$('#description');
    const table = await description.$('table');
    const rows = await table.$$('tr');

    const values = await Promise.all(rows.map(async (row) => {
      const key = (await (await (await row.$('th')).getProperty('innerText')).jsonValue()).trim();
      const value = (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim();
      return { key, value };
    }));

    return values;
  }

  static async isUnderagePage(page) {
    const popup = await page.$('.popup');
    return popup !== null;
  }

  static async throughUnderage(page) {
    await Promise.all([
      page.click('.f_left.yes'),
      page.waitForNavigation(),
    ]);
  }

  static baseUrl() {
    // NOTE: Anti Google bots :)
    return Buffer.from('aHR0cHM6Ly93d3cubWVsb25ib29rcy5jby5qcC9kZXRhaWwvZGV0YWlsLnBocD9wcm9kdWN0X2lkPQ==', 'base64').toString();
  }

  async close() {
    await this.browser.close();
  }
};
