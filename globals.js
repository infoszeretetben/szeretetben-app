// Modulok betöltése
const fastify = require('fastify')({ logger: true });
const path = require('path');
require('dotenv').config(); // Környezeti változók betöltése
const fastifyStatic = require('@fastify/static');
const fastifyFormbody = require('@fastify/formbody');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { initializeApp } = require("firebase/app");
const { getAuth, sendPasswordResetEmail, sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const handlebars = require('handlebars');
const httpsProxyAgent = require("https-proxy-agent");
const proxy = {
  host: process.env.PROXY_IP,
  port: process.env.PROXY_PORT,
  auth: {
    username: process.env.PROXY_USER,
    password: process.env.PROXY_PASS,
  },
};
//const proxyAgent = new httpsProxyAgent(`http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`);
const proxyAgent = (proxy.host && proxy.port)
  ? new httpsProxyAgent(`http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`)
  : undefined;
// Statikus fájlok kiszolgálásához
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});
// JSON és form adatok támogatásához
fastify.register(fastifyFormbody);
// FIREBASE app kiszolgálása
const admin = require('firebase-admin');
// Firebase konfigurációs változók betöltése az .env-ből
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};
/*
// Firebase inicializálása admin módban
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
*/
// Firebase inicializálása admin módban (globals/server.js környéke)
const admin = require('firebase-admin');
const crypto = require('crypto');
function loadFirebaseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT nincs beállítva!');
  }
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT nem érvényes JSON. ' + e.message);
  }
  // Sorvégek helyrehozása (ha a .env-ben \\n van)
  if (typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  } else {
    throw new Error('serviceAccount.private_key hiányzik vagy nem string.');
  }
  // Gyors formai ellenőrzés
  if (!sa.client_email || !sa.project_id || !sa.private_key.includes('BEGIN PRIVATE KEY')) {
    throw new Error('serviceAccount kötelező mezők hiányoznak vagy hibásak.');
  }
  // IDEIGLENES: kockázatmentes „ujjlenyomat” log (nem a kulcsot logoljuk!)
  const pkFingerprint = crypto.createHash('sha256').update(sa.private_key).digest('hex').slice(0, 12);
  console.log(`[firebase] service account OK | project=${sa.project_id} | email=${sa.client_email} | pk#=${pkFingerprint}`);
  return sa;
}
const serviceAccount = loadFirebaseServiceAccount();
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
//Twilio konfig key-ek
const seemeConfig = {
  url: process.env.SEEME_GATEWAY_URL,
  api: process.env.SEEME_GATEWAY_API,
  number: process.env.SEEME_SENDER_PHONE_NR, // nem kötelező paraméter
};
const webpush = require('web-push');

const auth = admin.auth(); // Hitelesítés kezeléséhez
const db = admin.firestore(); // Adatbázis elérés konfig
const users = db.collection('users');  // Adatbázis users hivatkozása
const dbGlobal = db.collection('global');  // Adatbázis users hivatkozása
const meds = db.collection('meds');  // Adatbázis meds hivatkozása
const med_jel = db.collection('med_jelentkezok');  // Adatbázis meditációra jelentkezők hivatkozása
const globalRef = db.collection('global').doc('lastId');  // Adatbázis lastId doc hivatkozása
const sab = db.collection('emailSablonok');
// Firebase inicializálása kliens módban
const firebaseApp = initializeApp(firebaseConfig);
const authK = getAuth(firebaseApp);
const nodemailer = require('nodemailer');
const email0 = nodemailer.createTransport({
  service: 'gmail', // vagy 'Gmail'
  auth: {
    user: process.env.EMAIL_USER, // a Google fiók email címe
    pass: process.env.EMAIL_PASS  // a fiók jelszava vagy alkalmazásspecifikus jelszó
  }
});

// Változók exportálása
module.exports = {
  fastify,
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
  webpush,
};
