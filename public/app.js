// Globális változók importálása
import {
  myUser,
  allUsers,
  askedUser,
  myMed,
  medTable_selectedRow_medId,
  lastOpenedMedDiv,
  stateMapping,
  stateMappingForUser,
  colorStateMappingForUser,
  colorStateMapping,
  stateMappingMed,
  stateMappingMedKiiras,
  stateMappingMedColor,
  stateMappingForMedLetszam,
  rovidHonapNevek,
  jumpTargetMedId,
  setJumpTargetMedId,
  clearJumpTargetMedId,
  calendar,
  setCalendar,
  stillLoading,
  setStillLoading,
} from './app-globals.js'
// Függvények importálása
import { setLastOpenedMedDiv } from './app-globals.js';
//import { proba, loadUser, fbUidAuth, welcomeNewReg, openProfilePop1, openProfilePop2, checkPhoneNumber, openProfilePop3, sendSMSverifCode, checkSMSverifCode, fetchUserDataArray, showSection, showLoadingIndicator, logoutUser, updateHomeSection, jumpToMed, hideAllSections, egyeniIdopontButton, updateNaptarSection } from './app.js';
import { updateProfileSection, editProfField, saveProfField, toggleErtesites, saveNewUserData, changeEmailInFirebase, changePasswordInFirebase, deleteProfileButton, finalDeleteProfile } from './app1-profil.js';
import { fetchMedDataArray, updateEventSection, toggleShowTorolt, toggleShowElmult, toggleMedDetails, loadJelentkezokList, addNewJelentkezo, sendNewJelentkezo, markAttendance, deleteJelentkezo, reactivateJelentkezo, showNewMedForm, closeModal, saveNewMed, editMedField, saveMedField, saveNewMedData, showEditMedDateForm, saveMedDate, showJelenletiIv, closeJelenletiIv, showMedSection} from './app2-med.js';
import { fetchUsersDataArray, updateUsersSection, showNewIdopontForm, saveNewIdopont, openBillingo, saveUserHistory, showUserHistory } from './app3-users.js';
import { initPush } from './app4-pushnotif.js';
import { initCalendar } from './app5-calendar.js';

// **** RUN STARTS HERE **** RUN STARTS HERE **** RUN STARTS HERE ****
// query-k kibontása a fejlécből
const userId = getQueryParam('USER_ID');  // user firestore id
const fb_uid = getQueryParam('fb_uid');  // user firebase id
const login_type = getQueryParam('login_type'); // belépés fajtája
//console.log(userId);
if (userId) {
    // user betöltése a felületre
    console.log("✅ Hello User, I can see you!");
    loadUser();  // felhasználói adatok betöltése és kezdés
} else {
    console.error('❌ Sorry User, I cannot see you!'); //nincs userId
    // visszairányítás a bejelentkezéshez
    window.location.href = `https://szeretetben.hu/be`;
}


// URL fejlécből kiszedi a kért paramétert és visszatér az értékével
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


// ez csak egy próba függvény teszteléshez
export async function proba() {
  //console.log(myUser.szamlacim);
  //alert(myUser.szamlacim);
  console.log('💰 Próba: szerencse!');


const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);
  return;
  
  const templateId = "welcome";
  const data = {
    from: 'info.szeretetben@gmail.com',
    to: 'endrehalaszendre@gmail.com',
    subject: '🌼 Üdv a Szeretetben App-on!',
    keresztnev: myUser.keresztnev,
    activationLink: 'https://www.szeretetben.hu',
    currentYear: new Date().getFullYear(),
  }
  try {
    const response = await fetch('/api/renderEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId, data }),
    });
    const result = await response.json();
    //console.log(result.message, result.userId);
    if (response.ok) {
      console.log(result.message);
      console.log(result.info);
    } else {
      console.log(result.message);
    }
  } catch (error) {
    console.error('proba – Hiba az api hívás során:', error.message);
    alert('proba – Hiba az api hívás során');
  }

}


// User autentikációja és beléptetése az app felületére
export async function loadUser() {
  document.querySelector('.content').classList.add('visible');
  await showLoadingIndicator();
  // Basic user authentikáció még adatlekérés előtt szerver oldalon
  const isAuthOk = await fbUidAuth();
  if (!isAuthOk) {
    // Nem szabad belépni, sőt, még a felhasználó adatait se lekérni! kijelentkezik és kidob
    console.log("😿 Sikertelen autentikáció");
    alert("😿 Sikertelen authentikáció! Kérlek jelentkezz be újra!");
    await logoutUser();
    return;
  }
  // OK
  await fetchUserDataArray(); // user adatok lekérése
  //await fetchMedDataArray(); // med adatok lekérése –» ezt lehet amúgy később is, hogy gyorsabb legyen a futás
  // Autentikáció még egyszer és személyes fejléc betöltése
  if (myUser.fb_uid == fb_uid && myUser.login_type != "") {
    // Be szabad lépni
    console.log("✅ Authentication OK");
    await saveUserHistory("login " + myUser.app_status); // Mentés User History-ba
    // Ha új user, akkor nem ellenőrzünk telefonszám verification-t
    if (myUser.app_status =="newReg") {
      console.log("🎉 Új felhasználó!");
    } else {
      // Telefonszám visszaigazoltságának ellenőrzése
      if (!myUser.tel_verified) {
        //nincs visszaigazolva –» visszaigazolást kérünk
        console.log("❌ Phone verification missing");
        alert('🦊 A telefonszámod nincs visszaigazolva. Kérlek ellenőrizd és igazold vissza!');
        await openProfilePop2();
      }
      console.log("✅ Phone verification OK");
    }
    // Név megjelenítése a fejlécben
    document.getElementById('user-status').textContent = `${myUser.teljesnev}`;
    // Profilkép megjelenítése a fejlécben, ha van
    if (myUser.photoURL) {
      const profilePicture = document.getElementById('profile-picture');
      const profileImg = document.getElementById('profile-img');
      profileImg.src = myUser.photoURL;
      profilePicture.style.display = 'block';
    }
    // Ha valaki admin, akkor assist is, de fordítva nem!
    // Ha assist lépett be, akkor assist gombok mutatása
    if (myUser.assist) {
      document.querySelectorAll('.assistbutton').forEach(function(element) {
        element.classList.remove('hidden');
      });
      // Ha admin is, akkor admin gombok mutatása is
      if (myUser.admin) {
        document.querySelectorAll('.adminbutton').forEach(function(element) {
          element.classList.remove('hidden');
        });
        console.log('🫧 Hello Admin!');
      } else {
        console.log('✨ Hello Assist!');
      }
    } else {
      console.log('🧑 Hello User!');
    }
    // Profil szekció adatfeltöltés
    await showSection("home-section");
    // Ha egy app status-hoz kell ugranunk ott folytatjuk
    switch (myUser.app_status) {
      case "":
        // normál app indulás
        break;
      case "newReg":
        // friss regisztráció
        await welcomeNewReg();
        break;
      case "deleteProfile":
        // profil törléséhez ugrunk
        await finalDeleteProfile();
        break;
    }
  } else {
    // Nem szabad belépni, kijelentkezik és kidob
    console.log("😿 Sikertelen autentikáció");
    alert("😿 Sikertelen authentikáció! Kérlek jelentkezz be újra!");
    await logoutUser();
    // visszairányítás a bejelentkezéshez
    //window.location.href = `https://szeretetben.hu/be`;
  }
}


// Szerver oldalon leellenőrzi, hogy authentikált-e a belépési kísérlet?
export async function fbUidAuth() {
  // user adatlekérés a szervertől
  try {
    const response = await fetch('/api/fbUidAuth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, fb_uid }),
    });
    const result = await response.json();
    //console.log(result.message, result.auth);
    return result.auth;
  } catch (error) {
    console.error('fbUidAuth – Hiba a felhasználó lekérésekor:', error.message);
    return false;
  }
}


// Új regisztráció welcome popup –» üdvözlőszöveg
export async function welcomeNewReg() {
  // Ha már létezik a popup, ne hozd létre újra
  if (document.getElementById("welcomePopup")) return;
  // Popup háttér (nem záródik be ha rákattintanak)
  const overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  // Popup fő doboz
  const popup = document.createElement("div");
  popup.id = "welcomePopup";
  // Bezárás gomb (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => {
    if (confirm("🦊 A profilod kitöltése nélkül sajnos nem lehet tovább lépni az alkalmazásba. Biztosan ki akarsz lépni?")) {
      logoutUser();
    }
  };
  // Kép
  const image = document.createElement("img");
  image.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/welcome-img.jpg?v=1739391221997"; // Használj saját képet
// Üzenet
  const message = document.createElement("p");
  message.innerHTML = `
    <strong>Üdv a Szeretetben App-ban! 🌿</strong><br><br>
    Köszönjük, hogy csatlakoztál! Ahhoz, hogy a lehető legtöbbet hozd ki az élményből, kérjük, töltsd ki a profilodat a következő lépésben!
  `;
  // "Tovább" gomb
  const continueButton = document.createElement("button");
  continueButton.innerText = "Tovább";
  continueButton.onclick = () => {
    document.body.removeChild(overlay);
    openProfilePop1(); // Hívja meg a profil kitöltő ablakot
  };
  overlay.id = "popupOverlay";
  popup.id = "welcomePopup";
  closeButton.classList.add("closeButton");
  image.classList.add("popupImage");
  message.classList.add("popupMessage");
  continueButton.id = "continueButton";
  // Elemek összefűzése
  popup.appendChild(closeButton);
  popup.appendChild(image);
  popup.appendChild(message);
  popup.appendChild(continueButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}


// Profil űrlap popup 1 – vezetéknév, keresztnév, teljes név
export async function openProfilePop1() {
  if (document.getElementById("welcomePopup")) return;
  // Popup háttér
  const overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  // Popup fő doboz
  const popup = document.createElement("div");
  popup.id = "welcomePopup";
  // Bezárás gomb (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.classList.add("closeButton");
  closeButton.onclick = () => {
    if (confirm("🦊 A neved megadása nélkül sajnos nem lehet tovább lépni az alkalmazásba. Biztosan ki akarsz lépni?")) {
      logoutUser();
    }
  };
  // Kisebb kép
  const image = document.createElement("img");
  image.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/DALL%C2%B7E%202025-02-12%2023.10.57%20-%20A%20modern%20and%20bright%20therapy_coaching-themed%20illustration%20depicting%20an%20online%20or%20in-person%20therapy%20session.%20A%20warm%2C%20inspiring%20room%20with%20large%20windows%20l.webp?v=1739398306460"; // Új kép URL
  image.id = "profileImage";
  const loadImage = document.createElement("img");
  loadImage.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/update.png?v=1739520768250"; // UPDATE...
  loadImage.id = "loadImage";
  // Input mezők
  const form = document.createElement("div");
  // Vezetéknév
  const lastNameGroup = document.createElement("div");
  lastNameGroup.classList.add("profileInputGroup");
  const lastNameLabel = document.createElement("label");
  lastNameLabel.innerText = "Vezetéknév:";
  const lastNameInput = document.createElement("input");
  lastNameInput.type = "text";
  lastNameInput.classList.add("profileInput");
  lastNameInput.required = true;
  lastNameInput.value = myUser.vezeteknev;
  lastNameGroup.appendChild(lastNameLabel);
  lastNameGroup.appendChild(lastNameInput);
  // Keresztnév
  const firstNameGroup = document.createElement("div");
  firstNameGroup.classList.add("profileInputGroup");
  const firstNameLabel = document.createElement("label");
  firstNameLabel.innerText = "Keresztnév (ahogy szólítunk):";
  const firstNameInput = document.createElement("input");
  firstNameInput.type = "text";
  firstNameInput.classList.add("profileInput");
  firstNameInput.required = true;
  firstNameInput.value = myUser.keresztnev;
  firstNameGroup.appendChild(firstNameLabel);
  firstNameGroup.appendChild(firstNameInput);
  // Teljes név (dinamikus)
  const fullNameGroup = document.createElement("div");
  fullNameGroup.classList.add("profileInputGroup");
  const fullNameLabel = document.createElement("label");
  fullNameLabel.innerText = "Teljes név:";
  const fullNameInput = document.createElement("input");
  fullNameInput.type = "text";
  fullNameInput.classList.add("profileInput");
  fullNameInput.required = true;
  fullNameInput.value = myUser.teljesnev;
  //fullNameInput.readOnly = true; // Csak olvasható
  fullNameGroup.appendChild(fullNameLabel);
  fullNameGroup.appendChild(fullNameInput);
  // Dinamikus frissítés vezeték- és keresztnévből
  const updateFullName = () => {
    fullNameInput.value = `${lastNameInput.value} ${firstNameInput.value}`.trim();
  };
  lastNameInput.addEventListener("input", updateFullName);
  firstNameInput.addEventListener("input", updateFullName);
  // Mentés gomb
  const saveButton = document.createElement("button");
  saveButton.innerText = "✔ Mentés";
  saveButton.id = "saveButton";
  saveButton.onclick = async () => {
    const new_vezeteknev = lastNameInput.value.trim();
    const new_keresztnev = firstNameInput.value.trim();
    const new_teljesnev = fullNameInput.value.trim();
    if (new_vezeteknev === "" || new_keresztnev === "" || new_teljesnev === "") {
      alert("🐯 Kérlek, töltsd ki a vezeték- és keresztneved!");
      return;
    }
    popup.removeChild(closeButton); // Loader mutatása
    popup.removeChild(saveButton);
    popup.removeChild(form);
    popup.appendChild(loadImage);
    // Ellenőrizzük hogy változtak-e az adatok?
    
    if (new_vezeteknev !== myUser.vezeteknev || new_keresztnev !== myUser.keresztnev || new_teljesnev !== myUser.teljesnev) {
      // Nevek mentése Firebase + myUser array
      await saveNewUserData('vezeteknev', new_vezeteknev); myUser.vezeteknev = new_vezeteknev;
      await saveNewUserData('keresztnev', new_keresztnev); myUser.keresztnev = new_keresztnev;
      await saveNewUserData('teljesnev', new_teljesnev); myUser.teljesnev = new_teljesnev;
      document.getElementById('user-status').textContent = `${new_teljesnev}`; // Név frissítése a fejlécben
    }
    document.body.removeChild(overlay); // Popup bezárása
    await openProfilePop2(); // Következő lépés
  };
  popup.classList.add("welcomePopup");
  closeButton.classList.add("closeButton");
  image.classList.add("popupImage");
  loadImage.classList.add("loadImage");
  // Elemek összefűzése
  form.appendChild(lastNameGroup);
  form.appendChild(firstNameGroup);
  form.appendChild(fullNameGroup);
  popup.appendChild(closeButton);
  popup.appendChild(image);
  popup.appendChild(form);
  popup.appendChild(saveButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}


// Profil űrlap popup 2 – telefonszám, számlázási adatok
export async function openProfilePop2() {
  if (document.getElementById("welcomePopup")) return;
  // Popup háttér
  const overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  // Popup fő doboz
  const popup = document.createElement("div");
  popup.id = "welcomePopup";
  // Bezárás gomb (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.classList.add("closeButton");
  closeButton.onclick = () => {
    if (confirm("🦊 A telefonszámod megadása nélkül sajnos nem lehet tovább lépni az alkalmazásba. Biztosan ki akarsz lépni?")) {
      logoutUser();
    }
  };
  // Kisebb kép
  const image = document.createElement("img");
  image.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/DALL%C2%B7E%202025-02-12%2023.17.03%20-%20A%20modern%20and%20bright%20couples%20therapy_coaching-themed%20illustration%20with%20a%20natural%20and%20less%20figurative%20style.%20A%20male%20therapist%20sits%20across%20from%20a%20married.webp?v=1739398645898"; // Új kép URL
  image.id = "profileImage";
  const loadImage = document.createElement("img");
  loadImage.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/update.png?v=1739520768250"; // UPDATE...
  loadImage.id = "loadImage";
  // Input mezők
  const form = document.createElement("div");
  // Telefon
  const telGroup = document.createElement("div");
  telGroup.classList.add("profileInputGroup");
  const telLabel = document.createElement("label");
  telLabel.innerText = "Telefonszám:";
  const telInput = document.createElement("input");
  telInput.type = "text";
  telInput.classList.add("profileInput");
  telInput.required = true;
  telInput.value = myUser.telefon;
  telGroup.appendChild(telLabel);
  telGroup.appendChild(telInput);
  // Számlázási név
  const szamlaNevGroup = document.createElement("div");
  szamlaNevGroup.classList.add("profileInputGroup");
  const szamlaNevLabel = document.createElement("label");
  szamlaNevLabel.innerText = "Számlázási név (opcionális):";
  const szamlaNevInput = document.createElement("input");
  szamlaNevInput.type = "text";
  szamlaNevInput.classList.add("profileInput");
  szamlaNevInput.required = false;
  szamlaNevInput.value = myUser.szamlanev;
  szamlaNevGroup.appendChild(szamlaNevLabel);
  szamlaNevGroup.appendChild(szamlaNevInput);
  // Számlacím
  const szamlaCimGroup = document.createElement("div");
  szamlaCimGroup.classList.add("profileInputGroup");
  const szamlaCimLabel = document.createElement("label");
  szamlaCimLabel.innerText = "Számlacím (opcionális):";
  const szamlaCimInput = document.createElement("input");
  szamlaCimInput.type = "text";
  szamlaCimInput.classList.add("profileInput");
  szamlaCimInput.required = false;
  szamlaCimInput.value = myUser.szamlacim;
  szamlaCimGroup.appendChild(szamlaCimLabel);
  szamlaCimGroup.appendChild(szamlaCimInput);
  // Mentés gomb
  const saveButton = document.createElement("button");
  saveButton.innerText = "✔ Mentés";
  saveButton.id = "saveButton";
  saveButton.onclick = async () => {
    const new_telefon = telInput.value.trim();
    if (new_telefon === "") {
      alert("🐯 Kérlek, add meg a telefonszámod!");
      return;
    }
    // Telefonszám ellenőrzése
    let telefonszam = new_telefon;
    await saveNewUserData('telefon', telefonszam); // mindenképpen elmentem amit beírt, akkor is, ha rossz
    telefonszam = await checkPhoneNumber(telefonszam);
    //console.log(telefonszam);
    if (telefonszam == null) {
      // A telefonszám nem megfelelő
      //alert("🐯 Érvénytelen telefonszám! Kérlek ellenőrizd! Csak magyar, sms fogadásra képes telefonszám adható meg.");
      return;
    } else {
      // A telefonszám helyes –» mentés (ha van változás) majd tovább
      popup.removeChild(closeButton); // Loader mutatása
      popup.removeChild(saveButton);
      popup.removeChild(form);
      popup.appendChild(loadImage);
      if (telefonszam !== myUser.telefon) {
      // új telefonszám lett beírva –» mentés és hogy nincs visszaigazolva! –» korábbi kód törlése
        // Nevek mentése Firebase + myUser array
        await saveNewUserData('telefon', telefonszam); myUser.telefon = telefonszam; // új szám mentése
        await saveNewUserData('tel_verified', false); myUser.tel_verified = false; // nincs visszaigazolva az új szám
        await saveNewUserData('tel_verif_code', 0); myUser.tel_verif_code = 0; // korábbi kód törlése
      }
      
      const new_szamlanevinput = szamlaNevInput.value.trim();
      const new_szamlaciminput = szamlaCimInput.value.trim();
      if (new_szamlanevinput !== '' && new_szamlanevinput !== myUser.szamlanev) { await saveNewUserData('szamlanev', new_szamlanevinput); myUser.szamlanev = new_szamlanevinput; }
      if (new_szamlaciminput !== '' && new_szamlaciminput !== myUser.szamlacim) { await saveNewUserData('szamlacim', new_szamlaciminput); myUser.szamlacim = new_szamlaciminput; }
      document.body.removeChild(overlay); // Popup bezárása
      // Következő lépés
      openProfilePop3();
    }
  };
  image.classList.add("popupImage");
  loadImage.classList.add("loadImage");
  // Elemek összefűzése
  form.appendChild(telGroup);
  form.appendChild(szamlaNevGroup);
  form.appendChild(szamlaCimGroup);
  popup.appendChild(closeButton);
  popup.appendChild(image);
  popup.appendChild(form);
  popup.appendChild(saveButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}


// ellenőrzi, hogy helyes magyar telefonszámról van-e szó? –» szerveren
// visszatérési érték: null=helytelen szám; "+36301234567"=formázott string telefonszám
export async function checkPhoneNumber(phoneNumber) {
  try {
    const response = await fetch('/api/checkPhoneNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    const result = await response.json();
    //console.log(result.message, result.userId);
    if (response.ok) {
      // helyes szám
      console.log(result.message);
      return result.tel;
    } else {
      // helytelen szám
      console.log(result.message);
      alert(result.message);
      return result.tel;
    }
  } catch (error) {
    console.error('checkPhoneNumber – Hiba az api hívás során:', error.message);
    alert('checkPhoneNumber – Hiba az api hívás során');
    return null;
  }
}


// Profil űrlap popup 3 – telefonszám verification code
export async function openProfilePop3() {
  if (document.getElementById("welcomePopup")) return;
  // Popup háttér
  const overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  // Popup fő doboz
  const popup = document.createElement("div");
  popup.id = "welcomePopup";
  // Bezárás gomb (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.classList.add("closeButton");
  closeButton.onclick = () => {
    if (confirm("🦊 A telefonszámod visszaigazolása nélkül sajnos nem lehet tovább lépni az alkalmazásba. Biztosan ki akarsz lépni?")) {
      logoutUser();
    }
  };
  // Kisebb kép
  const image = document.createElement("img");
  image.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/DALL%C2%B7E%202025-02-15%2000.42.40%20-%20A%20warm%20and%20harmonious%20room%20with%20large%20windows%2C%20filled%20with%20natural%20light.%20A%20male%20therapist%2C%20dressed%20in%20smart%20casual%20attire%20(such%20as%20a%20relaxed%20shirt%20an.webp?v=1739576604507";
  image.id = "profileImage";
  const loadImage = document.createElement("img");
  loadImage.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/update.png?v=1739520768250"; // UPDATE...
  loadImage.id = "loadImage";
  const codeOKimage = document.createElement("img");
  codeOKimage.src = "https://cdn.glitch.global/b5e3bad2-9963-4365-994a-f5d1757d9f4b/codeok.png?v=1739579002283"; // CODE OK...
  codeOKimage.id = "codeOKimage";
  image.classList.add("popupImage"); // css class-ok a képekhez
  loadImage.classList.add("loadImage");
  codeOKimage.classList.add("okImage");
  // Input mezők
  const form = document.createElement("div");
  // Kód küldése
  const sendGroup = document.createElement("div");
  sendGroup.classList.add("profileInputGroup");
  const sendLabel = document.createElement("label");
  sendLabel.innerText = "A telefonszámot SMS kóddal ellenőrizzük! Ide küldtük a kódot, kérlek ellenőrizd: " + myUser.telefon;
  sendGroup.appendChild(sendLabel);
  // Kód beírása
  const codeGroup = document.createElement("div");
  codeGroup.classList.add("profileInputGroup");
  const codeLabel = document.createElement("label");
  codeLabel.innerText = "Az SMS-ben kapott hatjegyű kód:";
  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.classList.add("profileInput");
  codeInput.required = true;
  codeGroup.appendChild(codeLabel);
  codeGroup.appendChild(codeInput);
  // Új kód gomb
  const newCodeGroup = document.createElement("div");
  newCodeGroup.classList.add("profileButtonGroup");
  const newCodeLabel = document.createElement("label");
  newCodeLabel.innerText = "A korábbi kód érvényessége lejárt!";
  const newCodeButton = document.createElement("button");
  newCodeButton.innerText = "Új kódot kérek";
  newCodeButton.id = "backButton";
  newCodeButton.onclick = async () => {
    //  MAJD ÁTVÁLT KÓD BEKÉRÉS NÉZETRE / ÚJRATÖLT AZ ABLAK
    popup.removeChild(closeButton); // Loader mutatása
    popup.removeChild(backButton);
    popup.removeChild(saveButton);
    popup.removeChild(form);
    popup.appendChild(loadImage);
    await sendSMSverifCode(); // kód kiküldése
    document.body.removeChild(overlay); // Popup bezárása
    setTimeout(() => { openProfilePop3(); }, 300); // újra meghívjuk ezt a popup fv-t 300msec után
  }
  newCodeGroup.appendChild(newCodeLabel);
  newCodeGroup.appendChild(newCodeButton);
  // A telefonszám visszaigazolt felirat
  const verifiedGroup = document.createElement("div");
  verifiedGroup.classList.add("profileInputGroup");
  const verifiedLabel = document.createElement("label");
  verifiedLabel.innerText = "A telefonszám vissza lett igazolva: " + myUser.telefon;
  verifiedGroup.appendChild(verifiedLabel);
  // Vissza gomb
  const backButton = document.createElement("button");
  backButton.innerText = "⇽ Vissza";
  backButton.id = "backButton";
  backButton.onclick = async () => {
    document.body.removeChild(overlay); // Popup bezárása
    setTimeout(() => { openProfilePop2(); }, 300); // vissza az előző popup ablakra 300msec után
  }
  // Tovább gomb
  const saveButton = document.createElement("button");
  saveButton.innerText = "✔ Tovább";
  saveButton.id = "saveButton";
  saveButton.onclick = async () => {
    if (!myUser.tel_verified) {
      // még nincs ellenőrizve a telefonszám, szóval ellenőrizzük!
      if (codeInput.value.trim() === "") {
        alert("🐯 Kérlek, add meg az SMS-ben kapott hatszámjegyű megerősítő kódot!");
        return;
      }
      // Kód ellenőrzése
      let code = codeInput.value.trim();
      const codeOK = await checkSMSverifCode(Number(code)); // kód ellenőrzése
      if (!codeOK) {
        // helytelen a kód –» nem lép tovább
        alert('🦊 A beírt kód helytelen! Kérlek ellenőrizd!')
        return;
      } else {
        // helyes a kód –» mentés majd tovább
        popup.removeChild(closeButton); // Loader mutatása
        popup.removeChild(backButton);
        popup.removeChild(saveButton);
        popup.removeChild(form);
        popup.appendChild(loadImage);
        await saveNewUserData('tel_verified', true); myUser.tel_verified = true; // Kód verify mentése Firebase + myUser array
        document.body.removeChild(overlay); // Popup bezárása
        setTimeout(() => { openProfilePop3(); }, 300); // újra meghívjuk ezt a popup fv-t 300msec után
      }
    } else {
      // a telefonszámot már korábban ellenőriztük –» tovább a következő popup-ra
      //await saveNewUserData('app_status', ''); // newReg kész
      document.body.removeChild(overlay); // Popup bezárása
    }
  };
  
  // Elemek összefűzése –» attól függően, hogy kell-e ellenőrzés
  popup.appendChild(closeButton); // X bezárás gomb
  popup.appendChild(image); // nagy kép
  if (myUser.tel_verified) {
    // a telefonszám már vissza van ellenőrizve
    console.log("✅ A telefonszám már vissza lett igazolva");
    form.appendChild(verifiedGroup); // tel visszaigazolva label
    popup.appendChild(form);
    popup.appendChild(codeOKimage); // zöld pipa kép
  } else {
    // a telefonszám még nincs visszaellenőrizve
    console.log("A telefonszám még nem lett visszaigazolva");
    if (myUser.tel_verif_code == 0) {
      // még nem lett kiküldve kód
      console.log("Még nem lett kiküldve kód");
      await sendSMSverifCode(); // kód kiküldése
      form.appendChild(sendGroup); // kód ki lett küldve label
      form.appendChild(codeGroup); // kód bekérése label + input box
      popup.appendChild(form);
    } else {
      // már ki lett küldve a kód
      console.log("Már ki lett küldve kód");
      if (Date.now() > Number(myUser.tel_verif_code_exp)) {
        // a kód már leárt
        console.log("A kód már lejárt");
        form.appendChild(newCodeGroup); // új kód kérése label + button
        popup.appendChild(form);
      } else {
        // a kód még érvényes
        console.log("A kód még érvényes");
        form.appendChild(sendGroup); // kód ki lett küldve label
        form.appendChild(codeGroup); // kód bekérése label + input box
        popup.appendChild(form);
      }
    }
  }
  popup.appendChild(backButton);
  popup.appendChild(saveButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  //MÉG MEGÍRNI:
  //ha telefonszámot módosít a profil ablakban, új visszaigazolást kérni! Ha nem igazol vissza –» kidobni
  //ha belép valaki, minden alkalommal ellenőrizni a telefonszám visszaigazoltságát! Ha nincs –» visszaigazolást kérni, addig nem engedni be!
  //nem magyar telefonszám visszaigazolásának lehetősége –» emailben! –» newReg popupban és tel.módosításnál
  //spam intézkedések (egy ip címről tömeges regisztráció korlátozása, tömeges sms kiküld. számának korl. egyazon felhasználónál, stb., sms küldés api-nál fb_uid is kell, ellenőrizzük)
}


// SMS kód kiküldése –» szerver api
export async function sendSMSverifCode() {
  const userId = myUser.userId;
  const fb_uid = myUser.fb_uid;
  try {
    const response = await fetch('/api/sendSMSverifCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, fb_uid }),
    });
    const result = await response.json();
    //console.log(result.message, result.tel_verif_code, result.tel_verif_code_exp);
    if (response.ok) {
      console.log('💈 SMS kód elküldve!');
      myUser.telverified = false; // nincs még igazolva
      myUser.tel_verif_code = result.tel_verif_code; // Number
      myUser.tel_verif_code_exp = result.tel_verif_code_exp; // String
    } else {
      console.log(result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error('sendSMSverifCode – Hiba az api hívás során:', error.message);
  }
}


// SMS verification code ellenőrzése
export async function checkSMSverifCode(code) {
  if (code == Number(myUser.tel_verif_code)) {
    return true;
  } else {
    return false;
  }
}

// megkapott userId alapján lekéri a user adatait: firestore –» myUser objektum
export async function fetchUserDataArray(askedUserId = userId, idegenUser = false) {
  const userId = String(askedUserId);
  // user adatlekérés a szervertől
  try {
    //console.log("User adatlekérés: ", userId, idegenUser);
    const response = await fetch('/api/getUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    const result = await response.json();
    //console.log(result.message, result.userId);
    if (response.ok) {
      if (idegenUser) { // ha nem a belépett user adatát kérem le –» askedUser
        Object.assign(askedUser, result.data);
      } else {  // ha a belépett user adatát kérem le –» myUser
        Object.assign(myUser, result.data);
        //console.log(myUser.userId, myUser.displayName);
      }
    } else {
      console.log(result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error('fetchUserDataArray – Hiba a felhasználó lekérésekor:', error.message);
  }
}


// Átvált a kattintott szekcióra
export async function showSection(sectionId) {
  if (stillLoading) { return; } // ha még folyik az előző betöltés, akkor ne reagáljon
  await setStillLoading(true); // betöltés folyik
  // összes section elrejtése, betöltés ikon
  await hideAllSections();
  await showLoadingIndicator();
  const targetSection = document.getElementById(sectionId);
  // ha a betöltés-t mutatjuk, akkor kapcsolja le a gombokat, egyébként pedig engedje
  if (sectionId === "betoltes") {
  }
  // Profil szerkesztése gomb
  if (sectionId === 'home-section') {
    await updateHomeSection();
  }
  // Meditációk gomb
  if (sectionId === 'meditaciok-section') {
    await clearJumpTargetMedId(); // ne ugorjon és ne nyissa ki semelyik meditációt
    await fetchMedDataArray();
    await showMedSection();
  }
  // Workshopok gomb
  if (sectionId === 'workshopok-section') {
  }
  // Users gomb
  if (sectionId === 'users-section') {
    await updateUsersSection();
  }
  // Szervezés gomb
  if (sectionId === 'med-event-section') {
    await fetchMedDataArray();
    await updateEventSection();
  }
  // Üzenetek gomb
  if (sectionId === 'uzenetek-section') {
  }
  // Próba gomb
  if (sectionId === 'proba-section') {
    await proba();
    await updateHomeSection();
  }
  // Profil gomb
  if (sectionId === 'profile-edit-section') {
    await updateProfileSection();
  }
  // Naptár rész
  if (sectionId === 'naptar-section') {
    await updateNaptarSection();
  }
  // section mutatása animációval, előtte kis szünet, hogy az eltávolítás életbe lépjen
  if (targetSection) {
    setTimeout(() => {
      targetSection.classList.add('visible', 'slide-in-top');
    }, 10);  // minimális delay, ami garantálja a DOM-frissülést
  }
  await setStillLoading(false); // betöltés befejeződött
}
window.showSection = showSection;  // függvény elérhetővé tétele az ablakban


// Ez a rész végzi az alsó gombsor kattintásokat
// ennek helyileg az app.js-ben itt kell lennie a showSection rész definíciója után!!
window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.getAttribute('data-section');
      await showSection(id);
    });
  });
});


// Betöltés... ikon mutatása
export async function showLoadingIndicator() {
  let mainContainer = document.getElementById("main-container");
  // Először töröljük a régi tartalmat (bármely mutatott section elrejtése)
  await hideAllSections();
  // UPDATE... betöltése
  // Véletlenszerű ikon kiválasztása
  const icons = ["🦊", "🐶", "🐭", "🐹", "🐰", "🐻", "🐼", "🐨", "🐷", "🐮", 
                 "🦁", "🐯", "🐸", "🙈", "🙉", "🙊", "🐥", "🦆", "🦉", "🦋", 
                 "🐢", "🐠", "🐳", "🦧", "🍀", "🌼", "🌈"];
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  // Először ellenőrizzük, hogy létezik-e már a betöltési elem, ha igen, ne hozzunk létre újat
  let existingLoader = document.getElementById("betoltes");
  if (!existingLoader) {
    let loadingDiv = document.createElement("div");
    loadingDiv.id = "betoltes";
    loadingDiv.classList.add("content-section", "visible");
    loadingDiv.innerHTML = `
      <div style="font-size: 50px; text-align: center;">${randomIcon}</div>
      <img src="https://www.szeretetben.hu/wp-content/uploads/2025/01/update.png" alt="Adatok betöltése..." class="loadImage">
    `;
    mainContainer.appendChild(loadingDiv);
  } else {
    existingLoader.innerHTML = '';
    existingLoader.innerHTML = `
      <div style="font-size: 50px; text-align: center;">${randomIcon}</div>
      <img src="https://www.szeretetben.hu/wp-content/uploads/2025/01/update.png" alt="Adatok betöltése..." class="loadImage">
    `;
  }
  existingLoader.classList.add("visible");
}


// User Kijelentkezés, majd kidob a login oldalra
// window=1, ha a kijelentkezés gombbal lépünk ki, window=0, ha automatikus kilépés
export async function logoutUser(gomb=0) {
  if (stillLoading) { return; } // Ha még valamilyen betöltés folyik, akkor nem reagál
  await setStillLoading(true); // betöltés folyik...
  await showLoadingIndicator();
  let myMessage = "";
  if (gomb=1) {
    myMessage = "kijelentkezés gombbal";
  } else {
    myMessage = "(automatikus)";
  }
  await saveUserHistory("logout " + myMessage); // Mentés User History-ba
  try {
      console.log("A User kijelentkezik");
      //await firebase.auth().signOut();
    // IDE EGY SZERVER HÍVÁS JÖN A FIREBASE, FIRESTORE KIJELENTKEZÉSHEZ
      window.location.href = "https://www.szeretetben.hu/be";
      console.log("Oké! Ki is vagy jelentkezve!");
  } catch (error) {
      console.error('Hiba a kijelentkezés során:', error);
  }
  await setStillLoading(false); // betöltés befejeződött
}
window.logoutUser = logoutUser;  // függvény elérhetővé tétele az ablakban


// Frissíti a Főoldal szekció tartalmát
export async function updateHomeSection() {
  // Lekérjük a felhasználó meditációs jelentkezéseit
  const response = await fetch('/api/getUserMedData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: myUser.userId })
  });
  const result = await response.json();
  if (!result.success) {
    console.error("updateHomeSection – Nem sikerült lekérni a meditációs adatokat:", result.message);
    return;
  }
  const jelentkezesek = result.data || []; // jelentkezesek tömbbe jön a lekérés
  //console.log(jelentkezesek);
  // Különválogatjuk a jövőbeni és a múltbeli foglalásokat
  const now = new Date();
  let aktivak = [];
  let elmultak = [];
  jelentkezesek.forEach(jel => {
    const datum = new Date(jel.medDatum);
    const pad = (n) => n.toString().padStart(2, '0');
    let formattedDate = '';
    if (datum >= now) {
      // Aktuális meditáció → csak hónap.nap. óra:perc (év kihagyva)
      formattedDate = `${rovidHonapNevek[datum.getMonth()]}${pad(datum.getDate())}.${pad(datum.getHours())}:${pad(datum.getMinutes())}`;
    } else {
      // Elmúlt meditáció → teljes dátum (év is) majd óra:perc
      formattedDate = `${datum.getFullYear()}.${pad(datum.getMonth() + 1)}.${pad(datum.getDate())}.`;
    }
    const sor = {
      datum,
      formattedDate,
      medCim: "🧘‍♂️ "+ (jel.medCim || '(nincs még címe)'),
      state: jel.state,
      formattedState: stateMappingMedKiiras[jel.state],
      medId: jel.medId
    };
    if (datum >= now) {
      aktivak.push(sor);
    } else {
      elmultak.push(sor);
    }
  });
  // Jövőbeni időpontok növekvő sorrendben (leghamarabbira rendezve)
  aktivak.sort((a, b) => a.datum - b.datum);
  // Elmúlt időpontok csökkenő sorrendben (legutóbbira rendezve)
  elmultak.sort((a, b) => b.datum - a.datum);
  // Töröljük a régi tartalmat
  await hideAllSections();
  // HTML string generálás a szétválogatott tömbökből
  const aktivakHTML = aktivak.map(sor => `
    <div class="homescreen-row">
      <span class="homescreen-date">${sor.formattedDate}</span>
      <span class="homescreen-cim" title="${sor.medCim}">
        <a href="#meditaciok" class="homescreen-cim-link" onclick="jumpToMed(${sor.medId})">${sor.medCim}</a>
      </span>
      <span class="homescreen-state" style="background-color: ${stateMappingMedColor[sor.state] || '#eee'}">${sor.formattedState}</span>
    </div>
  `).join('');
  const elmultakHTML = elmultak.map(sor => `
    <div class="homescreen-row">
      <span class="homescreen-date">${sor.formattedDate}</span>
      <span class="homescreen-cim" title="${sor.medCim}">
        <a href="#meditaciok" class="homescreen-cim-link" data-medid="${sor.medId}">${sor.medCim}</a>
      </span>
    </div>
  `).join('');
  // Létrehozzuk az új tartalmat
  const message1 = 'Meditáció 1';
  let homeDiv = document.createElement("div");
  homeDiv.classList.add("content-box"); // Hozzáadjuk a megfelelő osztályt
  homeDiv.innerHTML = `
    <h2>Üdvözöllek</h2>
    <div class="data-row-homescreen">
      <h3><b>Aktuális foglalásaim</b></h3>
      <div class="data-content-homescreen" id="aktualis-container">
        ${aktivakHTML || '<i>Nincs meditációra jelentkezés</i>'}
      </div>
    </div>
    
    <div class="data-row-homescreen">
      <h3><b>Továbbiak</b></h3>
      <div class="data-content-homescreen" id="tovabbiak-container">
        <a role="button" id="message1-edit" onclick="egyeniIdopontButton('message1', 'text', '${message1}')">📆 Egyéni időpontfoglalás</a>
        <a role="button" id="message1-edit" onclick="editField('message1', 'text', '${message1}')">💬 Üzenet küldése</a>
      </div>
    </div>
    
    <div class="data-row-homescreen">
      <h3><b>Előzmények</b></h3>
      <div class="data-content-homescreen" id="elozmenyek-container">
        ${elmultakHTML || '<i></i>'}
        <a role="button" id="message1-edit" onclick="editField('message1', 'text', '${message1}')">💰 Fizetés</a>
      </div>
    </div>
    
    <div class="data-row-homescreen">
      <h3><b>Előzmények</b></h3>
      <div class="data-content-homescreen" id="elozmenyek-container">
        <p id="message1-value">Korábbi meditáció2 – nincs kifizetve</p>
        <a role="button" id="message1-edit" onclick="editField('message1', 'text', '${message1}')">💰 Fizetés</a>
      </div>
    </div>
  `;
  homeDiv.querySelector('h2').textContent = `Szia ${myUser.keresztnev}!`;
  // Hozzáadjuk az új tartalmat
  const targetSection = document.getElementById("home-section");
  targetSection.innerHTML = ''; // korábbi tartalom törlése
  targetSection.appendChild(homeDiv);
  await initCalendar();
}
window.jumpToMed = jumpToMed;  // függvény elérhetővé tétele az ablakban
window.egyeniIdopontButton = egyeniIdopontButton;


// Linkre kattintáskor az adott meditációra ugrik
export async function jumpToMed(medId) {
  await setJumpTargetMedId(medId); // célt eltároljuk, amire ugrunk
  await showLoadingIndicator();
  await fetchMedDataArray();
  await showMedSection();
}


// Naptár szekcióra ugrik
export async function egyeniIdopontButton() {
  await updateNaptarSection();
}


// Elrejti az összes section tartalmát (vagy a loading indicator-t)
export function hideAllSections() {
  const mainContainer = document.getElementById("main-container");
  mainContainer.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('visible', 'slide-in-top');
  });
}

// Frissíti a Naptár szekció tartalmát (szabad időpontok naptár)
export async function updateNaptarSection() {
  await showLoadingIndicator();
  await hideAllSections();
  const target = document.getElementById('naptar-section');
  target.innerHTML = ''; // korábbi tartalom törlése
  const wrapper = document.createElement('div');
  wrapper.classList.add('content-box');
  wrapper.innerHTML = `
    <div id="calendar-container" style="display: block;">
      <div id="calendar"></div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button id="close-naptar-btn" class="popup-button popup-button-zold">Bezár</button>
    </div>
  `;
  target.appendChild(wrapper);
  target.classList.add('visible'); // megjelenítjük
  setTimeout( async () => { // naptár inicializálása
    await initCalendar();
  }, 200);
  // Bezárás gomb működés
  const closeBtn = document.getElementById('close-naptar-btn');
  closeBtn.addEventListener('click', async () => {
    target.classList.remove('visible');
    await showSection('home-section');
  });
}


















