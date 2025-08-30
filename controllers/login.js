// Ebben a modulban a belépési képernyőhöz tartozó endpoint-ok vannak
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
  
  // Email-Passw bejelentkezés
  fastify.post('/api/login-email', async (request, reply) => {
    const { email, password } = request.body;
    console.log('User be akar lépni:', email);
    if (!email || !password) {
      return reply.status(400).send({ message: 'Email és jelszó hiányzik' });
    }
    try {
      // Felhasználó hitelesítése Firebase-ben
      const userRecord = await admin.auth().getUserByEmail(email);
      // Felhasználó bejelentkezés ellenőrzése
      // Hitelesítés a Firebase REST API-val
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );
      const { idToken, localId, email: userEmail, displayName} = response.data;
      // Ellenőrizzük hogy visszaigazolta-e már az email címét?
      if (!userRecord.emailVerified) {
        console.log('Még nincs visszaigazolva az email!');
        return reply.status(401).send({
          message: 'Még nem igazoltad vissza az email címed!',
          login_state: false,
        });
      }
      // Igen, visszaigazolta az email címét
      // Megkeressük a users-ben
      let my_user; let docId;
      const mq = await users.where('email', '==', email).get();
      mq.forEach((doc) => {my_user = doc.data(); docId = doc.id;});
      await users.doc(docId).update({
        login_type: "email",
        login_number: my_user.login_number + 1,
        login_state: true,
      });
      // Válasz a kliensnek
      console.log("Sikeres belépés: ", my_user.userId);
      return reply.status(200).send({
        message: 'Sikeres belépés!',
        login_state: true,
        userId: my_user.userId,
        uid: localId,
        name: displayName,
      });
    } catch (error) {
      console.error('/api/login-email – Hiba a belépés során:', error);
      return reply.status(401).send({
        message: 'Hibás email cím vagy jelszó!',
        login_state: false,
        error: error.message,
      });
    }
  });


  // Email-Passw regisztráció
  fastify.post('/api/register-email', async (request, reply) => {
    const { email, password } = request.body;
    console.log('User regisztrálni akar...', email);
    if (!email || !password) {
      return reply.status(400).send({ message: 'Email és jelszó hiányzik' });
    }
    try {
      // Felhasználót megnézzük, létezik-e már Firebase-ben
      const userRecord = await admin.auth().getUserByEmail(email);
      // Igen, már létezik ilyen email címen felhasználó
      // Ellenőrizzük, hogy van-e email-password belépés
      if (userRecord.providerData.some(provider => provider.providerId === 'password')) {
        console.log("Már létezik email-password belépési lehetőség ezzel az email címmel");
        return reply.status(200).send({
          success: true,
          message: 'Már létezik email-password belépési lehetőség ezzel az email címmel',
        });
      } else {
        console.log("Még nincs email-password belépés ennél az email címen –» létrehozzuk!");
        await admin.auth().updateUser(userRecord.uid, {
            password: password,
            emailVerified: false,
          });
        // Szimulált bejelentkezett felhasználót hozunk létre, hogy ki tudjuk küldeni az email-t
        // Felhasználó szimulált bejelentkeztetése a megadott email és jelszó alapján
        const userCredential = await signInWithEmailAndPassword(authK, email, password);
        const user = userCredential.user;
        // Küldjük ki a verifikációs emailt a Firebase template-tel
        await sendEmailVerification(user);
        return reply.status(200).send({
          success: false,
          message: 'Sikeresen regisztráltál! Igazold vissza az email címed az email fiókodból és utána be is tudsz lépni!',
        });
      }
    } catch (error) {
      // Ha nem található a felhasználó, hozzuk létre
      // Új felhasználó létrehozása Firebase-ben
      if (error.code === 'auth/user-not-found') {
        console.log("Még nincs ilyen felhasználó –» létrehozzuk!");
        const newUser = await admin.auth().createUser({
          email: email,
          password: password,
          emailVerified: false,
        });
        // Új felhasználó létrehozása Firestore-ban
        const lastIdDoc = await globalRef.get();  // Kiolvassuk a lastId értékét (legutolsó userId)
        const lastId = lastIdDoc.data().lastId;
        const newId = lastId + 1;  // Növeljük az értékét
        const newIdString = newId.toString();
        await globalRef.update({ lastId: newId });  // Frissítjük a lastId értékét
        const newFsUser = {
          userId: newId,
          email: email,
          fb_uid: newUser.uid,
          teljesnev: "",
          vezeteknev: "",
          keresztnev: "",
          displayName: "",
          photoURL: "",
          telefon: "",
          tel_verified: false,
          tel_verif_code: 0,
          tel_verif_code_exp: "",
          psid: "",
          szamlanev: "",
          szamlacim: "",
          admin: false,
          assist: false,
          med_ertesit: true,
          ws_ertesit: true,
          login_number: 0,
          login_type: "email",
          app_status: "newReg",
          login_state: false,
          show_torolt: false,
          show_elmult: false,
        };
        await users.doc(newIdString).set(newFsUser);  // Beírjuk a users-be
        await users.doc(newIdString).collection('history').doc('0').set({ lastId: 1000 }); // Létrehozzuk bele a history collection-t is
        console.log('Új felhasználó létrehozva:', newUser);
        // Szimulált bejelentkezett felhasználót hozunk létre, hogy ki tudjuk küldeni az email-t
        // Felhasználó szimulált bejelentkeztetése a megadott email és jelszó alapján
        const userCredential = await signInWithEmailAndPassword(authK, email, password);
        const user = userCredential.user;
        // Küldjük ki a verifikációs emailt a Firebase template-tel
        await sendEmailVerification(user);
        reply.status(200).send({
          success: true,
          message: 'Sikeresen regisztráltál! Igazold vissza az email címed az email fiókodból és utána be is tudsz lépni!',
        });
      } else {
        console.error('Hiba a regisztráció közben:', error);
        reply.status(500).send({
          success: false,
          message: 'Hiba történt regisztráció közben!',
        });
      }
    };
  });


  // Google környezeti változó kiadása
  fastify.get('/api/config', (req, res) => {
    console.log('Google Client ID kiadása az .env-ből a kliensnek')
    return res.status(200).send({ 
      googleClientId: process.env.GOOGLE_CLIENT_ID,
    });
  });


  // Google bejelentkezés
  fastify.post('/api/login-google', async (req, res) => {
    const { idToken } = req.body;
    console.log('Google bejelentkeztetés start...');
    console.log('Beérkezett idToken:', idToken);
    try {
      // Google ID token ellenőrzése a google OAuth2.0-ben
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID, // Ez a Client ID, amit a Google Cloud Console-ban hoztál létre
      });
      console.log('verifyIdToken által visszaadott ticket:', ticket);
      const payload = ticket.getPayload();
      console.log('Ebből kiszedett payload:', payload);

      // Email cím kinyerése a Google tokenből
      const email = payload.email;
      console.log('Ebből kiszedett email:', email);

      try {
        // Ellenőrizzük, hogy létezik-e a felhasználó
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log('Firebase-ben email alapján a userRecord:', userRecord);
        // Igen, létezik
        // Megkeressük a users-ben
        let my_user; let docId;
        const mq = await users.where('email', '==', email).get();
        mq.forEach((doc) => {my_user = doc.data(); docId = doc.id;});
        // Ellenőrizzük, hogy van-e Google hitelesítési módszer kapcsolva
        const googleProviderExists = userRecord.providerData.some(provider => provider.providerId === "google.com");
        if (!googleProviderExists) {
          console.log("Eleddig még nem használta a Google belépést!")
          // Ha nincs Google hitelesítés kapcsolva, frissítsük a profil adatait
          await admin.auth().updateUser(userRecord.uid, {
            displayName: payload.name,
            photoURL: payload.picture,
          });
          let uj_teljesnev = my_user.teljesnev;
          console.log(uj_teljesnev);
          if (uj_teljesnev === "") uj_teljesnev = payload.name; // Csak ha nincs beírva teljes név, akkor írjuk be google-ból
          await users.doc(docId).update({
            photoURL: payload.picture, 
            displayName: payload.name, 
            teljesnev: uj_teljesnev,
            login_type: "google",
            login_number: my_user.login_number + 1,
            login_state: true,
          });
          console.log('Google adatok hozzáadva a már meglévő profilhoz:', email);
        }
        // Válasz a kliensnek
        console.log("Sikeres belépés: ", my_user.userId);
        // Sikeres belépés
        res.status(200).send({
          success: true,
          message: 'Sikeres belépés!',
          user: userRecord,
          userId: my_user.userId,
        });
      } catch (error) {
        // Ha nem található a felhasználó, hozzuk létre
        if (error.code === 'auth/user-not-found') {
          const newUser = await admin.auth().createUser({
            email: email,
            emailVerified: payload.email_verified,
            displayName: payload.name,
            photoURL: payload.picture,
          });
          // Új felhasználó létrehozása Firestore-ban
          const lastIdDoc = await globalRef.get();  // Kiolvassuk a lastId értékét (legutolsó userId)
          const lastId = lastIdDoc.data().lastId;
          const newId = lastId + 1;  // Növeljük az értékét
          const newIdString = newId.toString();
          await globalRef.update({ lastId: newId });  // Frissítjük a lastId értékét
          const newFsUser = {
            userId: newId,
            email: email,
            fb_uid: newUser.uid,
            teljesnev: payload.name, // google-ból hozzuk át
            vezeteknev: "",
            keresztnev: "",
            displayName: newUser.displayName,
            photoURL: newUser.photoURL,
            telefon: "",
            tel_verified: false,
            tel_verif_code: 0,
            tel_verif_code_exp: "",
            psid: "",
            szamlanev: "",
            szamlacim: "",
            admin: false,
            assist: false,
            med_ertesit: true,
            ws_ertesit: true,
            login_number: 1,
            login_type: "google",
            app_status: "newReg",
            login_state: false,
            show_torolt: false,
            show_elmult: false,
          };
          await users.doc(newIdString).set(newFsUser);  // Beírjuk a users-be
          await users.doc(newIdString).collection('history').doc('0').set({ lastId: 1000 }); // Létrehozzuk bele a history collection-t is
          console.log('Új Google felhasználó létrehozva:', newUser);
          res.status(200).send({
            success: true,
            message: 'Sikeres regisztráció és belépés!',
            user: newUser,
          });
        } else {
          console.error('Hiba a felhasználó lekérése során:', error);
          res.status(500).send({
            success: false,
            message: 'Hiba történt a felhasználó kezelés során!',
          });
        }
      }
    } catch (error) {
      console.error('Hiba a Google beléptetés során:', error);
      res.status(401).send({
        success: false,
        message: 'Google-Firebase belépés sikertelen!',
      });
    }
  });


  // Elfelejtett jelszó kiküldése
  fastify.post('/api/forgot-password', async (req, res) => {
      const { email } = req.body;
      if (!email) {
          return res.status(400).send({
            success: false,
            message: 'Hiányzó email cím!',
            error: 'Hiányzó email cím!',
          });
      }
      console.log('Jelszó emlékeztető kiküldése ide:', email);
      try {
          // Ellenőrzés, hogy létezik-e a felhasználó
          const userRecord = await admin.auth().getUserByEmail(email);
          // Jelszó emlékeztető kiküldése
          //const resetLink = await admin.auth().generatePasswordResetLink(email);
          //console.log(`Reset link: ${resetLink}`); // Teszteléshez logoljuk
          await sendPasswordResetEmail(authK, email);
          res.status(200).send({
            success: true,
            message: 'A jelszó megújító linket sikeresen kiküldtük!'
          });
      } catch (error) {
          if (error.code === 'auth/user-not-found') {
              res.status(404).send({
                success: false,
                message: 'Ezen az email címen nem vagy regisztrálva hozzánk!',
                error: 'Ezen az email címen nem vagy regisztrálva hozzánk!',
              });
          } else {
              console.error('Hiba:', error);
              res.status(500).send({
                success: false,
                message: 'Hiba történt a jelszó emlékeztető küldése közben',
                error: 'Hiba történt a jelszó emlékeztető küldése közben',
              });
          }
      }
  });
  
};