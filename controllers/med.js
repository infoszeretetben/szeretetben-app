// Ebben a modulban a meditáció szervezése és a meditációk megjelenítése zajlik
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
  
  
  // Meditációs lista lekérése
  fastify.post('/api/getMedData', async (request, reply) => {
    //const { valtozo } = request.body;
    console.log('Meditációs lista lekérése...');
    try {
      const meditationsSnapshot = await meds.get();  // teljes meds collection lekérése
      const meditations = meditationsSnapshot.docs.map(doc => ({ ...doc.data() })); // Az összes meditációs dokumentumot egy array-be mappeljük
      return reply.status(200).send({
        message: 'Sikeres adatlekérés',
        data: meditations, // Az összes meditációs adat visszaküldése
      });
    } catch (error) {
      console.error('/api/getMedData – Hiba az firebase adatlekérés során:', error);
      return reply.status(401).send({
        message: 'Sikertelen adatlekérés',
        error: error.message,
      });
    }
  });
  
  
  // Jelentkezők lekérése az aktuális meditációhoz
  // majd hozzáadja a teljes nevüket a users kollekcióból
  fastify.post('/api/getMedJelentkezokData', async (request, reply) => {
    try {
      const { medId } = request.body;
      console.log(`Jelentkezők lekérése meditációhoz: ${medId}`);
      // Jelentkezők lekérése az adott meditációhoz
      const jelentkezokSnapshot = await med_jel.where('medId', '==', medId).get();
      let jelentkezok = [];
      for (const doc of jelentkezokSnapshot.docs) {
        let jelentkezoData = doc.data();
        let jelentkezo_userId = String(jelentkezoData.userId);
        console.log(users.doc(jelentkezo_userId).get());
        let userSnapshot = await users.doc(jelentkezo_userId).get();
        let teljesNev = userSnapshot.exists ? userSnapshot.data().vezeteknev + " " + userSnapshot.data().keresztnev: "Ismeretlen";
        jelentkezok.push({ ...jelentkezoData, nev: teljesNev });
      }
      // Jelentkezők rendezése state:(jelentkezett → várólistán → törölt)
      jelentkezok.sort((a, b) => {
        const order = { "jelentkezett": 1, "varolistan": 2, "torolt": 3 };
        return order[a.state] - order[b.state];
      });
      return reply.status(200).send({
        message: 'Sikeres adatlekérés',
        data: jelentkezok
      });

    } catch (error) {
      console.error('/api/getMedJelentkezokData – Hiba a lekérés során:', error);
      return reply.status(500).send({
        message: 'Sikertelen adatlekérés',
        error: error.message,
      });
    }
  });

  
  // Jelentkező állapotának lekérése az adott meditációhoz
  // visszatérési érték: teljes med objektum
  fastify.post('/api/getMedJelentkezoData', async (request, reply) => {
    try {
      const { medId, userId } = request.body;
      console.log(`Jelentkező állapotának lekérése egy adott meditációhoz: ${medId}, ${userId}`);
      // Jelentkezők lekérése az adott meditációhoz
      const snapshot = await med_jel
        .where('medId', '==', medId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      if (snapshot.empty) { // Ha nem találtunk jelentkezést
        return reply.status(200).send({
          message: 'Sikeres lekérés – nincs jelentkezés',
          vanJelentkezes: false,
          data: null
        });
      }
      const doc = snapshot.docs[0]; // Ha találtunk jelentkezést
      const jelentkezesData = {
        id: doc.id,
        ...doc.data()
      };
      return reply.status(200).send({
        message: 'Sikeres lekérés – találtam jelentkezést',
        vanJelentkezes: true,
        data: jelentkezesData
      });
    } catch (error) {
      console.error('/api/getMedJelentkezoData – Hiba:', error);
      return reply.status(500).send({
        message: 'Sikertelen lekérés',
        error: error.message
      });
    }
  });
  
  
  // Összes meditációs jelentkezés lekérése egy adott userhez (azok is, melyek elmúltak már)
  // Kiadja egy tömbbe, melynek elemei a med_jel doc-ok
  fastify.post('/api/getUserMedData', async (request, reply) => {
    try {
      const { userId } = request.body;
      console.log(`User meditációs jelentkezéseinek lekérése ${userId}`);
      const jelentkezesekSnapshot = await med_jel.where('userId', '==', userId).get(); // kiválogatjuk
      let jelentkezesek = []; // ebbe a tömbbe tesszük majd ki a cuccot
      for (const doc of jelentkezesekSnapshot.docs) {
        let jel = doc.data();
        const medId = jel.medId;
        const medDoc = await meds.doc(String(medId)).get(); // kikérjük az adott meditáció adatait
        if (medDoc.exists) {
          const medData = medDoc.data();
          jelentkezesek.push({
            ...jel,
            medDatum: medData.date,  // ISO string
            medCim: medData.cim,
          });
        }
      }
      // Visszaküldjük nyersen, dátumok alapján frontenden válogatjuk szét
      reply.status(200).send({ success: true, data: jelentkezesek });
    } catch (error) {
      console.error('/api/getUserMedData – Hiba:', error);
      reply.status(500).send({ success: false, message: 'Sikertelen adatlekérés', error: error.message });
    }
  });

    
  // Új meditáció létrehozása
  // És legelső jelentkező hozzáadása (Halász Endre)
  fastify.post('/api/createMed', async (request, reply) => {
    try {
      const { title, dateTime, letrehozta, maxEmber } = request.body;
      if (!dateTime) { return reply.status(400).send({ message: '/api/createMed – Hiányzó dátum vagy időpont.' }); }
      let lastMedIdDoc = await dbGlobal.doc('lastMedId').get();
      let lastMedJelIdDoc = await dbGlobal.doc('lastMedJelId').get();
      let lastMedId = lastMedIdDoc.data().lastMedId;
      let lastMedJelId = lastMedJelIdDoc.data().lastMedJelId;
      let newMedId = lastMedId + 1;
      let newJelId = lastMedJelId + 1;
      let nowISO = new Date().toISOString();
      // Új meditáció létrehozása
      await db.collection('meds').doc(String(newMedId)).set({
        medId: newMedId,
        cim: title || "",
        date: dateTime,
        jelentkezett: 1,
        letrehozta: letrehozta,
        letrehozta_date: nowISO,
        maxEmber: maxEmber,
        message: "",
        teaser: "",
        modositotta: letrehozta,
        modositotta_date: nowISO,
        state: "cimre_var",
        varolistan: 0
      });
      // Új jelentkezés létrehozása
      await med_jel.doc(String(newJelId)).set({
        docId: newJelId,
        userId: 10001,
        medId: newMedId,
        state: "jelentkezett",
        date: nowISO,
        response_date: nowISO,
        response_state: "visszaigazolva",
        jelen: false,
      });
      // Global collection frissítése
      await dbGlobal.doc('lastMedId').set({ lastMedId: newMedId });
      await dbGlobal.doc('lastMedJelId').set({ lastMedJelId: newJelId });
      return reply.status(200).send({
        message: "Sikeres létrehozás",
        success: true,
        medId: newMedId,
      });
    } catch (error) {
      console.error('/api/createMed – Hiba a meditáció létrehozásakor:', error);
      return reply.status(500).send({ success: false, message: '/api/createMed – Hiba a meditáció létrehozásakor' });
    }
  });
  
  
  // Meditáció adatváltoztatás mentése
  fastify.post('/api/saveMedData', async (request, reply) => {
    try {
      const { medId, key, newValue, userId } = request.body;
      console.log('Meditáció adatváltozás beírása:', medId, key, newValue);
      if (!medId || !key || !userId) { return reply.status(400).send({ message: '/api/saveMedData – Hiányzó bejövő adatok!' }); }
      let userDoc = await users.doc(String(userId)).get();
      let userData = userDoc.data();
      let változtató = userData.teljesnev // lekérjük a változtató admin teljes nevét
      let nowISO = new Date().toISOString();
      // maxEmber változtatása esetén ellenőrizzük, hogy > 0 és hogy nincs-e több jelentkező máris??
      if (key == 'maxEmber') {
        let medDoc = await meds.doc(String(medId)).get();
        let medData = medDoc.data();
        let medJelentkezett = medData.jelentkezett; // ennyi ember jelentkezett eleddig
        if (newValue <= 0) {
          console.log('🦊 Nem jó! A maximális létszám minimum 1 fő!');
          return reply.status(401).send({
            message: "🦊 Nem jó! A maximális létszám minimum 1 fő!",
            success: false,
          });
        } else if (newValue < medJelentkezett) {
          console.log("🦊 Nem állíthatok be ennyit! Már most többen jelentkeztek, mint " + String(newValue) + " fő!");
          return reply.status(401).send({
            message: "🦊 Nem állíthatok be ennyit! Már most többen jelentkeztek, mint " + String(newValue) + " fő!",
            success: false,
          });
        }
      }
      // Meditáció visszaállítása –» cimre_var
      await meds.doc(String(medId)).update({
        modositotta: változtató,
        modositotta_date: nowISO,
        [key]: newValue, // itt írjuk be az új adatot
      });
      console.log('Új adat beírva!');
      return reply.status(200).send({
        message: "Sikeres adatmódosítás",
        success: true,
      });
    } catch (error) {
      console.error('/api/saveMedData – Hiba a meditáció adatváltozás beírásakor:', error);
      return reply.status(500).send({ success: false, message: '/api/saveMedData – Hiba a meditáció adatváltozás beírásakor' });
    }
  });
  
  
  // Meditáció törlésre jelölése / végleges törlése + jelentkezések is
  fastify.post('/api/deleteMed', async (request, reply) => {
    try {
      const { medId, userId } = request.body;
      console.log('Meditáció törlése: ', medId);
      if (!medId || !userId) { return reply.status(400).send({ message: '/api/deleteMed – Hiányzó bejövő adatok!' }); }
      let medDoc = await meds.doc(String(medId)).get();
      let medData = medDoc.data();
      let currentMedState = medData.state; // lekérjük a med jelenlegi állapotát
      let userDoc = await users.doc(String(userId)).get();
      let userData = userDoc.data();
      let torolte = userData.teljesnev // lekérjük a változtató admin teljes nevét
      let nowISO = new Date().toISOString();
      if (currentMedState == 'torolt') {
        // Meditáció végleges törlése
        await meds.doc(String(medId)).delete();
        // Korábbi jelentkezők végleges törlése a med_jel-ből
        let existingJelentkezoSnapshot = await med_jel.where('medId', '==', medId).get();
        if (!existingJelentkezoSnapshot.empty) {
          let batch = db.batch(); // Firestore batch művelet az optimalizált törléshez
          existingJelentkezoSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit(); // Az összes törlés végrehajtása egyszerre
        }
        console.log('Meditáció véglegesen törölve. És a hozzá tartozó jelentkezések is.');
      } else {
        // Meditáció törölt státuszra állítása
        await meds.doc(String(medId)).update({
          modositotta: torolte,
          modositotta_date: nowISO,
          state: "torolt",
        });
        console.log('Meditáció törölt státuszra állítva');
      }
      
      return reply.status(200).send({
        message: "Sikeres meditáció törlés",
        success: true,
      });
    } catch (error) {
      console.error('/api/deleteMed – Hiba a meditáció törlésekor:', error);
      return reply.status(500).send({ success: false, message: '/api/deleteMed – Hiba a meditáció törlésekor:' });
    }
  });
  
  
  // Törölt meditáció visszaállítása
  fastify.post('/api/recoverMed', async (request, reply) => {
    try {
      const { medId, userId } = request.body;
      console.log('Meditáció visszaállítása: ', medId);
      if (!medId || !userId) { return reply.status(400).send({ message: '/api/recoverMed – Hiányzó bejövő adatok!' }); }
      let userDoc = await users.doc(String(userId)).get();
      let userData = userDoc.data();
      let visszaállította = userData.teljesnev // lekérjük a változtató admin teljes nevét
      let nowISO = new Date().toISOString();
      // Meditáció visszaállítása –» cimre_var
      await meds.doc(String(medId)).update({
        modositotta: visszaállította,
        modositotta_date: nowISO,
        state: "cimre_var",
      });
      console.log('Meditáció visszaállítva');
      return reply.status(200).send({
        message: "Sikeres visszaállítás",
        success: true,
      });
    } catch (error) {
      console.error('/api/recoverMed – Hiba a meditáció visszaállításakor:', error);
      return reply.status(500).send({ success: false, message: '/api/recoverMed – Hiba a meditáció visszaállításakor:' });
    }
  });
  
  
  // Új meditációs jelentkezés / átjelentkezés
  fastify.post('/api/addMedJelentkezo', async (request, reply) => {
    try {
      const { medId, userId, requestType } = request.body; // requestType: 'jelentkezett' vagy 'varolistan' vagy 'torolt' –» mire jelentkezik?  A 'torolt' azt jelenti, hogy eddig még nem jelentkezett, de egyből azt mondja: nem fog tudni jönni, tehát egyből lemondja. Ha korábban jelentkezett és úgy mondja le, azt a /api/deleteMedJelentkezo endpoint végzi.
      if (!medId || !userId || !requestType) {  // beérkező adatok ellenőrzése
        return reply.status(400).send({ success: false, message: '/api/addMedJelentkezo – Hiányzó beérkező adatok' });
      }
      console.log('Új jelentkező hozzáadása a meditációhoz', medId, userId, requestType);
      const medRef = meds.doc(String(medId));  // Adott meditáció doc-ja
      
      // Lekérjük, hogy már van-e bármiféle jelentkezése az adott meditációra?
      let existingJelentkezoSnapshot = await med_jel
        .where('medId', '==', medId)
        .where('userId', '==', userId)
        .get();
      // Ha még nem jelentkezett eleddig, akkor az existingState és existingJelId legyen null, egyébként pedig, hogy milyen módon
      let alreadyRegistered = !existingJelentkezoSnapshot.empty;
      let existingState = alreadyRegistered ? existingJelentkezoSnapshot.docs[0].data().state : null; // jelentkezés módja
      let existingJelId = alreadyRegistered ? existingJelentkezoSnapshot.docs[0].id : null; // jelentkezés id-je

      // Lekérjük az adott meditációt és adatait
      let medDoc = await medRef.get();
      if (!medDoc.exists) {
        return reply.status(404).send({ success: false, message: '🐷 Meditáció nem található!' });
      }
      let medData = medDoc.data();
      let jelentkezettSzam = medData.jelentkezett;
      let maxEmber = medData.maxEmber;
      let varolistanSzam = medData.varolistan;
      let nowISO = new Date().toISOString(); // mostani dátum létrehozása
      if (alreadyRegistered) {
        // Ha már jelentkezett, de más státuszra akar átkerülni
        if (existingState !== requestType) {
          let updateJelentkezo = { state: requestType };
          await med_jel.doc(existingJelId).update(updateJelentkezo);
          // A megfelelő számlálót frissítjük a meds-ben
          let medUpdate = {};
          if (existingState === "jelentkezett") {
            medUpdate.jelentkezett = Math.max(jelentkezettSzam - 1, 0); //ha negatívba menne –» 0
            medUpdate.varolistan = varolistanSzam + 1;
          } else if (existingState === "varolistan") {
            if (jelentkezettSzam < maxEmber) {
              medUpdate.varolistan = Math.max(varolistanSzam - 1, 0);
              medUpdate.jelentkezett = jelentkezettSzam + 1;
            } else {
              return reply.status(200).send({
                success: true,
                message: "🐳 Sajnos nincs már szabad hely erre a meditációra, de továbbra is rajta vagy a várólistán!"
              });
            }
          } else if (existingState === "torolt") {
            if (jelentkezettSzam < maxEmber) {
              medUpdate.jelentkezett = jelentkezettSzam + 1;
            } else {
              return reply.status(200).send({
                success: true,
                message: "🐳 Sajnos nincs már szabad hely erre a meditációra!"
              });
            }
          }
          await medRef.update(medUpdate);
          return reply.status(200).send({
            success: true,
            message: "🐰 Korábban már jelentkeztél erre a meditációra, de most áthelyeztünk a másik listára. Aktuális állapotod: " + requestType
          });
        } else {
          // ha már jelentkezett erre a meditációra és erre a listára
          let myMessage = "";
          if (existingState === "jelentkezett") {
            myMessage = '🐰 Korábban már jelentkeztél!';
          } else {
            myMessage = '🐰 Korábban már mondtad!';
          }
          return reply.status(200).send({
            success: true,
            message: myMessage,
          });
        }
      }
      let isTorolt = false;
      if (requestType === 'torolt') { isTorolt = true };
      // Ha új jelentkezés (vagy eleve törlés korábbi jelentkezés nélkül), akkor ellenőrizzük, hogy van-e még hely
      let isWaitingList = requestType === "varolistan" || jelentkezettSzam >= maxEmber; // csak akkor false, ha normál jelentkezés és van még hely!! szuper!!
      let myJelState = isWaitingList ? "varolistan" : "jelentkezett";
      myJelState = isTorolt ? "torolt" : myJelState;
      // Lekérjük és növeljük a jelentkezési azonosítót
      let lastMedJelIdDoc = await dbGlobal.doc('lastMedJelId').get();
      let lastMedJelId = lastMedJelIdDoc.data().lastMedJelId;
      let newJelId = lastMedJelId + 1;
      // Új jelentkezés rögzítése a megfelelő állapottal
      await med_jel.doc(String(newJelId)).set({
        docId: newJelId,
        userId,
        medId,
        state: myJelState,
        date: nowISO,
        response_date: nowISO,
        response_state: "visszaigazolva",
        jelen: false,
      });
      // Frissítjük a global collection-t
      await dbGlobal.doc('lastMedJelId').set({ lastMedJelId: newJelId });
      let myMessage = "";
      // Ha törlést kért a user elve (korábbi jelentkezés nélkül) –» beállítjuk, hogy törölt
      if (isTorolt) {
        myMessage = "🐳 Sajnálom, hogy nem tudsz jönni!"
      } else {
        // Ha volt még hely, akkor a jelentkezett számot növeljük, ha nem, akkor a várólistát
        let updateData = isWaitingList
          ? { varolistan: varolistanSzam + 1 }
          : { jelentkezett: jelentkezettSzam + 1 };
        await medRef.update(updateData);
        myMessage = isWaitingList
            ? "🐳 Sajnos nincs már szabad hely erre a meditációra, de felírtunk a várólistára!"
            : "🐰 Találtunk szabad helyet! Sikeresen jelentkeztél a meditációra!";
        if (isWaitingList && requestType === "varolistan") myMessage = "🐹 Rendben! Felvettünk a várólistára!";
      }
      return reply.status(200).send({
        success: true,
        message: myMessage
      });
    } catch (error) {
      console.error('/api/addMedJelentkezo – Hiba a jelentkező hozzáadásakor:', error);
      return reply.status(500).send({ success: false, message: 'Hiba történt a jelentkező hozzáadásakor.' });
    }
  });
  
  
  // Beírja / Törli  a jelentkezőt a jelenléti íven (toggle)
  fastify.post('/api/toggleAttendance', async (request, reply) => {
    try {
      const { docId, medId, userId } = request.body;
      console.log('Jelenlét beírása / törlése...', userId);
      if (!docId || !medId || !userId) { return reply.status(400).send({ message: '/api/toggleAttendance – Hiányzó bejövő adat' }); }
      let jel = await med_jel.doc(String(docId)).get(); // jelentkezési állapot lekérése
      let jelentkezesUjAllapota = !jel.data().jelen;
      console.log('Új állapot: ', jelentkezesUjAllapota ? 'Jelen!' : 'Nincs jelen!');
      // Új jelentkezési állapot beírása
      await med_jel.doc(String(docId)).update({ jelen: jelentkezesUjAllapota });
      return reply.status(200).send({
        message: "Siker",
        success: true,
        jelen: jelentkezesUjAllapota,
      });
    } catch (error) {
      console.error('/api/toggleAttendance – Hiba a jelenlét átírásakor', error);
      return reply.status(500).send({ success: false, message: '/api/toggleAttendance – Hiba a jelenlét átírásakor' });
    }
  });

  
  // Törli a jelentkezőt a med jelentkezésekről (lemondás) / végleges törlés (ha nem ő az utolsó)
  fastify.post('/api/deleteMedJelentkezo', async (request, reply) => {
    try {
      const { docId, medId, userId, isAdmin } = request.body;
      console.log('Jelentkező törlése a meditációról...', docId, medId, userId, isAdmin);
      if (!docId || !medId || !userId) { return reply.status(400).send({ message: '/api/deleteMedJelentkezo – Hiányzó bejövő adat' }); }
      let medJelDoc = await med_jel.doc(String(docId)).get();
      let medJelData = medJelDoc.data(); // Jelentkező állapotának lekérése (melyik listán volt eddig?)
      let medJelState = medJelData.state;
      console.log('jelentkező eddigi állapota: ', medJelState);
      if (medJelState == 'torolt' && isAdmin) {
        // jelentkező végleges törlése (ha nem ő az utolsó), és admin kéri
        const jelentkezokSnapshot = await med_jel.where('medId', '==', Number(medId)).get();
        console.log(jelentkezokSnapshot.size);
        if (jelentkezokSnapshot.size <= 1) {
          // nem töröljük, mert legalább egynek maradnia kell!
          console.log('Sikertelen törlés. Az utolsó jelentkező nem törölhető ki véglegesen!');
          return reply.status(200).send({
            message: "Sikertelen törlés. Az utolsó jelentkező nem törölhető ki véglegesen!",
            success: false,
          });
        } else {
          // jelentkező végleges törlése
          med_jel.doc(String(docId)).delete();
          console.log('Sikeres törlés. Jelentkező végleg törölve');
          return reply.status(200).send({
            message: "Sikeres törlés. Jelentkező végleg törölve",
            success: true,
          });
        }
      } else {
        // Törölt állapot bejegyzése a jelentkezőnél
        await med_jel.doc(String(docId)).update({ jelen: false, state: 'torolt' });
        // Számlálók frissítése a meditációnál
        const medRef = meds.doc(String(medId));  // Adott meditáció doc-ja
        let medDoc = await medRef.get(); // Lekérjük az adott meditációt és adatait
        if (!medDoc.exists) {
          return reply.status(404).send({ success: false, message: '🐷 Meditáció nem található!' });
        }
        let medData = medDoc.data();
        if (medJelState === 'jelentkezett') {
          let jelentkezettSzam = medData.jelentkezett;
          jelentkezettSzam = jelentkezettSzam - 1;
          let updateData = { jelentkezett: jelentkezettSzam }
          await medRef.update(updateData);
        } else if (medJelState === 'varolistan') {
          let varolistanSzam = medData.varolistan;
          varolistanSzam = varolistanSzam - 1;
          let updateData = { varolistan: varolistanSzam }
          await medRef.update(updateData);
        } else {
          // már eleve törölve volt...
        }
        console.log('Jelentkező sikeresen törölve');
      }
      return reply.status(200).send({
        message: "Sikeres törlés",
        success: true,
      });
    } catch (error) {
      console.error('/api/deleteMedJelentkezo – Hiba a jelentkező törlésekor', error);
      return reply.status(500).send({ success: false, message: '/api/deleteMedJelentkezo – Hiba a jelentkező törlésekor' });
    }
  });
  
  
  // Korábban törölt jelentkező újrajelentkezés (jelentkezett-re tesszük, ha van hely; vagy várólistára, ha nincs, vagy azt kérte!)
  // requestType = 'jelentkezett' vagy pedig 'varolistan'
  fastify.post('/api/reactivateMedJelentkezo', async (request, reply) => {
    try {
      const { docId, medId, userId, requestType } = request.body; // requestType: 'jelentkezett' vagy 'varolistan' –» amire aktiváljuk
      console.log('Korábban törölt jelentkező újra-aktiválást kér:', docId,  medId, userId, requestType);
      if (!docId || !medId || !userId || !requestType) { return reply.status(400).send({ message: '/api/reactivateMedJelentkezo – Hiányzó bejövő adat' }); }
      const medRef = meds.doc(String(medId));  // Adott meditáció doc-ja
      let medDoc = await medRef.get(); // Lekérjük az adott meditáció adatait
      if (!medDoc.exists) { return reply.status(404).send({ success: false, message: '🐷 Meditáció nem található!' }); }
      let medData = medDoc.data();
      let jelentkezettSzam = medData.jelentkezett; // ennyi ember jelentkezett eddig
      let maxEmber = medData.maxEmber; // max ennyi jöhet
      let varolistanSzam = medData.varolistan; // ennyi van várólistán
      let nowISO = new Date().toISOString(); // mostani dátum létrehozása
      let medJelDoc = await med_jel.doc(String(docId)).get(); // Lekérjük az adott jelentkezés adatait
      let medJelData = medJelDoc.data();
      let medJelState = medJelData.state; // eddig így volt jelentkezve
      // Ellenőrizzük, hogy van-e még szabad hely
      let isWaitingList = requestType === "varolistan" || jelentkezettSzam >= maxEmber; // csak akkor false, ha normál jelentkezés és van még hely!! szuper!!
      // Jelentkezés frissítése a megfelelő állapottal
      await med_jel.doc(String(docId)).update({
        state: isWaitingList ? "varolistan" : "jelentkezett",
        response_date: nowISO,
        response_state: "reaktiválva",
      });
      // Növeljük / csökkentjük a jelentkezett számot / várólista számot
      let updateData;
      if (medJelState === 'torolt') {
        updateData = isWaitingList
        ? { varolistan: varolistanSzam + 1 }
        : { jelentkezett: jelentkezettSzam + 1 };
      } else if (medJelState === 'jelentkezett') {
        updateData = isWaitingList
        ? { varolistan: varolistanSzam + 1, jelentkezett: jelentkezettSzam - 1 }
        : { jelentkezett: jelentkezettSzam }; // ilyen nem lesz amúgy
      } else if (medJelState === 'varolistan') {
        updateData = isWaitingList
        ? { varolistan: varolistanSzam } // ilyen sem lesz
        : { jelentkezett: jelentkezettSzam + 1, varolistan: varolistanSzam - 1 };
      }
      await medRef.update(updateData);
      return reply.status(200).send({
        success: true,
        message: isWaitingList
          ? (requestType === "varolistan" ? "🐨 Rendben! Beírtunk a várólistára!" : "🐳 Sajnos nincs már szabad hely erre a meditációra, de beírtunk a várólistára!")
          : "🐰 Találtunk még szabad helyet! Sikeresen újrajelentkeztél a meditációra!"
      });
    } catch (error) {
      console.error('/api/reactivateMedJelentkezo – Hiba a jelentkező hozzáadásakor:', error);
      return reply.status(500).send({ success: false, message: 'Hiba történt a jelentkező hozzáadásakor.' });
    }
  });
  
  
  // Jelenléti ív bejelölések
  fastify.post("/api/updateJelenStatus", async (request, reply) => {
    const { docId, medId, jelen } = request.body;
    console.log("Jelenléti ív: ", docId, medId, jelen);
    try {
      await db.collection("med_jelentkezok").doc(String(docId)).update({ jelen: jelen });
      console.log("Átállítva!");
      reply.send({ success: true });
    } catch (error) {
      reply.status(500).send({ error: "/api/updateJelenStatus – Nem sikerült frissíteni a jelen státuszt" });
    }
  });

  
   // Meditáció szervezés email értesítések a szervezőknek (minden reggel kilenckor lefut)
  fastify.get('/api/checkMorningNotif', async (request, reply) => {
    console.log("Szervezői email értesítések ellenőrzése...");
    try {
      // értesítési definíciók lekérése
      const notifSnapshot = await dbGlobal.doc('medStateNotification').collection('notif').get();
      let notifDefArray = [];
      notifSnapshot.forEach(doc => {
        notifDefArray.push({ ...doc.data() });
      });
      // aktív meditációk lekérése
      const medsSnapshot = await meds.get();
      let medsActive = [];
      medsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.state !== "elmult" && data.state !== "torolt") {
          medsActive.push({
            id: doc.id,
            ...data
          });
        }
      });
      // értesítési feltételek ellenőrzése
      await processNotifications(medsActive, notifDefArray); 
      reply.send({ success: true, message: "Notifications checked." });
    } catch (error) {
      console.error("Error in checkMorningNotif:", error);
      reply.code(500).send({ success: false, error: error.message });
    }
  });

  
  async function processNotifications(medsActive, notifDefArray) {
    for (const med of medsActive) {
      const medDate = new Date(med.date); // ISO 8601 formátumú dátum
      const medDateFormatted = formatDate(medDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to midnight to ensure correct day calculation
      medDate.setHours(0, 0, 0, 0);
      const timeDiff = medDate.getTime() - today.getTime();
      const daysBefore = timeDiff / (1000 * 3600 * 24); // Napok száma
      console.log(`${med.cim} | ${med.date} | ${daysBefore} nap múlva | ${med.state}`);
      for (const notif of notifDefArray) {
        if (notif.day === daysBefore) {
          if (notif.state === med.state) {
            const recipientRef = dbGlobal.doc(notif.cimzett);
            //const recipientDoc = await recipientRef.get();
            const recipientDoc = await dbGlobal.doc(notif.cimzett).get();
            const recipientData = recipientDoc.data();
            const recipientEmail = recipientData.email;
            const recipientKeresztnev = recipientData.keresztnev;
            console.log(`Értesítés kiküldése: ${notif.emailSablon} sablon alapján: ${recipientKeresztnev}`);
            const templateId = notif.emailSablon;
            const data = {
              from: 'info.szeretetben@gmail.com',
              to: recipientEmail,
              subject: notif.subject,
              keresztnev: recipientKeresztnev,
              medCim: med.cim,
              medDate: String(medDateFormatted),
              daysBefore: daysBefore,
            }
            const renderedHtml = await emailsend.renderEmailTemplate(templateId, data);
            const valasz = await emailsend.sendEmail(renderedHtml, data);
          }
        }
      }
    }
  }
  
  
  // dátum formázása
  function formatDate(medDate) {
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest"
    };
    const formattedDate = new Intl.DateTimeFormat("hu-HU", options).format(medDate);
    // Kimenet összeállítása
    const finalDateString = formattedDate
      .replace(/\./g, "") // Az "jan. 08., szerda 18:00" formátumból eltávolítjuk a pontokat, hogy "jan 08 szerda 18:00" legyen
      .replace(",", ".")   // A vesszőt ponttal helyettesítjük
      .replace("  ", " "); // Kétszeri szóközt egyszerire alakítjuk
    return finalDateString;
  }

  
              
  
  
}; // module.export zárójele
               
