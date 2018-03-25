module.exports = class Namahamu {
  constructor(hash) {
    hash.forEach((obj) => {
      switch (obj.key) {
        case 'タイトル':
          this.bookTitle = obj.value;
          break;
        case 'サークル名':
          this.circleName = obj.value;
          break;
        case '作家名':
          this.artistNames = Namahamu.splitArtistNames(obj.value);
          break;
        case 'ジャンル':
          this.genres = Namahamu.splitGenres(obj.value);
          break;
        case '発行日':
          this.tags = obj.value;
          break;
        case '版型・メディア':
          this.bookSize = obj.value;
          break;
        case '総ページ数・CG数・曲数':
          this.pageNumber = parseInt(obj.value, 10);
          break;
        default:
          break;
      }
    });
    return this;
  }

  static splitArtistNames(names) {
    return names.split('\n\n').filter(value => (value !== '他'));
  }

  static splitGenres(genres) {
    return genres.split(' , ');
  }
};
