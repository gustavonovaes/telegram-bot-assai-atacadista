const pgp = require('pg-promise')({
  promiseLib: require('bluebird'),
});
pgp.pg.defaults.ssl = true;
pgp.pg.defaults.ssl = {
  rejectUnauthorized: false,
};

const db = pgp(process.env.DATABASE_URL);

async function addChat(chatId, date, username) {
  const sql = `update data
               set chats = chats || '[{
                 "chatId": ${chatId},
                 "date": ${date},
                 "username": "${username}"
               }]'::jsonb
               where id = 1`;

  return db.none(sql);
}

async function removeChat(chatId) {
  const sql = `update data
               set chats = chats - cast((
                 select position - 1
                 from data, jsonb_array_elements(chats) with ordinality arr(item_object, position) 
                 where item_object->>'chatId' = '$1'
               ) as int)`;

  return db.none(sql, [chatId]);
}

async function getChats() {
  const sql = `select chats 
               from data`;

  return db.one(sql).then((data) => data.chats);
}

async function chatExists(chatId) {
  const sql = `select true as exists
               from data, jsonb_array_elements(chats) obj
               where cast(obj->>'chatId' as int) = $1`;

  return db.oneOrNone(sql, [chatId]).then((data) => !!data);
}

async function getImages() {
  const sql = `select images 
               from data`;

  return db.one(sql).then((data) => data.images);
}

async function addImages(images) {
  const parsedImages = images.map((image) => `"${image}"`).join(', ');

  const sql = `update data
               set images = images || '[${parsedImages}]'::jsonb
               where id = 1`;

  return db.none(sql);
}

async function getLastImages() {
  const sql = `select lastimages 
               from data`;

  return db.one(sql).then((data) => data.lastimages);
}

async function setLastImages(images) {
  const parsedImages = images.map((image) => `"${image}"`).join(', ');

  const sql = `update data
               set lastimages = '[${parsedImages}]'::jsonb
               where id = 1`;

  return db.none(sql);
}

function getLastImagesDaysOld() {
  const sql = `SELECT DATE_PART('day', current_date - coalesce(lastimagestime, '1993-02-07'::timestamp))
               from data;`;

  return db.one(sql).then((data) => data.date_part);
}

function updateLastImagesTime() {
  const sql = `update data
               set lastimagestime = now()
               where id = 1`;

  return db.none(sql);
}

function updateLastCronExecutionTime() {
  const sql = `update data
               set lastcronexecutiontime = now()
               where id = 1`;

  return db.none(sql);
}

function log(message) {
  const date = new Date().toISOString();
  const parsedMessage = `"${date}: ${message}"`;

  const sql = `update data
              set log = log || '[${parsedMessage}]'::jsonb
              where id = 1`;

  return db.none(sql);
}

module.exports = {
  addChat,
  removeChat,
  getChats,
  chatExists,
  getImages,
  addImages,
  setLastImages,
  getLastImages,
  getLastImagesDaysOld,
  updateLastImagesTime,
  updateLastCronExecutionTime,
  log,
};
