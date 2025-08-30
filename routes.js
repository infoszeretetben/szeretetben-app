module.exports = async function (fastify) {
  // A controller-ek regisztrálása
  fastify.register(require('./controllers/loginTest')); // induláskori tesztek
  fastify.register(require('./controllers/login')); // belépés kezelése
  fastify.register(require('./controllers/user')); // felhasználó kezelése
  fastify.register(require('./controllers/med')); // meditációk kezelése
  fastify.register(require('./controllers/email')); // emailek kezelése
};
