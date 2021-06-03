const url = require('url');
const path = require('path');
const axios = require('axios');
const { setupCache } = require('axios-cache-adapter');
const cheerio = require('cheerio');

// Cache de 30 minutos
const cache = setupCache({
  maxAge: 30 * 60 * 1000,
});

const http = axios.create({
  adapter: cache.adapter,
});

const URL = 'https://www.assai.com.br/ofertas/pernambuco/assai-jaboatao';
const URL_BASE_IMAGENS_ENCARTES_HD =
  'https://www.assai.com.br/sites/default/files';

function extraiUrlsEncartes(html) {
  const $ = cheerio.load(html);
  const selector = '.field-slideshow-image';
  return $(selector)
    .map((_, el) => el.attribs.src)
    .get();
}

async function getEncartes() {
  const response = await http.get(URL);
  const urls = extraiUrlsEncartes(response.data);

  return urls.map((imageUrl) => {
    const fileName = path.parse(url.parse(imageUrl).pathname).base;
    const imageUrlHD = `${URL_BASE_IMAGENS_ENCARTES_HD}/${fileName}`;

    return {
      fileName,
      imageUrl,
      imageUrlHD,
    };
  });
}

module.exports = {
  getEncartes,
};
