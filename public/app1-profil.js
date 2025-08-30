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
import { proba, loadUser, fbUidAuth, welcomeNewReg, openProfilePop1, openProfilePop2, checkPhoneNumber, openProfilePop3, sendSMSverifCode, checkSMSverifCode, fetchUserDataArray, showSection, showLoadingIndicator, logoutUser, updateHomeSection, jumpToMed, hideAllSections, egyeniIdopontButton, updateNaptarSection } from './app.js';
//import { updateProfileSection, editProfField, saveProfField, toggleErtesites, saveNewUserData, changeEmailInFirebase, changePasswordInFirebase, deleteProfileButton, finalDeleteProfile } from './app1-profil.js';
import { fetchMedDataArray, updateEventSection, toggleShowTorolt, toggleShowElmult, toggleMedDetails, loadJelentkezokList, addNewJelentkezo, sendNewJelentkezo, markAttendance, deleteJelentkezo, reactivateJelentkezo, showNewMedForm, closeModal, saveNewMed, editMedField, saveMedField, saveNewMedData, showEditMedDateForm, saveMedDate, showJelenletiIv, closeJelenletiIv, showMedSection} from './app2-med.js';
import { fetchUsersDataArray, updateUsersSection, showNewIdopontForm, saveNewIdopont, openBillingo, saveUserHistory, showUserHistory } from './app3-users.js';
import { initPush } from './app4-pushnotif.js';
import { initCalendar } from './app5-calendar.js';

// Frissíti a profil szekció tartalmát
export async function updateProfileSection() {
  // Először töröljük a régi tartalmat
  await hideAllSections();
  let newBox = document.createElement("div");
  newBox.classList.add("content-box"); // Hozzáadjuk a megfelelő osztályt
  newBox.innerHTML = `
    <h2>Profilom</h2>

    <div class="data-row">
        <h3><b>Teljes név</b></h3>
        <div class="data-content" id="teljesnev-container">
            <p id="teljesnev-value">${myUser.teljesnev || '–'}</p>
            <a role="button" id="teljesnev-edit" onclick="editProfField('teljesnev', 'text', '${myUser.teljesnev || ''}')">✏️</a>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Vezetéknév</b></h3>
        <div class="data-content" id="vezeteknev-container">
            <p id="vezeteknev-value">${myUser.vezeteknev || '–'}</p>
            <a role="button" id="vezeteknev-edit" onclick="editProfField('vezeteknev', 'text', '${myUser.vezeteknev || ''}')">✏️</a>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Keresztnév (így szólítunk)</b></h3>
        <div class="data-content" id="keresztnev-container">
            <p id="keresztnev-value">${myUser.keresztnev || '–'}</p>
            <a role="button" id="keresztnev-edit" onclick="editProfField('keresztnev', 'text', '${myUser.keresztnev || ''}')">✏️</a>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Telefonszám</b></h3>
        <div class="data-content" id="telefon-container">
            <p id="telefon-value">${myUser.telefon || '–'}</p>
            <a role="button" id="telefon-edit" onclick="editProfField('telefon', 'tel', '${myUser.telefon || ''}')">✏️</a>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Email</b></h3>
        <div class="data-content" id="email-container">
            <p id="email-value">${myUser.email || '–'}</p>
            <a role="button" id="email-edit" onclick="editProfField('email', 'email', '${myUser.email || ''}')">✏️</a>
        </div>
    </div>
    
    <div class="data-row">
        <h3><b>Jelszó</b></h3>
        <div class="data-content" id="password-container">
            <p id="password-value">**********</p>
            <a role="button" id="password-edit" onclick="editProfField('password', 'password', '${myUser.email || ''}')">✏️</a>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Értesítés meditációkról</b></h3>
        <div class="data-content">
            <p id="medErtesitesText">${myUser.med_ertesit ? "Igen" : "Nem"}</p>
            <label class="switch">
                <input type="checkbox" id="medErtesites" ${myUser.med_ertesit ? "checked" : ""} onclick="toggleErtesites('med')">
                <span class="slider round"></span>
            </label>
        </div>
    </div>

    <div class="data-row">
        <h3><b>Értesítés workshopokról</b></h3>
        <div class="data-content">
            <p id="wsErtesitesText">${myUser.ws_ertesit ? "Igen" : "Nem"}</p>
            <label class="switch">
                <input type="checkbox" id="wsErtesites" ${myUser.ws_ertesit ? "checked" : ""} onclick="toggleErtesites('ws')">
                <span class="slider round"></span>
            </label>
        </div>
    </div>
    
    <div class="data-row">
        <h3><b>Név a számlán</b></h3>
        <div class="data-content" id="szamlanev-container">
            <p id="szamlanev-value">${myUser.szamlanev || '–'}</p>
            <a role="button" id="szamlanev-edit" onclick="editProfField('szamlanev', 'text', '${myUser.szamlanev || ''}')">✏️</a>
        </div>
    </div>
    
    <div class="data-row">
        <h3><b>Számlacím</b></h3>
        <div class="data-content" id="szamlacim-container">
            <p id="szamlacim-value">${myUser.szamlacim || '–'}</p>
            <a role="button" id="szamlacim-edit" onclick="editProfField('szamlacim', 'text', '${myUser.szamlacim || ''}')">✏️</a>
        </div>
    </div>
    
    <div class="data-row">
        <h3><b>Belépés módja</b></h3>
        <div class="data-content">
            <p id="belepesmod-value">${myUser.login_type}</p>
            <a role="button" class="empty-edit"></a> <!-- Üres -->
        </div>
    </div>
    
    <div class="data-row">
        <h3><b>Regisztráció törlése</b></h3>
        <div class="data-content">
            <p id="deleteProfile-value">${myUser.app_status}</p>
            <a role="button" id="deleteProfile-edit" onclick="editProfField('deleteProfile', 'text', '${myUser.app_status || ''}')">✏️ <span>törlés</span></a>
        </div>
    </div>
  `;
  // Hozzáadjuk az új tartalmat
  const targetSection = document.getElementById("profile-edit-section");
  targetSection.innerHTML = ''; // korábbi tartalom törlése
  targetSection.appendChild(newBox);
}


// szerkeszthetőre váltja a profil mezőt
export async function editProfField(fieldName, fieldType, currentValue) {
  // ha email-t akar módosítani
  if (fieldName == "email") {
    if (myUser.login_type == "google") {
      alert('🦊 Google fiókkal vagy belépve, ezért nem tudod megváltoztatni!');
      return;
    } else {
      const valasz = confirm('⚠️ Az email címed módosításakor új jelszót is meg kell majd adnod. 📨 Majd a regisztrációt vissza kell igazolnod az új email fiókodból! Közben kiléptetnünk az alkalmazásból. ‼️ Vigyázat! Ha most rosszul írod be az új email címed, kizárod magad a fiókodból. Biztosan email címet váltasz?');
      if (!valasz) return;
    }
  } else if (fieldName == "password") {
    if (myUser.login_type == "google") {
      alert('🦊 Google fiókkal vagy belépve, ezért nem tudod megváltoztatni!');
      return;
    } else {
      const valasz = confirm('📨 Az email címedre küldjük ki az email megújító linket. ⚠️ Újra be kell lépned! Biztosan jelszót változtatsz?');
      if (!valasz) return;
      await changePasswordInFirebase();
      await logoutUser();  // Kijelentkezés átirányítással
      return;
    }
  } else if (fieldName == "deleteProfile") {
    if (confirm('🦊 Vigyázat, ez törli a regisztrációdat! Biztosan ezt akarod?')) await deleteProfileButton();
    return;
  }
  
    
  let fieldContainer = document.getElementById(fieldName + "-container");
  // Lecseréljük a szöveget egy input mezőre
  fieldContainer.innerHTML = `
      <input type="${fieldType}" id="${fieldName}-input" value="${currentValue}" class="edit-input">
      <a role="button" class="save-link" onclick="saveProfField('${fieldName}', '${currentValue}')">✅ <span>Mentés</span></a>
  `;
}
window.editProfField = editProfField;  // függvény elérhetővé tétele az ablakban


// profil mező szerkesztése: Mentés
export async function saveProfField(fieldName, oldValue, askedUserId = myUser.userId) {
  let newValue = document.getElementById(fieldName + "-input").value.trim();
  let fieldContainer = document.getElementById(fieldName + "-container");
  let itIsMyUser = (askedUserId === myUser.userId) ? true : false;
  
  // ha email-t módosít
  if (fieldName == "email") {
    if (newValue == myUser.email) {
      alert('🦊 Az email címed nem változott! Eddig is ez volt!');
    } else {
      const newPassword = prompt('Mi legyen az új belépési jelszavad?');
      alert('✅ Rendben! Kijelentkezés után igazold vissza a regisztrációt az új email fiókodból!');
      // Email megváltoztatása Firebaseben –» szerver
      await changeEmailInFirebase(newValue, newPassword);
      
      // Új email mentése firestore-ban
      //console.log(`Mentés: ${fieldName} -> ${newValue}`);
      myUser[fieldName] = newValue;  // objektum frissítése
      await saveNewUserData(fieldName, newValue, askedUserId);  // firestore frissítése
      logoutUser();  // Kijelentkezés átirányítással
    }
  } else if (fieldName == "teljesnev") {
    // név frissítése a fejlécben is, ha myUser-t frissítjük
    if (itIsMyUser) { document.getElementById('user-status').textContent = `${newValue}`; }
    // Új érték mentése firestore-ban
    //console.log(`Mentés: ${fieldName} -> ${newValue}`);
    myUser[fieldName] = newValue;  // objektum frissítése
    await saveNewUserData(fieldName, newValue, askedUserId);  // firestore frissítése
  } else if (fieldName == "telefon") {
    // Telefonszám módosítás –» ellenőrzés + visszaigazolás, ha kell!
    let telefonszam = newValue;
    telefonszam = await checkPhoneNumber(telefonszam); // Ellenőrizzük. Ha nem jó szám, nem mentjük el sehová!
    //console.log(telefonszam);
    if (telefonszam == null) {
      // A telefonszám formátum nem megfelelő –» felhozom a popup ablakot!
      //alert("🐯 Érvénytelen telefonszám! Kérlek ellenőrizd! Csak magyar mobilszám adható meg.");
      return;
    } else {
      // A telefonszám helyes formátum
      if (telefonszam !== myUser.telefon) {
      // új telefonszám lett beírva –» mentés és hogy nincs visszaigazolva! –» korábbi kód törlése
        // Nevek mentése Firebase + myUser array
        await saveNewUserData('telefon', telefonszam, askedUserId); myUser.telefon = telefonszam; // új szám mentése
        await saveNewUserData('tel_verified', false, askedUserId); myUser.tel_verified = false; // nincs visszaigazolva az új szám
        await saveNewUserData('tel_verif_code', 0, askedUserId); myUser.tel_verif_code = 0; // korábbi kód törlése
      }
      await openProfilePop3(); // telefonszám visszaigazoló popup
      newValue = telefonszam;
    }
  } else {
    // Új érték mentése firestore-ban
    //console.log(`Mentés: ${fieldName} -> ${newValue}`);
    myUser[fieldName] = newValue;  // objektum frissítése
    await saveNewUserData(fieldName, newValue, askedUserId);  // firestore frissítése
  }
  // Visszaállítjuk az eredeti nézetet
  fieldContainer.innerHTML = `
      <p id="${fieldName}-value">${newValue}</p>
      <a role="button" id="${fieldName}-edit" onclick="editProfField('${fieldName}', 'text', '${newValue}')">✏️</a>
  `;
  const kiTette = itIsMyUser ? "(user)" : "(admin: " + myUser.userId + ")";
  await saveUserHistory("profil adatmódosítás " + kiTette + " " + "["+ fieldName +"] " + oldValue + "–» " + newValue); // Mentés User History-ba
}
window.saveProfField = saveProfField;  // függvény elérhetővé tétele az ablakban


// Profilom csúszkák kezelése
export async function toggleErtesites(type, askedUserId = myUser.userId) {
  let itIsMyUser = (askedUserId === myUser.userId) ? true : false;
  // Meghatározzuk, hogy meditációs vagy workshop értesítésről van szó
  const checkbox = document.getElementById(type + "Ertesites");
  const textElement = document.getElementById(type + "ErtesitesText");
  const newValue = checkbox.checked ? "Igen" : "Nem";  // Új érték meghatározása
  textElement.textContent = newValue;  // Frissítjük a feliratot
  const myKey = type + "_ertesit"; // Firestore mező neve
  const myValue = checkbox.checked; // Boolean érték
  if (saveNewUserData(myKey, myValue, askedUserId)) {
    // sikeres mentés
    //console.log("Sikeres mentés:", result);
    // Frissítsük az objektumot is, hogy az app belső állapota naprakész maradjon
    myUser[type + "_ertesit"] = checkbox.checked;
    const kiTette = itIsMyUser ? "(user)" : "(admin: " + myUser.userId + ")";
    await saveUserHistory("profil értesítés módosítása " + kiTette + " " + "["+ myKey +"] –» " + newValue); // Mentés User History-ba
  } else {
    // Ha hiba van, visszaállítjuk az eredeti állapotot
    checkbox.checked = !checkbox.checked;
    textElement.textContent = checkbox.checked ? "Igen" : "Nem";
  }
}
window.toggleErtesites = toggleErtesites;  // függvény elérhetővé tétele az ablakban


// user adatmentés kérése a szervertől
export async function saveNewUserData(key, newValue, askedUserId = myUser.userId) {
  try {
    const response = await fetch('/api/saveUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ askedUserId, key, newValue }),
    });
    const result = await response.json();
    //console.log(result.message, result.userId);
    if (response.ok) {
      //console.log(result.message);
      return true;
    } else {
      console.log(result.message);
      alert(result.message);
      return false;
    }
  } catch (error) {
    console.error('saveNewUserData – Hiba az api hívás során:', error.message);
    return false;
  }
}


// Email-változtatás kérése a szervertől (Firebase)
export async function changeEmailInFirebase(newEmail, newPassword) {
  // szerver endpoint hívás
  const firebase_uid = myUser.fb_uid;
  try {
    const response = await fetch('/api/changeEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebase_uid, newEmail, newPassword }),
    });
    const result = await response.json();
    if (response.ok) {
      //console.log(result.message);
    } else {
      console.log(result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error('changeEmailInFirebase – Hiba az api hívás során:', error.message);
  }
}


// Jelszó megújítás kérése a szervertől (Firebase)
export async function changePasswordInFirebase() {
  // szerver endpoint hívás
  const email = myUser.email;
  try {
    const response = await fetch('/api/changePassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    await saveUserHistory("jelszó változtatási kérelem " + email); // Mentés User History-ba
    if (response.ok) {
      alert(result.message);
    } else {
      console.log(result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error('changeEmailInFirebase – Hiba az api hívás során:', error.message);
  }
}


// Ez kezeli a profil törlését
export async function deleteProfileButton() {
  // csak akkor törölhesse a profilját valaki, ha a jelentkezéseit előbb lemondja!
  console.log("⚠️ Felhasználó törli a profilját");
  await saveUserHistory("profil törlés kísérlete 1.lépés"); // Mentés User History-ba
  if (confirm("Profil törlése: 🛑 Ha törlöd a profilodat, minden adatod el fog veszni! Kilépsz a Szeretetben App-ról és a regisztrációdat mindenestül töröljük. ⚠️ Biztosan szeretnéd a profilod törlését?")) {
    console.log("⚠️ Felhasználó tényleg törölni akarja a profilját");
    await saveUserHistory("profil törlés kísérlete 2.lépés"); // Mentés User History-ba
    // Ide jöhet a törlés API hívása –» bejegyezzük az adatbázisba a törlési kérelmet
    showSection("profilom");
    // Firebase minden authentikációs mód törlése
    alert("A profilod törléséhez újra be kell jelentkezned!");
    // Törlési kérelem mentése
    myUser.app_status = "deleteProfile";
    await saveNewUserData('app_status', 'deleteProfile');
    // kilép, újra be kell lépnie
    await logoutUser();
    window.location.href = `https://szeretetben.hu/be`;
  } else {
    console.log("🐰 Felhasználó mégsem törli a profilját");
    await saveUserHistory("profil törlés megszakítva"); // Mentés User History-ba
  }
}


// Profil végleges törlése újra belépés után
export async function finalDeleteProfile() {
  // Firebase minden authentikációs mód törlése
  if (confirm("Profil törlése: 🛑 Ha az OK-ra kattintasz, már nem fogjuk tudni visszaállítani a profilodat. ⚠️ Biztosan szeretnéd a regisztrációd végleges törlését?")) {
    await saveUserHistory("profil törlés kísérlete 3.lépés"); // Mentés User History-ba
    if (confirm("Profil törlése: ⚠️ Egészen egészen biztosan?")) {  
      await saveUserHistory("profil törlés kísérlete 4.lépés"); // Mentés User History-ba
      if (confirm("Profil törlése: 🦊 Végérvényesen és teljesen?")) {
        await saveUserHistory("profil törlés véglegesen 5.lépés"); // Mentés User History-ba
        console.log("⚠️ Felhasználó tényleg végleg törli a profilját");
        // Ide jöhet a törlés API hívása –» firebase és firestore törlés is!
        // átirányítás a honlapomra
        //window.location.href = `https://szeretetben.hu`;
        return;
      }
    }
  }
  console.log("🐰 Felhasználó mégsem törli a profilját");
  await saveUserHistory("profil törlés megszakítva"); // Mentés User History-ba
  await saveNewUserData('app_status', '');
  myUser.app_status = '';  
}