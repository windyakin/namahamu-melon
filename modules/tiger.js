const Promise = require('bluebird');

const Namahamu = require('./namahamu.js');

module.exports = class Tiger {
  constructor(scrapeDriver) {
    this.driver = scrapeDriver.driver;
    this.page = undefined;
  }

  async getNamahamu(namahamuId) {
    return new Namahamu(await this.scrapeNamahamuData(namahamuId));
  }

  async scrapeNamahamuData(namahamuId) {
    await this.getPage(namahamuId);
    try {
      const bookTitle = (await (await (await this.page.$('h1 > span')).getProperty('innerText')).jsonValue()).trim();
      const tableValues = await this.getFromTableValues();
      return {
        bookTitle,
        ...tableValues,
      };
    } finally {
      await this.page.close();
    }
  }

  async getPage(namahamuId) {
    this.page = await this.driver.newPage();
    const [response] = await Promise.all([
      this.page.goto(`${this.constructor.baseUrl()}${namahamuId}`),
      this.page.waitForNavigation(),
    ]);

    if (response.status() === 404) {
      throw new Error('NotFound');
    }

    if (await this.isUnderagePage()) {
      await this.throughUnderage();
    }
  }

  async getFromTableValues() {
    const rows = await this.page.$$('table.detail4-spec tr');
    const entries = Object.fromEntries(await Promise.all(rows.map(async (row) => {
      const key = (await (await (await row.$('td:nth-child(1)')).getProperty('innerText')).jsonValue()).trim();
      return [key, row];
    })));

    let circleName = '';
    if (Object.prototype.hasOwnProperty.call(entries, 'サークル名')) {
      circleName = (await (await (await entries['サークル名'].$('td:nth-child(2) > span > a')).getProperty('innerText')).jsonValue()).trim();
    }

    let artistNames = [];
    if (Object.prototype.hasOwnProperty.call(entries, '作家')) {
      artistNames = await Promise.all((await entries['作家'].$$('td:nth-child(2) > span > a')).map(async (item) => (await (await item.getProperty('innerText')).jsonValue()).trim()));
    }

    let genres = [];
    if (Object.prototype.hasOwnProperty.call(entries, 'ジャンル/サブジャンル')) {
      genres = await Promise.all((await entries['ジャンル/サブジャンル'].$$('td:nth-child(2) > span > a')).map(async (element) => (await (await element.getProperty('innerText')).jsonValue()).trim()));
    }

    let publishDate = '1970/01/01';
    if (Object.prototype.hasOwnProperty.call(entries, '発行日')) {
      publishDate = (await (await (await entries['発行日'].$('td:nth-child(2) > span > a')).getProperty('innerText')).jsonValue()).trim();
    }

    let bookSize = null;
    let pageNumber = 0;
    if (Object.prototype.hasOwnProperty.call(entries, '種別/サイズ')) {
      const details = (await (await (await entries['種別/サイズ'].$('td:nth-child(2)')).getProperty('innerText')).jsonValue()).trim();
      pageNumber = parseInt(details.replace(/.+ (\d+)p$/, '$1'), 10);
      bookSize = this.constructor.convertToHalfWidthChar(details.replace(/.+\/ ([ＡＢ][５４]) .+/, '$1'));
    }

    return {
      circleName,
      artistNames,
      genres,
      publishDate,
      bookSize,
      pageNumber,
    };
  }

  static convertToHalfWidthChar(str) {
    return str.replace(/[Ａ-Ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
  }

  async isUnderagePage() {
    const popup = await this.page.$('.ui-dialog');
    return popup !== null;
  }

  async throughUnderage() {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('.dialog-btn-yes'),
    ]);
  }

  static baseUrl() {
    // NOTE: Anti Google bots :)
    return Buffer.from('aHR0cHM6Ly9lYy50b3Jhbm9hbmEuanAvdG9yYV9yL2VjL2l0ZW0vCg==', 'base64').toString();
  }

  async close() {
    await this.driver.close();
  }
};
