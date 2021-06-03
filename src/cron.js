const { Telegram } = require('micro-bot');
const { getEncartes } = require('./services/assaiAtacadista');

const {
  getChats,
  getImages,
  addImages,
  updateLastCronExecutionTime,
  setLastImages,
  updateLastImagesTime,
  log,
} = require('./services/db');

const bot = new Telegram(process.env.BOT_TOKEN);

const TIMEOUT = 2500;

async function filterNewImages(imageUrls) {
  if (!imageUrls.length) {
    throw new Error('Nenhum encarte retornado');
  }

  const oldImageUrls = await getImages();
  const newImageUrls = imageUrls.filter((img) => !oldImageUrls.includes(img.imageUrlHD));
  if (!newImageUrls.length) {
    throw new Error('Nenhum novo encarte encontrado');
  }

  return newImageUrls;
}

async function saveImagesName(images) {
  if (!images.length) {
    return [];
  }

  const imagesUrls = images.map((image) => image.imageUrlHD);

  await addImages(imagesUrls);
  await setLastImages(imagesUrls);
  await updateLastImagesTime();

  return images;
}

async function sendImages(images) {
  if (!images.length) {
    return [];
  }

  const chats = await getChats();
  chats.forEach(({ chatId, username }) => {
    bot.sendMessage(chatId, "📢 Novos encartes:");

    const promises = images.map(({ imageUrlHD }) =>
      bot.sendPhoto(chatId, imageUrlHD)
    );

    setTimeout(() => {
      Promise.all(promises)
        .then(() => {
          log(`CRON: Encartes enviados para @${username}.`);
        })
        .catch(() => {
          log(`CRON:ERRO: Ao enviar encartes para @${username}.`);
        });
    }, TIMEOUT);
  });
}

getEncartes()
  .then(filterNewImages)
  .then(saveImagesName)
  .then(sendImages)
  .catch((error) => {
    log(`CRON: ${error}`);
  });

updateLastCronExecutionTime();
