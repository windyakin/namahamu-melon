const Promise = require('bluebird');
const Puppeteer = require('puppeteer');

const Namahamu = require('./namahamu.js');

module.exports = class Melon {
  constructor() {
    return new Promise((resolve, reject) => {
      const options = { headless: false };
      if (process.env.CHROME_EXECUTE_PATH) {
        options.executablePath = process.env.CHROME_EXECUTE_PATH;
      }
      Puppeteer.launch(options)
        .then((browser) => {
          this.browser = browser;
          resolve(this);
        }).catch((e) => {
          reject(e);
        });
    });
  }

  async getNamahamu(namahamuId) {
    return new Namahamu(await this.scrapeNamahamuData(namahamuId));
  }

  async scrapeNamahamuData(namahamuId) {
    const page = await this.browser.newPage();
    const [response] = await Promise.all([
      page.goto(`${Melon.baseUrl()}${namahamuId}`),
      page.waitForNavigation(),
    ]);

    if (response.status() === 404) {
      throw new Error('NotFound');
    }

    if (await Melon.isUnderagePage(page)) {
      await Melon.throughUnderage(page);
    }

    try {
      const rows = await Melon.getAttributesContent(page);

      const values = await Promise.all(rows.map(async (row) => {
        const key = (await (await (await row.$('th')).getProperty('innerText')).jsonValue()).trim();
        const value = (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim();
        return { key, value };
      }));
      return values;
    } catch (e) {
      throw e;
    } finally {
      await page.close();
    }
  }

  static async getAttributesContent(page) {
    try {
      const description = await page.$('#description');
      const table = await description.$('table');
      const rows = await table.$$('tr');
      return rows;
    } catch (e) {
      throw e;
    }
  }

  static async isUnderagePage(page) {
    const popup = await page.$('.popup');
    return popup !== null;
  }

  static async throughUnderage(page) {
    await Promise.all([
      page.waitForNavigation(),
      page.click('.f_left.yes'),
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
