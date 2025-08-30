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
import { updateProfileSection, editProfField, saveProfField, toggleErtesites, saveNewUserData, changeEmailInFirebase, changePasswordInFirebase, deleteProfileButton, finalDeleteProfile } from './app1-profil.js';
import { fetchMedDataArray, updateEventSection, toggleShowTorolt, toggleShowElmult, toggleMedDetails, loadJelentkezokList, addNewJelentkezo, sendNewJelentkezo, markAttendance, deleteJelentkezo, reactivateJelentkezo, showNewMedForm, closeModal, saveNewMed, editMedField, saveMedField, saveNewMedData, showEditMedDateForm, saveMedDate, showJelenletiIv, closeJelenletiIv, showMedSection} from './app2-med.js';
//import { fetchUsersDataArray, updateUsersSection, showNewIdopontForm, saveNewIdopont, openBillingo, saveUserHistory, showUserHistory } from './app3-users.js';
import { initPush } from './app4-pushnotif.js';
import { initCalendar } from './app5-calendar.js';

// lekéri a felhasználók adatait az adatbázisból –» allUsers array
export async function fetchUsersDataArray() {
    // felhasználók adatlekérése a szervertől
  try {
    let response = await fetch('/api/getAllUsersData');
    let users = await response.json();
    if (!users.data || users.data.length === 0) {
      alert("Nincs elérhető felhasználó.");
      return null;
    }
    return users;
  } catch (error) {
    console.error('/api/getAllUsersData – Hiba az api hívás során:', error.message);
  }  
}


// Megjeleníti a felhasználók listáját
export async function updateUsersSection() {
  try {
    let users = await fetchUsersDataArray(); // user lista lekérése
    if (users === null) { return; } // nincs egy user sem a listában
    // Töröljük a korábbi tartalmat
    await hideAllSections();
    // User lista létrehozása
    let newBox = document.createElement("div");
    newBox.classList.add("users-content-box"); // Users lista konténer
    newBox.innerHTML = `
      <h2>Felhasználók</h2>

      <div class="filter-options">
      <a role="button" id="create-user-btn" onclick="showNewUserForm()">👩‍🦱 <span>Új felhasználó</span></a>
        <label class="switch">
          <input type="checkbox" id="toggleShowTorolt" ${myUser.show_torolt ? "checked" : ""} onclick="toggleShowTorolt()">
          <span class="slider round"></span>
        </label>
        <span> Töröltek</span>
      </div>
    `;

    let listContent = document.createElement("div");
    listContent.classList.add("popup-content");
    // Keresőmező és gomb elkészítése
    let searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");
    let searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Keresés...";
    searchInput.classList.add("search-input");
    let searchButton = document.createElement("button");
    searchButton.innerHTML = "🔍";
    searchButton.classList.add("search-button");
    searchButton.onclick = filterUsers;
    searchInput.onkeydown = (e) => { if (e.key === "Enter") filterUsers(); };
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);
    // user-ek keresése, szűrése
    function filterUsers() {
      const searchText = searchInput.value.toLowerCase();
      const rows = userList.querySelectorAll(".user-row");
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(searchText) ? "" : "none";
      });
    }

    // Userlista elkészítése
    let userList = document.createElement("div");
    userList.classList.add("user-list");
    userList.classList.add("user-list-scrollable");
    users.data.forEach(user => {
      let userRow = document.createElement("div");
      userRow.classList.add("user-row");
      userRow.dataset.userId = user.userId; // minden userId-t letárolunk
      // Belső mezők: név, email, telefon
      let nameCol = document.createElement("div");
      nameCol.classList.add("user-col", "user-name");
      nameCol.innerText = user.vezeteknev + " " + user.keresztnev;
      let emailCol = document.createElement("div");
      emailCol.classList.add("user-col", "user-email");
      emailCol.innerText = user.email;
      let telCol = document.createElement("div");
      telCol.classList.add("user-col", "user-phone");
      telCol.innerText = user.telefon;
      userRow.appendChild(nameCol);
      userRow.appendChild(emailCol);
      userRow.appendChild(telCol);
      // egy adott user nevére kattintáskor: ADATLAP NYÍLIK
      userRow.onclick = async () => {
        // adott user adatainak lekérése a szerverről
        const askedUserId = userRow.dataset.userId;
        await fetchUserDataArray(askedUserId, true);
        newBox.innerHTML = ""; // Töröljük a container tartalmát rákattintáskor, majd új tartalom ugyanebbe
        newBox.innerHTML = ` 
        <div class="userfejlec-wrapper">
          <div class="profile-picture" id="askeduser-profile-picture">
            <img src="" alt="Profilkép" id="askeduser-profile-img">
          </div>
          <h2 id="userfejlec-container">${askedUser.teljesnev || '–'}</h2>
        </div>
          
        <div class="menu-line-user">
        <a role="button" id="user-create-idopont-btn" onclick="showNewIdopontForm()">📆 <span>Időpont</span></a>
        <a role="button" id="user-med-jelentkez-btn" onclick="showNewMedForm()">🧘 <span>Medit</span></a>
        <a role="button" id="user-workshop-jelentkez-btn" onclick="showNewMedForm()">🎓 <span>Worksh</span></a>
        <a role="button" id="user-billingo-btn" onclick="openBillingo('${askedUser.szamlanev}', '${askedUser.szamlacim}')">🧾 <span>Számla</span></a>
        <a role="button" id="user-fizet-btn" onclick="showNewMedForm()">💰 <span>Fizet</span></a>
        <a role="button" id="user-uzenet-btn" onclick="showNewMedForm()">💬 <span>Üzen</span></a>
        </div>

        <div class="data-row">
            <h3><b>Teljes név</b></h3>
            <div class="data-content" id="teljesnev-container">
                <p id="teljesnev-value">${askedUser.teljesnev || '–'}</p>
                <a role="button" id="teljesnev-edit" onclick="editProfField('teljesnev', 'text', '${askedUser.teljesnev || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Vezetéknév</b></h3>
            <div class="data-content" id="vezeteknev-container">
                <p id="vezeteknev-value">${askedUser.vezeteknev || '–'}</p>
                <a role="button" id="vezeteknev-edit" onclick="editProfField('vezeteknev', 'text', '${askedUser.vezeteknev || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Keresztnév (így szólítunk)</b></h3>
            <div class="data-content" id="keresztnev-container">
                <p id="keresztnev-value">${askedUser.keresztnev || '–'}</p>
                <a role="button" id="keresztnev-edit" onclick="editProfField('keresztnev', 'text', '${askedUser.keresztnev || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Telefonszám</b></h3>
            <div class="data-content" id="telefon-container">
                <p id="telefon-value">${askedUser.telefon || '–'}</p>
                <a role="button" id="telefon-edit" onclick="editProfField('telefon', 'tel', '${askedUser.telefon || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Email</b></h3>
            <div class="data-content" id="email-container">
                <p id="email-value">${askedUser.email || '–'}</p>
                <a role="button" id="email-edit" onclick="editProfField('email', 'email', '${askedUser.email || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Értesítés meditációkról</b></h3>
            <div class="data-content">
                <p id="medErtesitesText">${askedUser.med_ertesit ? "Igen" : "Nem"}</p>
                <label class="switch">
                    <input type="checkbox" id="medErtesites" ${askedUser.med_ertesit ? "checked" : ""} onclick="toggleErtesites('med')">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Értesítés workshopokról</b></h3>
            <div class="data-content">
                <p id="wsErtesitesText">${askedUser.ws_ertesit ? "Igen" : "Nem"}</p>
                <label class="switch">
                    <input type="checkbox" id="wsErtesites" ${askedUser.ws_ertesit ? "checked" : ""} onclick="toggleErtesites('ws')">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Név a számlán</b></h3>
            <div class="data-content" id="szamlanev-container">
                <p id="szamlanev-value">${askedUser.szamlanev || '–'}</p>
                <a role="button" id="szamlanev-edit" onclick="editProfField('szamlanev', 'text', '${askedUser.szamlanev || ''}')">✏️ <span></span></a>
            </div>
        </div>
        
        <div class="data-row">
            <h3><b>Számlacím</b></h3>
            <div class="data-content" id="szamlacim-container">
                <p id="szamlacim-value">${askedUser.szamlacim || '–'}</p>
                <a role="button" id="szamlacim-edit" onclick="editProfField('szamlacim', 'text', '${askedUser.szamlacim || ''}')">✏️ <span></span></a>
            </div>
        </div>

        <div class="data-row">
            <h3><b>Belépés módja</b></h3>
            <div class="data-content">
                <p id="belepesmod-value">${askedUser.login_type}</p>
                <a role="button" class="empty-edit"></a> <!-- Üres -->
            </div>
        </div>

        <div class="data-row">
            <h3><b>Regisztráció törlése</b></h3>
            <div class="data-content">
                <p id="deleteProfile-value">${askedUser.app_status}</p>
                <a role="button" id="deleteProfile-edit" onclick="editProfField('deleteProfile', 'text', '${askedUser.app_status || ''}')">✏️ <span>törlés</span></a>
            </div>
        </div>
        
        <div class="menu-line-user">
          <a role="button" id="user-history-btn" onclick="showUserHistory('${askedUser.userId}')">📜 <span>History</span></a>
        </div>
      `;
        // Profilkép megjelenítése a fejlécben, ha van
        if (askedUser.photoURL) {
          const profilePicture = document.getElementById('askeduser-profile-picture');
          const profileImg = document.getElementById('askeduser-profile-img');
          profileImg.src = askedUser.photoURL;
          profilePicture.style.display = 'block';
        }
      }; //onclick vége

      userList.appendChild(userRow);
    });
    // Új tartalom összeállítása
    listContent.appendChild(searchContainer);
    listContent.appendChild(userList);
    newBox.appendChild(listContent);
    // Hozzáadjuk az új tartalmat
    const targetSection = document.getElementById("users-section");
    targetSection.innerHTML = ''; // korábbi tartalom törlése
    targetSection.appendChild(newBox);
    targetSection.classList.add('visible');
    setTimeout(() => searchInput.focus(), 0); // Focus a keresőmezőre a popup megnyitásakor
  } catch (error) {
    console.error("updateUsersSection – Hiba a felhasználók lekérése során:", error);
  }
}


// Új időpont létrehozása popup
export async function showNewIdopontForm() {
  let modalContainer = document.createElement("div");
  modalContainer.classList.add("modal-container");

  let modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  modalContent.innerHTML = `
    <span class="close-btn" onclick="closeModal()">✖</span>
    <h2>📆 Új időpont 📆</h2>
    
    <div class="med-form">
      <label for="newIpMegnevezes"><b>Megnevezés</b></label>
      <input type="text" id="newIpMegnevezes" placeholder="(Opcionális)">

      <label for="newIpDate"><b>Dátum</b></label>
      <input type="text" id="newIpDate">

      <label for="newIpTime"><b>Idő</b></label>
      <input type="time" id="newIpTime" value="16:00">
      
      <label for="newIpHelyszin"><b>Helyszín</b></label>
      <input type="text" id="newIpHelyszin" placeholder="Átrium, PEST">
      
      <label for="newIpTartam"><b>Időtartam</b></label>
      <input type="number" id="newIpTartam" value=1-1,5 óra>

      <button onclick="saveNewIdopont()">✅ Mentés</button>
    </div>
  `;
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);
  // Dátum picker init
  flatpickr("#newIpDate", {
    dateFormat: "Y.m.d",
    static: true,
    disableMobile: true,
    locale: {
      firstDayOfWeek: 1 // hétfő
    }
  });
  // Alapértelmezett dátum beállítása
  // Alapértelmezett dátum beállítása YYYY.MM.DD formátumban
  let today = new Date();
  let formattedDate = today.getFullYear() + "." + 
                      ("0" + (today.getMonth() + 1)).slice(-2) + "." + 
                      ("0" + today.getDate()).slice(-2);

  document.getElementById("newIpDate").value = formattedDate;
  modalContainer.addEventListener("click", (event) => { if (event.target === modalContainer) { closeModal(); } });
}
window.showNewIdopontForm = showNewIdopontForm;  // függvény elérhetővé tétele az ablakban


// Új meditáció elmentése a mentés gombra kattintáskor
export async function saveNewIdopont() {
  let title = document.getElementById("newMedTitle").value.trim();
  let date = document.getElementById("newMedDate").value;
  let time = document.getElementById("newMedTime").value;
  let maxEmber = document.getElementById("newMaxEmber").value;
  let letrehozta = myUser.teljesnev;
  if (!date || !time) {
    alert("🦊 Állíts be helyes dátumot és időt!");
    return;
  }
  // Az adatbázis ISO-formátumot vár –» konvertáljuk
  let parts = date.split(".");
  let isoDate = parts[0] + "-" + parts[1] + "-" + parts[2]; // YYYY-MM-DD formátum
  let selectedDateTime = new Date(`${isoDate}T${time}`);
  //console.log("ISO formátumban:", selectedDateTime);
  let now = new Date();
  // Ellenőrizzük, hogy elmúlt-e már a beállított dátum?
  if (selectedDateTime < now) {
    let confirmPast = confirm("🐷 A beállított dátum már elmúlt. Biztosan így akarod?");
    if (!confirmPast) return;
  }
  closeModal();
  await showLoadingIndicator();
  let response = await fetch('/api/createMed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, dateTime: selectedDateTime.toISOString(), letrehozta, maxEmber })
  });
  let result = await response.json();
  if (result.success) {
    let newMedId = result.medId; // odagörgetünk
    await fetchMedDataArray(); // frissítjük a myMed array-t
    await updateEventSection(); // frissítjük a meditációs lista kijelzését
    //await updateMedDetails(newMedId); // kinyitjuk a med részletek mutatását
    let newMedElement = document.querySelector(`[data-med-id="${newMedId}"]`);
    if (newMedElement) {
      newMedElement.scrollIntoView({ behavior: "smooth" });
      //toggleMedDetails(newMedElement, result.medData);
    }
  } else {
    alert("saveNewMed – Hiba történt a meditáció létrehozása közben.");
  }
}
window.saveNewIdopont = saveNewIdopont;  // függvény elérhetővé tétele az ablakban


// Megnyitja a billingo számlázót új ablakban és rákeres a nevére
// közben Clipboard-ra kerül a számlacím is
export async function openBillingo(szamlanev, szamlacim) {
  // URL-ben használható formátum (pl. "Kovács Eszter" → "Kovács+Eszter")
  const encodedName = encodeURIComponent(szamlanev).replace(/%20/g, '+');
  // Link összeállítása
  const billingoUrl = `https://app.billingo.hu/document/v3/list?limit=25&q=${encodedName}&direction=&sort_by=&payment_statuses=&payment_methods=&types=&partner_id=&block_id=&is_electronic=&document_date=invoice_date&start_date=&end_date=&tab=all&page=1`;
  // Számlacím másolása a vágólapra
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(szamlacim).catch(err => {
      console.error('Nem sikerült a vágólapra másolás:', err);
    });
  } else {
    // Biztonságos kontextus hiányában fallback megoldás
    const tempInput = document.createElement('textarea');
    tempInput.value = szamlacim;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('openBillingo – Nem sikerült clipboardba másolni a számlacímet.', err);
    }
    document.body.removeChild(tempInput);
  }
  // Új ablak megnyitása billingo
  //console.log(billingoUrl);
  window.open(billingoUrl, '_blank');
}
window.openBillingo = openBillingo;  // függvény elérhetővé tétele az ablakban


// Elment egy új bejegyzést a firestore user history-ba
export async function saveUserHistory(action) {
  const userId = myUser.userId;
  try {
    const result = await fetch('/api/saveUserHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await result.json();
    if (!data.success) {
      //console.error('saveUserHistory – Sikertelen mentés!', data.message);
    } else {
      //console.log('saveUserHistory – Mentés sikeres!');
    }
  } catch (error) {
    console.error('saveUserHistory – Hiba a mentés közben:', error);
  }
}


// User history mutatása egy popup ablakban
export async function showUserHistory(userId) {
  try {
    const result = await fetch('/api/getUserHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await result.json();
    if (!data.success) {
      console.error("Nem sikerült lekérni a history-t:", data.message);
      return;
    }
    const historyList = data.history; // history érkezik egy tömbben –» historyList[]
    // Popup létrehozása
    let modalContainer = document.createElement("div");
    modalContainer.classList.add("history-modal-container");
    let modalContent = document.createElement("div");
    modalContent.classList.add("history-modal-content");
    modalContent.style.maxHeight = "90vh";
    // Tömböt beletesszük
    let historyItemsHTML = historyList.map(item => `
      <div class="history-row">
        <span class="history-date">${item.date}</span>
        <span class="history-action">${item.action}</span>
      </div>
    `).join("");
    // Fejléc és OK gomb
    modalContent.innerHTML = `
      <button class="history-close-btn">✖</button>
      <h2>📜 User History 📜</h2>
      <div class="history-scroll">
        ${historyItemsHTML}
      </div>
      <button class="history-ok-button">✅ OK</button>
    `;
    // összerakjuk
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);
    // popup bezárások kezelése
    function closeModal() {
      document.body.removeChild(modalContainer);
    }
    modalContent.querySelector(".history-close-btn").addEventListener("click", closeModal);
    modalContent.querySelector(".history-ok-button").addEventListener("click", closeModal);
    modalContainer.addEventListener("click", (event) => {
      if (event.target === modalContainer) closeModal();
    });
  } catch (error) {
    console.error("showUserHistory – Hiba a history popup megnyitása közben:", error);
  }
}
window.showUserHistory = showUserHistory;

