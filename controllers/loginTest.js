// Ebben a modulban a belépési képernyőhöz tartozó induló tesztelés endpoint-ok vannak
module.exports = async function (fastify, options) {
  // Globális változók betöltése
  const {
  axios,
  client,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  parsePhoneNumberFromString,
  handlebars,
  proxyAgent,
  seemeConfig,
  admin,
  firebaseConfig,
  auth,
  db,
  users,
  dbGlobal,
  meds,
  med_jel,
  globalRef,
  sab,
  firebaseApp,
  authK,
  email0,
  } = require('../globals');
  
  // CORS OPTIONS válasz az /api/test endpointhoz
  fastify.options('/api/test', (request, reply) => {
    reply
      .header("Access-Control-Allow-Origin", "https://www.szeretetben.hu")
      .header("Access-Control-Allow-Methods", "GET, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type")
      .code(204)
      .send();
  });

  
  // Indulási szerver teszt
  fastify.get('/api/test', async (request, reply) => {
    console.log('✅ Szerver teszt OK');
    reply
      .header("Access-Control-Allow-Origin", "https://www.szeretetben.hu")
      .header("Access-Control-Allow-Methods", "GET, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type");
    return { message: 'Szerver OK!' };
  });
  
  
  // Firebase elérés teszt
  fastify.get('/api/firebase-test', async (req, reply) => {
    try {
      let userCount = 0;
      let nextPageToken;
      // Felhasználók iterálása oldalakban
      do {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken); // Maximum 1000 felhasználó oldalanként
        userCount += listUsersResult.users.length;
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);
      return reply.status(200).send({ message: 'Firebase teszt lekérés sikeres!', data: userCount });
    } catch (error) {
      console.error('/api/firebase-test – Hiba a Firebase-ből való lekérés során:', error);
      reply.status(500).send({ error: '/api/firebase-test – Hiba történt a Firebase-ből való lekérés során.' });
    }
  });
  
  
  // Firestore db elérés teszt
  fastify.get('/api/db-test', async (req, reply) => {
    try {
      const doc = await db.collection('testCollection').doc('testDoc').get();
      if (!doc.exists) {
        return reply.status(404).send({ message: 'A dokumentum nem található.' });
      }
      const data = doc.data();
      //return reply.status(200).send({ message: 'Firestore OK!', data });
      return reply.status(200).send({ message: 'Firestore OK!' });
    } catch (error) {
      console.error('/api/db-test – Hiba a Firestore elérés során:', error);
      return reply.status(500).send({ message: '/api/db-test – Hiba történt az adatbázis elérésekor.', error: error.message });
    }
  });
  
  
  // Proxy elérés teszt
  fastify.get('/api/proxy-test', async (req, reply) => {
    try {
      const response = await axios.get("https://ifconfig.me", {
        httpsAgent: proxyAgent,
        timeout: 5000,
      });
      console.log("Proxy működik, IP:", response.data);
      return reply.status(200).send({ message: 'Proxy OK!' });
    } catch (error) {
      console.error("/api/proxy-test – Proxy hiba:", error.message);
      return reply.status(500).send({ message: '/api/proxy-test – Proxy elérés hiba:', error: error.message });
    }
  });
  
  
};