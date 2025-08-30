// Ebben a modulban az emailek tényleges összefűzése, renderelése és kiküldése történik
// Függvények exportálása
module.exports = { renderEmailTemplate, sendEmail };

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

// Email renderelése (sablon összefűzése az adatokkal)
async function renderEmailTemplate(templateId, data) {
  try {
    // Lekérjük a dokumentumot a megadott templateId alapján
    const doc = await sab.doc(templateId).get();
    if (!doc.exists) {
      throw new Error(`Nem található az email sablon: ${templateId}`);
    }
    const templateHtml = doc.data().htmlContent; // sablon lekérése
    const template = handlebars.compile(templateHtml); // Handlebars sablon összeállítása
    return template(data); // A dinamikus adatokkal rendereljük a sablont
  } catch (error) {
    console.error('Hiba a sablon renderelésekor:', error);
    throw error;
  }
}


// Email küldése
async function sendEmail(htmlContent, data) {
  console.log("Email kiküldése:", data.to)
  try {
    const mailOptions = {
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: htmlContent
    };
    const info = await email0.sendMail(mailOptions);
    console.log('Email sikeresen elküldve:', info.response);
    return info;
  } catch (error) {
    console.error('sendEmail – Hiba az email küldésekor:', error);
    throw error;
  }
}