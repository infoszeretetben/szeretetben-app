// fetch változók globális definíciója (mielőbb a legelején!)
global.fetch = require('node-fetch');
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;
// Globális változók betöltése
const {
  fastify,
  axios,
  client,
  twilioClient,
  twilioSSID,
  admin,
  firebaseConfig,
  auth,
  db,
  users,
  dbGlobal,
  meds,
  med_jel,
  globalRef,
  firebaseApp,
  authK,
} = require('./globals');
// iframe beágyazás elleni védelem
fastify.addHook('onSend', async (request, reply) => {
  reply.header('Content-Security-Policy', "frame-ancestors 'none';");
});
// Többi script fájlom betöltése a routes-on keresztül
fastify.register(require('./routes'));
fastify.register(require('@fastify/cors'), {
  origin: ["https://www.szeretetben.hu"], // Engedélyezett domain
  methods: ["GET", "POST", "OPTIONS"], // Engedélyezett HTTP metódusok
  allowedHeaders: ["Content-Type"], // Engedélyezett fejlécek
});


//const cron = require('node-cron');
//cron.schedule('* * * * *', () => {
//  console.log('Ez az üzenet minden percben megjelenik.');
//});


// Szerver indítása
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('✅ Szerver fut a 3000-es porton.');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();


// Szerver ébren tartása
fastify.get('/api/wakeup', async (request, reply) => {
  console.log('Szerver wakeup call');
  return { message: 'Szerver ébren!' };
});