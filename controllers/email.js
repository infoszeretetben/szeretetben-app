// Ebben a modulban az email értesítések zajlanak
const emailsend = require('./emailsend.js');
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
  
  
  // Email készítése sablonból, majd kiküldés
  fastify.post('/api/renderEmail', async (request, reply) => {
    const { templateId, data } = request.body;
    console.log('Email készítése:', templateId, data);
    try {
      const renderedHtml = await emailsend.renderEmailTemplate(templateId, data);
      const valasz = await emailsend.sendEmail(renderedHtml, data);
      return reply.status(200).send({
        message: 'Email készítése sikeres',
        info: valasz,
      });
    } catch (error) {
      console.error('/api/renderEmail – Hiba az email készítésekor:', error);
      return reply.status(401).send({
        message: 'Email készítése sikertelen',
        error: error.message,
      });
    }
  });
  
  
  
}; // modul exp.