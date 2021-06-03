const { Composer, Telegram } = require('micro-bot');
const { getEncartes } = require('./services/assaiAtacadista');

const {
  chatExists,
  addChat,
  removeChat,
  getLastImages,
  getLastImagesDaysOld,
} = require('./services/db');

const bot = new Composer();
const telegram = new Telegram(process.env.BOT_TOKEN);

function log(msg) {
  if (!process.env.ADMIN_CHATID) {
    return;
  }

  return telegram.sendMessage(process.env.ADMIN_CHATID, msg);
}

bot.start((ctx) => {
  const message =
    `Olá 👋,\n` +
    `Você pode consultar os novos encartes através do comando /encartes ou pode /entrar na nossa lista de assinantes para receber periódicamente! 😁\n\n` +
    `Bot não oficial desenvolvido por @gustavonovaes`;
  ctx.reply(message);
});

bot.command('encartes', async (ctx) => {
  ctx.reply(`Buscando encartes... 🤓`);

  try {
    const images = await getEncartes();
    if (!images.length) {
      return ctx.reply(`No momento não temos encartes promocionais 😊`);
    }

    const sendPromises = images.map(({ imageUrlHD }) =>
      telegram.sendPhoto(ctx.chat.id, imageUrlHD)
    );

    Promise.all(sendPromises).catch((err) => {
      log(err);
      return ctx.reply(`Não consegui enviar os encartes... 😔`);
    });
  } catch (e) {
    console.error(e);
    return ctx.reply(`Não consegui obter os encartes... 😔`);
  }
});

bot.command('entrar', async (ctx) => {
  const isChatExists = await chatExists(ctx.chat.id);
  if (isChatExists) {
    return ctx.reply(`Você já entrou 👍`);
  }

  if (ctx.from.is_bot) {
    return ctx.reply(`🤖`);
  }

  await addChat(ctx.chat.id, Date.now(), ctx.from.username);

  const message = `Você entrou! 🥳🥳\nDigite /sair caso mude de ideia!`;
  ctx.reply(message);

  const lastImages = await getLastImages();
  const imagesDaysOld = await getLastImagesDaysOld();
  if (lastImages.length && imagesDaysOld < 3) {
    const message =
      lastImages.length > 1 ? 'Últimos encartes:' : 'Último encarte:';
    ctx.reply(message);

    const promises = lastImages.map((imageUrl) =>
      telegram.sendPhoto(ctx.chat.id, imageUrl)
    );

    Promise.all(promises).catch(() => {
      ctx.reply(`Não consegui enviar os últimos encartes... 😔`);
    });
  }
});

bot.command('sair', async (ctx) => {
  await removeChat(ctx.chat.id);

  ctx.reply('Você saiu e não receberá mais os encartes. 👋😊');
});

module.exports = bot;
