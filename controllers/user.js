// Ebben a modulban a felhasználó adataival kapcsolatos dolgok vannak
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
  
  
  // Előzetes user authentikáció – megnézzük, hogy egyezik-e a kért userId és fb_uid
  // visszatérési érték true, ha igen, false, ha nem
  fastify.post('/api/fbUidAuth', async (request, reply) => {
    const { userId, fb_uid } = request.body;
    console.log('Basic user authentikáció...', userId, fb_uid);
    try {
      const userDoc = await users.doc(userId).get();
      if (!userDoc.exists) {
        return reply.status(401).send({
          message: 'User nem található az adatbázisban',
          auth: false,
          error: 'User nem található az adatbázisban',
        });
      }
      // Sikerült lekérni a user adatokat
      console.log('A user létezik...');
      const user_fb_uid = userDoc.data().fb_uid;
      const authResult = user_fb_uid === fb_uid ? true : false;
      const myMessage = authResult ? "Authentikáció sikeres!" : "Authentikáció sikertelen!"
      console.log(myMessage);
      return reply.status(200).send({
        message: myMessage,
        auth: authResult,
      });
    } catch (error) {
      console.error('/api/fbUidAuth – Hiba az firebase adatlekérés során:', error);
      return reply.status(401).send({
        message: 'Sikertelen adatlekérés',
        auth: false,
        error: error.message,
      });
    }
  });
                
                
  // User adatlekérés – egy adott user összes adatának lekérése
  fastify.post('/api/getUserData', async (request, reply) => {
    const { userId } = request.body;
    console.log('User adatlekérés:', userId);
    try {
      const userDoc = await users.doc(userId).get();
      if (!userDoc.exists) {
        return reply.status(401).send({
          message: 'User nem található az adatbázisban',
          userId: userId,
          error: 'User nem található az adatbázisban',
        });
      }
      return reply.status(200).send({
        message: 'Sikeres adatlekérés',
        userId: userId,
        data: userDoc.data(),   // kiadjuk a teljes objektumot
      });
    } catch (error) {
      console.error('/api/getUserData – Hiba az firebase adatlekérés során:', error);
      return reply.status(401).send({
        message: 'Sikertelen adatlekérés',
        userId: userId,
        error: error.message,
      });
    }
  });
  
  
  // User adatmódosítás
  fastify.post('/api/saveUserData', async (request, reply) => {
    const { askedUserId, key, newValue } = request.body;
    console.log('User adatmentés:', askedUserId, key, newValue, typeof askedUserId);
    const USER_ID = String(askedUserId);
    try {
      const userDoc = await users.doc(USER_ID).get();
      if (!userDoc.exists) {
        return reply.status(401).send({
          message: 'User nem található az adatbázisban',
          userId: askedUserId,
          error: 'User nem található az adatbázisban',
        });
      }
      // itt mentjük el az új adatot
      await users.doc(USER_ID).update({
        [key]: newValue, // key-value, ami bejön
      });
      console.log('Sikeres adatmentés');
      return reply.status(200).send({
        message: 'Sikeres mentés',
        userId: askedUserId,
      });
    } catch (error) {
      console.error('/api/getUserData – Hiba a user adatmentés során:', error);
      return reply.status(401).send({
        message: 'Sikertelen mentés',
        userId: askedUserId,
        error: error.message,
      });
    }
  });
  
  
  // User Firebase email módosítás + új password
  fastify.post('/api/changeEmail', async (request, reply) => {
    const { firebase_uid, newEmail, newPassword } = request.body;
    console.log('Brávó! User email címet módosít:', firebase_uid, newEmail, newPassword);
    try {
      
      await auth.updateUser(firebase_uid, {
          email: newEmail,
          password: newPassword,
          emailVerified: false,
      });
      console.log(`Felhasználó e-mailje és jelszava frissítve: ${newEmail}`);
      // Szimulált bejelentkezett felhasználót hozunk létre, hogy ki tudjuk küldeni az email-t
      // Felhasználó szimulált bejelentkeztetése a megadott email és jelszó alapján
      const userCredential = await signInWithEmailAndPassword(authK, newEmail, newPassword);
      const user = userCredential.user;
      // Küldjük ki a verifikációs emailt a Firebase template-tel
      await sendEmailVerification(user);
      // Return
      return reply.status(200).send({
        message: 'Sikeres email-jelszó módosítás',
        email: newEmail,
      });
    } catch (error) {
      console.error('/api/changeEmail – Hiba az firebase adatlekérés során:', error);
      return reply.status(401).send({
        message: 'Sikertelen email-jelszó módosítás',
        email: newEmail,
        error: error.message,
      });
    }
  });
  
  
  // User Firebase jelszó módosítás kérelem kezelése
  fastify.post('/api/changePassword', async (request, reply) => {
    const { email } = request.body;
    console.log('Brávó! User jelszót módosít:', email);
    try {
      // Ellenőrzés, hogy létezik-e a felhasználó
      const userRecord = await admin.auth().getUserByEmail(email);
      // Jelszó emlékeztető kiküldése
      //const resetLink = await admin.auth().generatePasswordResetLink(email);
      //console.log(`Reset link: ${resetLink}`); // Teszteléshez logoljuk
      await sendPasswordResetEmail(authK, email);
      console.log(`A jelszó megújító linket sikeresen kiküldtük: ${email}`);
      reply.status(200).send({
        success: true,
        message: 'A jelszó megújító linket sikeresen kiküldtük!'
      });
      
    } catch (error) {
      console.error('/api/changePassword – Hiba a jelszó módosítás során:', error);
      return reply.status(401).send({
        message: 'Sikertelen jelszó módosítási kérelem',
        email: email,
        error: error.message,
      });
    }
  });
  
  
  // Összes felhasználó nevének lekérése (pl. kiválasztáshoz) 
  fastify.get('/api/getAllUsersData', async (request, reply) => {
    try {
      let usersSnapshot = await users.get();
      let usersList = usersSnapshot.docs.map(doc => ({
        userId: doc.id,
        teljesnev: doc.data().teljesnev,
        vezeteknev: doc.data().vezeteknev,
        keresztnev: doc.data().keresztnev,
        telefon: doc.data().telefon,
        email: doc.data().email,
      }));
      return reply.status(200).send({
        message: "Sikeres lekérés",
        data: usersList
      });

    } catch (error) {
      console.error('/api/getAllUsersData – Hiba a felhasználók lekérése során:', error);
      return reply.status(500).send({
        message: "Sikertelen lekérés",
        error: error.message
      });
    }
  });

  
  // Ellenőrzi, hogy helyes magyar telefonszám-e?
  fastify.post("/api/checkPhoneNumber", async (request, reply) => {
    let prefixValid = false;
    let szamValid = false;
    let formattedPhoneNumber;
    try {
      const { phoneNumber } = request.body;
      console.log("telefonszám ellenőrzése... " + phoneNumber);
      if (!phoneNumber) { return reply.status(400).send({ error: "/api/checkPhoneNumber – Hiányzó bejövő adat!" }); }
      // Telefonszám validálása és normalizálása
      if (phoneNumber.startsWith("06")) { // Ha a telefonszám 06-tal kezdődik, akkor átalakítjuk +36-ra
        formattedPhoneNumber = "+36" + phoneNumber.substring(2);
      } else {
        formattedPhoneNumber = phoneNumber;
      }
      
      console.log("előformázás: " + formattedPhoneNumber);
      const phoneNumberObj = parsePhoneNumberFromString(formattedPhoneNumber, "HU"); // "HU" = Magyarország
      console.log("előhívó ellenőrzése...");
      // Előhívó kinyerése és ellenőrzése
      const nationalNumber = phoneNumberObj.nationalNumber; // Pl. 301234567
      const prefix = nationalNumber.substring(0, 2); // Első két számjegy: 30, 20, 70, stb.
      const validPrefixes = ["20", "30", "70", "21", "31", "71"]; // Magyarországon érvényes mobil- és vezetékes előhívók
      if (!validPrefixes.includes(prefix)) { console.log("előhívó hibás!"); prefixValid = false; } else { console.log("előhívó helyes!"); prefixValid = true; }
      const remainingDigits = nationalNumber.substring(2); // Maradék számjegyek száma 7 ?
      if (!/^\d{7}$/.test(remainingDigits)) { console.log("fennmaradó rész hibás!"); szamValid = false; } else { console.log("fennmaradó rész helyes!"); szamValid = true; }
      if (prefixValid && szamValid) { szamValid = true; } else { szamValid = false; }
      formattedPhoneNumber = phoneNumberObj.format("E.164"); // +36301234567 formátumra alakítja
      if (!szamValid) {
        console.log("telefonszám hibás! nem magyar, nem mobil vagy helytelen formátum!");
        return reply.status(401).send({ success: false, message: "🐯 Érvénytelen telefonszám! Kérlek ellenőrizd! Magyar mobilszámot adj meg. Helyes formátum pl. +36301234567", tel: null });
      } else {
        console.log("✅ telefonszám rendben! formázva: " + formattedPhoneNumber);
        return reply.status(200).send({ success: true, message: "✅ Érvényes telefonszám!", tel: formattedPhoneNumber });
      }
    } catch (error) {
      console.error("/api/checkPhoneNumber – Hiba a telefonszám ellenőrzésekor:", error);
      reply.status(500).send({ success: false, message: "Hiba a telefonszám ellenőrzésekor!", error: "/api/checkPhoneNumber – Hiba a telefonszám ellenőrzésekor:", tel: null });
    }
  });
  

  // Verification code elkészítése, elmentése és elküldése sms-ben a user-nek
  fastify.post("/api/sendSMSverifCode", async (request, reply) => {
    try {
      const { userId, fb_uid } = request.body;
      console.log('SMS verification code kiküldése... ', userId);
      if (!userId || !fb_uid) { return reply.status(400).send({ success: false, error: "/api/sendSMSverifCode – Hiányzó bejövő adatok!" }); }
      // Felhasználó adatainak lekérése Firestore-ból
      const userRef = users.doc(String(userId));
      const userDoc = await userRef.get();
      if (!userDoc.exists) { return reply.status(404).send({ success: false, error: "/api/sendSMSverifCode – Felhasználó nem található Firestore-ban!" }); }
      const userData = userDoc.data();
      const phoneNumber = userData.telefon;
      if (!phoneNumber) { return reply.status(400).send({ error: "/api/sendSMSverifCode – Nincs elmentett telefonszám a firestore-ban!" }); }
      console.log('User telefonszáma: ', phoneNumber);
      // user fb_uid authentikációja (hogy ne lehessen csak úgy hivogatni a userId alapján az sms küldést)
      const user_fb_uid = userData.fb_uid;
      if (user_fb_uid !== fb_uid) { return reply.status(400).send({ error: "/api/sendSMSverifCode – Sikertelen authentikáció az sms küldéséhez!" }); }
      console.log('fb_uid authentikáció rendben!');
      // 6 jegyű ellenőrző kód generálása
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 perc múlva lejár
      // Ellenőrző kód mentése Firestore-ba
      await userRef.update({
        tel_verif_code: verificationCode,
        tel_verif_code_exp: String(expiresAt)
      });
      console.log('Verification code elmentve: ', verificationCode);
      console.log('Seeme SMS külése...');
      const myMessage = `Szeretetben App igazoló kód: ${verificationCode} mely öt percig érvényes.`;
      //const myMessage = `Teszt`;
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber; // Telefonszám formázása: levágja az első karaktert, ha az "+"
      console.log(myMessage, phoneNumber);
      // SMS küldése Seeme-vel
      const queryString = `https://seeme.hu/gateway?key=${seemeConfig.api}&message=${encodeURIComponent(myMessage)}&number=${formattedPhoneNumber}`;
      console.log("Seeme gateway hívása... URL:", queryString); // Logoljuk az API hívás URL-jét
      let response;
      const sendSms = async () => { // függvény def: HTTP GET kérés küldése az SMS elküldéséhez a PQ proxy-n keresztül
        try {
          response = await axios.get(queryString, {
            httpsAgent: proxyAgent, // Proxy beállítása HTTP kérésekhez
            timeout: 5000, // Időtúllépés beállítása (5 másodperc)
          });
          console.log("Seeme / Proxy válasza: SMS küldés sikeres:", response.data);
        } catch (error) {
          console.error("Seeme / Proxy válasza: Proxy hiba:", error.message);
        }
      };
      await sendSms(); // ez a parancs hívja meg az sms küldés fv-t
      //const response = await axios.get(queryString); // HTTP GET kérés küldése az SMS elküldéséhez
      console.log("SMS elküldve:", response.data);
      reply.send({ success: true, message: "Ellenőrző kód SMS elküldve!", tel_verif_code: verificationCode, tel_verif_code_exp: String(expiresAt) });
    } catch (error) {
      console.error("Hiba az SMS küldésnél:", error);
      reply.status(500).send({ success: false, error: "/api/sendSMSverifCode – Hiba a verification code sms kiküldésekor" });
    }
  });
  
  
  // Elment firestore-ba egy user history-t (egy akciót, amit a user csinált a felületen)
  fastify.post('/api/saveUserHistory', async (request, reply) => {
    const { userId, action } = request.body;
    console.log('User history írása... ', userId, action);
    if (!userId || !action) { return reply.status(400).send({ success: false, error: "/api/saveUserHistory – Hiányzó bejövő adatok!" }); }
    try {
      const userDocRef = users.doc(userId.toString());
      const history0Ref = userDocRef.collection('history').doc('0');
      const history0Snap = await history0Ref.get(); // legutóbbi doc azonosító kiszedése
      if (!history0Snap.exists) { return reply.status(400).send({ success: false, error: "/api/saveUserHistory – Rosszul definiált user history! history0Snap hiányzik!" }); }
      const lastId = history0Snap.data().lastId;
      const newId = lastId + 1; // új doc azonosító létrehozása
      // Új history doc létrehozása és beírása
      const newDocRef = userDocRef.collection('history').doc(newId.toString());
      await newDocRef.set({
        date: new Date().toISOString(),
        action: action,
      });
      // lastId frissítése
      await history0Ref.update({ lastId: newId });
      console.log('User history beírás sikeres');
      reply.status(200).send({ success: true, message: 'User history ementve!', newId });
    } catch (err) {
      console.error('Hiba a history mentésekor:', err);
      reply.status(500).send({ success: false, error: '/api/saveUserHistory – Hiba a user history mentés közben' });
    }
  });

  
  // Lekéri egy tömbben a user history-t
  fastify.post('/api/getUserHistory', async (request, reply) => {
    const { userId } = request.body;
    console.log('User history lekérése ', userId);
    try {
      const historyRef = users.doc(userId.toString()).collection('history');
      const historyDocs = await historyRef.get();
      let history = [];
      historyDocs.forEach(doc => {
        if (doc.id !== '0') { // 0-t nem kérjük, többi jöhet egyenként a tömbbe
          const data = doc.data();
          const rawDate = new Date(data.date); // nyers ISO dátum
          const pad = (n) => n.toString().padStart(2, '0'); // függvény a formázáshoz
          // formázott dátum létrehozása
          const formattedDate = `${rawDate.getFullYear()}.${pad(rawDate.getMonth() + 1)}.${pad(rawDate.getDate())}. ` +
                            `${pad(rawDate.getHours())}:${pad(rawDate.getMinutes())}:${pad(rawDate.getSeconds())}`;
          // benyomjuk a tömbbe
          history.push({
            date: formattedDate,
            action: data.action,
            sortDate: rawDate
          });
        }
      });
      // időrend szerint rendezzük a rawDate alapján
      history.sort((a, b) => b.sortDate - a.sortDate);
      // formázott tömb létrehozása  –» formattedHistory
      const formattedHistory = history.map(entry => ({
        date: entry.date,
        action: entry.action
      }));
      // teljes formázott tömb küldése
      reply.send({ success: true, history: formattedHistory });
    } catch (error) {
      console.error("/api/getUserHistory – Hiba a user history lekérésekor:", error);
      reply.status(500).send({ success: false, message: "/api/getUserHistory – Hiba a user history lekérésekor" });
    }
  });


  
} // module.export zárójele