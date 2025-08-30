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
//import { fetchMedDataArray, updateEventSection, toggleShowTorolt, toggleShowElmult, toggleMedDetails, loadJelentkezokList, addNewJelentkezo, sendNewJelentkezo, markAttendance, deleteJelentkezo, reactivateJelentkezo, showNewMedForm, closeModal, saveNewMed, editMedField, saveMedField, saveNewMedData, showEditMedDateForm, saveMedDate, showJelenletiIv, closeJelenletiIv, showMedSection} from './app2-med.js';
import { fetchUsersDataArray, updateUsersSection, showNewIdopontForm, saveNewIdopont, openBillingo, saveUserHistory, showUserHistory } from './app3-users.js';
import { initPush } from './app4-pushnotif.js';
import { initCalendar } from './app5-calendar.js';

// lekéri a meditációs listát az adatbázisból –» myMed array
// (jelentkezők névsorát nem hozza át)
export async function fetchMedDataArray() {
    // meditációk adatlekérés a szervertől
  try {
    const response = await fetch('/api/getMedData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ }),  // összes lekérése
    });
    const result = await response.json();
    //console.log(result.message, result.userId);
    if (response.ok) {
      myMed.length = 0; // Kiürítjük a tömböt!
      myMed.push(...result.data); // Új adatokat töltünk be!
      //Object.assign(myMed, result.data);
      //console.log(result.message, myMed);
    } else {
      console.log(result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error('fetchMedDataArray – Hiba az api hívás során:', error.message);
  }  
}


// Megjeleníti a meditációk listáját a szervezéshez
export async function updateEventSection(refresh = false) {
  // Töröljük a korábbi tartalmat
  await hideAllSections();
  let newBox = document.createElement("div");
  newBox.classList.add("med-content-box"); // Meditációs lista konténer
  newBox.innerHTML = `
    <h2>Meditációk szervezése</h2>
    
    <div class="filter-options">
    <a role="button" id="create-med-btn" onclick="showNewMedForm()">✏️ <span>Új meditáció</span></a>
      <label class="switch">
        <input type="checkbox" id="toggleShowTorolt" ${myUser.show_torolt ? "checked" : ""} onclick="toggleShowTorolt()">
        <span class="slider round"></span>
      </label>
      <span> Törölt</span>

      <label class="switch">
        <input type="checkbox" id="toggleShowElmult_szervezes" ${myUser.show_elmult ? "checked" : ""} onclick="toggleShowElmult('szervezes')">
        <span class="slider round"></span>
      </label>
      <span> Elmúlt</span>
    </div>
  `;
  // mutatni kívánt med lista létrehozása filter-rel
  let filteredMeds = myMed.filter(med => {
    let isDeleted = med.state === "torolt"; // isDeleted=true, ha torolt meditációról van szó
    let isPast = new Date(med.date) < new Date(); // isPast=true, ha elmúlt meditációról van szó
    // első zárójel: TRUE = ha nem törölt med VAGY mutatjuk a törölteket
    // második zárójel: TRUE = ha nem múlt még el a med VAGY mutatjuk
    // együttesen: TRUE = ha egyszerre true mind a két zárójel, azaz ha a törlés szempontjából is mutatni való és az elmúlás szempontjából is mutatni való
    // ekkor bekerül a filteredMeds listába!
    return (!isDeleted || myUser.show_torolt) && (!isPast || myUser.show_elmult);
  });
  filteredMeds = filteredMeds.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (filteredMeds.length === 0) {
    newBox.innerHTML += `<p>Nincs elérhető meditáció.</p>`;
  } else {
    filteredMeds.forEach((med) => {
      let medDiv = document.createElement("div");
      medDiv.classList.add("med-row");
      medDiv.dataset.medId = med.medId; // Meditáció ID tárolása attribútumban
      medDiv.style.backgroundColor = colorStateMapping[med.state] || "#ffffff"; // Színkódolás
      // Formázott dátum és időpont
      let dateObj = new Date(med.date);
      let formattedDate = new Intl.DateTimeFormat("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
      // Meditáció státusza
      let statusText = stateMapping[med.state] || "Ismeretlen állapot";
      // Alap HTML szerkezet
      medDiv.innerHTML = `
        <div class="med-header">
          <div class="med-title" title="${med.cim}">${med.cim}</div>
          <div class="med-date">${formattedDate} – ${statusText}</div>
          <div class="med-participants">
            ${med.jelentkezett} / ${med.maxEmber} jelentkező, várólista: ${med.varolistan || 0} fő
          </div>
        </div>
        <div class="med-detail" style="display: none;"></div> <!-- Ide kerülnek majd a med részletek -->
      `;
      // Kattintás esemény hozzáadása
      medDiv.addEventListener("click", () => toggleMedDetails(medDiv, med));
      newBox.appendChild(medDiv);
    });
  }
  // Hozzáadjuk az új tartalmat
  const targetSection = document.getElementById("med-event-section");
  targetSection.innerHTML = ''; // korábbi tartalom törlése
  targetSection.appendChild(newBox);
  if (refresh) { targetSection.classList.add('visible'); }
}


// Törölt meditációk mutatása switch on/off
export async function toggleShowTorolt() {
  let newValue = document.getElementById("toggleShowTorolt").checked;
  myUser.show_torolt = newValue;
  await saveNewUserData("show_torolt", newValue);
  await updateEventSection(true); // Frissítjük a listát
}
window.toggleShowTorolt = toggleShowTorolt;  // függvény elérhetővé tétele az ablakban


// Elmúlt meditációk mutatása switch on/off
export async function toggleShowElmult(window) {
  //await showLoadingIndicator();
  let newValue;
  newValue = window === "jelentkezes" ? document.getElementById("toggleShowElmult_jelentkezes").checked : document.getElementById("toggleShowElmult_szervezes").checked;
  myUser.show_elmult = newValue;
  await saveNewUserData("show_elmult", newValue);
  if (window == "szervezes") {
    await updateEventSection(true); // Frissítjük a listát
  } else if (window == "jelentkezes") {
    await showMedSection(true); // Frissítjük a listát
  }
}
window.toggleShowElmult = toggleShowElmult;  // függvény elérhetővé tétele az ablakban


// Kattintásra: meditáció részleteinek megjelenítése / visszacsukása
export async function toggleMedDetails(medDiv, med, refresh = false) {
  let detailDiv = medDiv.querySelector(".med-detail");
  let isOpen = detailDiv.style.display === "block";
  if (isOpen && !refresh) {
    // Ha már nyitva van, csukjuk össze
    detailDiv.style.display = "none";
    medDiv.classList.remove("expanded");
    detailDiv.innerHTML = ""; // tartalom törlése bezáráskor
  } else {
    // Ha zárva van, vagy refresh = true, akkor töltsük be az adatokat és nyissuk ki
    // Ha volt előzőleg másik nyitott elem, azt csukjuk össze
    if (lastOpenedMedDiv && lastOpenedMedDiv !== medDiv) {
      let prevDetailDiv = lastOpenedMedDiv.querySelector(".med-detail");
      if (prevDetailDiv) {
        prevDetailDiv.style.display = "none";
        lastOpenedMedDiv.classList.remove("expanded");
      }
    }
    // Frissítjük (elmentjük) a legutóbb lenyitott elemet –» lastOpenedMedDiv
    await setLastOpenedMedDiv(medDiv);
    // Lenyitott tartalom létrehozása
    let createdDate = new Date(med.letrehozta_date).toLocaleString("hu-HU");
    let modifiedDate = med.modositotta_date ? new Date(med.modositotta_date).toLocaleString("hu-HU") : "-";
    detailDiv.innerHTML = ""; // Régi tartalom törlése, majd új tartalom
    detailDiv.innerHTML = `
      <div class="med-data-row">
        <h3><b>Cím</b></h3>
        <div class="data-content" id="cim-container">
          <p id="cim-value">${med.cim}</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('cim', 'text', '${med.cim}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Állapot</b></h3>
        <div class="data-content" id="state-container">
          <p id="state-value">${stateMapping[med.state] || "??"}</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('state', 'select', '${med.state}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Dátum</b></h3>
        <div class="data-content" id="date-container">
          <p id="date-value">${new Intl.DateTimeFormat("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date(med.date))}</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('date', 'datetime-local', '${med.date}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Max</b></h3>
        <div class="data-content" id="maxEmber-container">
          <p>${med.maxEmber} fő</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('maxEmber', 'number', '${med.maxEmber}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Teaser</b></h3>
        <div class="data-content" id="teaser-container">
          <p id="teaser-value">${med.teaser}</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('teaser', 'text', '${med.teaser}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Üzenet</b></h3>
        <div class="data-content" id="message-container">
          <p id="message-value">${med.message}</p>
          <a role="button" onclick="event.stopPropagation(); editMedField('message', 'text', '${med.message}', '${med.medId}')">✏️</a>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Létrehozta</b></h3>
        <div class="data-content" id="createdDate-container">
          <p>${med.letrehozta} ${createdDate}</p>
        </div>
      </div>

      <div class="med-data-row">
        <h3><b>Módosította</b></h3>
        <div class="data-content" id="modifiedDate-container">
          <p>${med.modositotta} ${modifiedDate}</p>
        </div>
      </div>
      
      <div class="med-data-row">
        <h3><b>Meditáció</b></h3>
        <div class="data-content" id="delete-container">
          <p id="message-value"></p>
          <a role="button" onclick="event.stopPropagation(); deleteMed('${med.medId}')">❌ <span>törlése</span></a>
          ${med.state === "torolt" ? `<a role="button" onclick="event.stopPropagation(); recoverMed('${med.medId}')">♻️ <span>visszaállítás</span></a>` : ""}
        </div>
      </div>
    `;
    // div lenyitása és mutatása
    detailDiv.style.display = "block";
    medDiv.classList.add("expanded");
    await loadJelentkezokList(med.medId, detailDiv); // Jelentkezők listájának betöltése
  }
}


// Jelentkezők listájának betöltése
export async function loadJelentkezokList(medId, detailDiv) {
  try {
    let response = await fetch('/api/getMedJelentkezokData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medId })
    });
    let result = await response.json();
    // console.log(result.data);
    if (!result.data || result.data.length === 0) return; // Ha nincs jelentkező, ne csináljunk semmit
    let jelentkezokListHtml = `
      <div class="jelentkezok-header">
        <a role="button" onclick="event.stopPropagation(); addNewJelentkezo('${medId}')">🙋‍♂️ Új jelentkező</a>
        <a role="button" onclick="event.stopPropagation(); showJelenletiIv('${medId}')">📋 Jelenléti ív</a>

      </div>
      <div class="jelentkezok-list">
        ${result.data.map(jel => {
          let deleteIcon = jel.state === "torolt" ? `<a role="button" title="Aktívvá tesz" onclick="event.stopPropagation(); reactivateJelentkezo('${jel.docId}', '${jel.userId}', '${medId}', 'jelentkezett')">🌼</a><a role="button" title="Törlés" onclick="event.stopPropagation(); deleteJelentkezo('${jel.docId}', '${jel.userId}', '${medId}', 0)">❌</a>`
                                                  : `<a role="button" title="Törlés" onclick="event.stopPropagation(); deleteJelentkezo('${jel.docId}', '${jel.userId}', '${medId}', 0)">❌</a>`
          let waitlistIcon = jel.state === "varolistan" ? `<a role="button" title="Aktívvá tesz" onclick="event.stopPropagation(); reactivateJelentkezo('${jel.docId}', '${jel.userId}', '${medId}', 'jelentkezett')">🌼</a>` 
                                                         : `<a role="button" title="Várólistára tesz" onclick="event.stopPropagation(); reactivateJelentkezo('${jel.docId}', '${jel.userId}', '${medId}', 'varolistan')">⏳</a>`;
          return `
          <div class="jelentkezo-row" style="background-color: ${stateMappingMedColor[jel.state]}">
            <div class="jelentkezo-nev">${jel.nev}</div>
            <div class="jelentkezo-state">${stateMappingMed[jel.state]}</div>
            <div class="jelentkezo-response-state">${jel.response_state || '-'}</div>
            <div class="jelentkezo-response">${jel.response_date ? new Date(jel.response_date).toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' }) : '-'}</div>
            <div class="jelentkezo-actions">
              ${deleteIcon}
              ${waitlistIcon}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
    detailDiv.innerHTML += jelentkezokListHtml;
  } catch (error) {
    console.error('loadJelentkezokList – Hiba a jelentkezők lekérése során:', error);
  }
}


// Kijelzett meditációs sor frissítése
export async function updateMedRow(medId) {
  medId = Number(medId); // számmá alakítjuk, ha string-ként jönne be a genya
  let med = myMed.find(med => med.medId === medId); // Kivesszük a myMed tömbből az aktuálisan frissítendő objektumot
  let medDiv = document.querySelector(`.med-row[data-med-id='${medId}']`); // megkeressük a medObj korábban kijelzett sorát
  medDiv.style.backgroundColor = colorStateMapping[med.state] || "#ffffff"; // Színkódolás
  // Formázott dátum és időpont
  let dateObj = new Date(med.date);
  let formattedDate = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
  // Meditáció státusza
  let statusText = stateMapping[med.state] || "Ismeretlen állapot";
  // Alap HTML szerkezet
  medDiv.innerHTML = `
    <div class="med-header">
      <div class="med-title" title="${med.cim}">${med.cim}</div>
      <div class="med-date">${formattedDate} – ${statusText}</div>
      <div class="med-participants">
        ${med.jelentkezett} / ${med.maxEmber} jelentkező, várólista: ${med.varolistan || 0} fő
      </div>
    </div>
    <div class="med-detail" style="display: none;"></div> `;
}


// Kijelzett meditációs részletek frissítése
export async function updateMedDetails(medId) {
  medId = Number(medId); // számmá alakítjuk, ha string-ként jönne be a genya
  let med = myMed.find(med => med.medId === medId); // Kivesszük a myMed objektumból az aktuálisan frissítendő objektumot
  let medDiv = document.querySelector(`.med-row[data-med-id='${medId}']`); // megkeressük a medObj korábban kijelzett sorát
  await toggleMedDetails(medDiv, med, true); // nézet frissítése, mintha most nyitnánk meg
}


// Új jelentkező hozzáadása
export async function addNewJelentkezo(medId) {
  try {
    let users = await fetchUsersDataArray(); // user lista lekérése
    if (users === null) { return; } // nincs egy user sem a listában
    // Popup létrehozása
    let popup = document.createElement("div");
    popup.classList.add("popup-overlay");
    let popupContent = document.createElement("div");
    popupContent.classList.add("popup-content");
    let closeButton = document.createElement("span");
    closeButton.classList.add("close-button");
    closeButton.innerHTML = "&times;";
    closeButton.onclick = () => closePopup(null); // Ha bezárjuk az ablakot, ne küldjön semmit
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
    // user-ek keresése (szűrése)
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
      userRow.dataset.userId = user.userId;
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
      
      //userRow.innerText = user.teljesnev;
      //userRow.title = user.email; // tooltip: e-mail
      userRow.onclick = () => {
        // Először töröljük az összes felhasználót a listából
        userList.innerHTML = "";
        // Keresőmező hide
        searchContainer.style.display = "none";
        // Kiválasztott név megjelenítése
        let selectedUserRow = document.createElement("div");
        selectedUserRow.classList.add("selected-user");
        // Belső mezők: név, email, telefon
        let selectedNameCol = document.createElement("div");
        selectedNameCol.classList.add("user-col", "user-name");
        selectedNameCol.innerText = user.vezeteknev + " " + user.keresztnev;
        let selectedEmailCol = document.createElement("div");
        selectedEmailCol.classList.add("user-col", "user-email");
        selectedEmailCol.innerText = user.email;
        let selectedTelCol = document.createElement("div");
        selectedTelCol.classList.add("user-col", "user-phone");
        selectedTelCol.innerText = user.telefon;
        selectedUserRow.appendChild(selectedNameCol);
        selectedUserRow.appendChild(selectedEmailCol);
        selectedUserRow.appendChild(selectedTelCol);
        
        // Ikonok létrehozása
        let normalIcon = document.createElement("span");
        normalIcon.classList.add("icon", "normal-signup");
        normalIcon.innerHTML = "🌼 Jelentkezés"; // Sárga virág emoji
        normalIcon.title = "Normál jelentkezés";
        normalIcon.onclick = () => closePopup(user.userId, 'jelentkezett');
        let waitlistIcon = document.createElement("span");
        waitlistIcon.classList.add("icon", "waitlist-signup");
        waitlistIcon.innerHTML = "⏳ Várólista"; // Homokóra emoji
        waitlistIcon.title = "Várólistára tesz";
        waitlistIcon.onclick = () => closePopup(user.userId, 'varolistan');
        // Ikonok (gombok) hozzáadása a popup tartalmához
        let iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        iconContainer.appendChild(normalIcon);
        iconContainer.appendChild(waitlistIcon);
        // Frissített tartalom hozzáadása
        userList.appendChild(selectedUserRow);
        userList.appendChild(iconContainer);
      };

      userList.appendChild(userRow);
    });
    popupContent.appendChild(closeButton);
    popupContent.appendChild(searchContainer);
    popupContent.appendChild(userList);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);
    setTimeout(() => searchInput.focus(), 0); // Focus a keresőmezőre a popup megnyitásakor

    // Ha az ablakon kívül kattintunk, akkor bezáródik és nem választ ki senkit
    popup.onclick = (event) => {
      if (event.target === popup) closePopup(null);
    };
    // popup bezárásának kezelése
    async function closePopup(selectedUserId, requestType) {
      document.body.removeChild(popup);
      if (selectedUserId) {
        await sendNewJelentkezo(medId, selectedUserId, requestType);
        await updateMedRow(medId); // meditációs sor frissítése
        await updateMedDetails(medId); // nézet frissítése
      }
    }
  } catch (error) {
    console.error("addNewJelentkezo – Hiba a felhasználók lekérése során:", error);
  }
}
window.addNewJelentkezo = addNewJelentkezo;  // függvény elérhetővé tétele az ablakban


// A kiválasztott jelentkező hozzáadása az API-n keresztül
export async function sendNewJelentkezo(medId, userId, requestType) {
  medId = Number(medId); // számmá alakítjuk, mert van, hogy string-ként érkezik
  userId = Number(userId);
  try {
    let response = await fetch('/api/addMedJelentkezo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medId, userId, requestType })
    });
    let result = await response.json();
    if (result.success) {
      alert(result.message);
      await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
    } else {
      console.error("sendNewJelentkezo – Hiba a jelentkező hozzáadásakor");
      alert("🦆 Hiba történt a jelentkező hozzáadásakor.");
    }
  } catch (error) {
    console.error("sendNewJelentkezo – Hiba a jelentkező hozzáadásakor:", error);
  }
}


// Jelenlét pipa be / ki
export async function markAttendance(docId, userId, medId) {
  console.log(`Jelenléti ív: jelenlét váltása: ${userId}`);
  let response = await fetch('/api/toggleAttendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, medId, userId })
  });
  let result = await response.json();
  if (!result.success) {
    alert(result.message);
  } else {
    await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
    await updateMedRow(medId); // meditációs sor frissítése
    await updateMedDetails(medId); // nézet frissítése
  }
}
/*
let pipaIcon = jel.jelen === true ? `<a role="button" title="Nincs jelen" onclick="event.stopPropagation(); markAttendance('${jel.docId}', '${jel.userId}', '${medId}')">✅</a>`
                                                  : `<a role="button" title="Jelen van" onclick="event.stopPropagation(); markAttendance('${jel.docId}', '${jel.userId}', '${medId}')">☑️</a>`
              ${pipaIcon}
*/
window.markAttendance = markAttendance;  // függvény elérhetővé tétele az ablakban


// Jelentkező törlése (lemondás) / végleges törlése (visszakérdezés nélkül)
// docId=adatbázis jelentkezés azonosítója; window=0 ha a szervezésben vagyunk; window=1 ha a meditációk nézetben vagyunk
export async function deleteJelentkezo(docId, userId, medId, window) {
  event.stopPropagation();  //ne csukódjon össze a med div
  let isAdmin = myUser.admin;
  if (docId == 0) { // ha még nem jelentkezett korábban, de eleve lemondja
    await medJelentkezesGomb(medId, userId, 'torolt');
    return;
  }
  let response = await fetch('/api/deleteMedJelentkezo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, medId, userId, isAdmin })
  });
  let result = await response.json();
  if (!result.success) {
    alert(result.message);
  } else {
    alert("🐠 Rendben, töröltem a korábbi jelentkezést!");
    await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
    if (window == 0) {
      await updateMedRow(medId); // meditációs sor frissítése
      await updateMedDetails(medId); // nézet frissítése
    } else if (window == 1) {
      await updateShowMedRowAndDetails(medId); // adott meditációs sor frissítése && részletek nézet frissítése
      await saveUserHistory("meditáció lemondása " + String(medId));
    }
  }
}
window.deleteJelentkezo = deleteJelentkezo;  // függvény elérhetővé tétele az ablakban


// Jelentkező újra aktiválása –» újra jelentkezett-re állítjuk (ha van még szabad hely), vagy pedig várólistára tesszük (ha nincs hely, vagy azt kérte)
export async function reactivateJelentkezo(docId, userId, medId, requestType) {
  console.log('reactivateJelentkezo', docId, userId, medId, requestType);
  let response = await fetch('/api/reactivateMedJelentkezo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, medId, userId, requestType })
  });
  let result = await response.json();
  if (!result.success) {
    alert(result.message);
  } else {
    alert(result.message);
    await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
    await updateMedRow(medId); // meditációs sor frissítése
    await updateMedDetails(medId); // nézet frissítése
  }
}
window.reactivateJelentkezo = reactivateJelentkezo;  // függvény elérhetővé tétele az ablakban


// Meditáció törlése / végleges törlése
export async function deleteMed(medId) {
  medId = Number(medId); // legyen szám, ha esetleg string-ként jön be
  //console.log(`Meditáció törlése: ${medId}`);
  // Ellenőrizzük, hogy van-e aktív jelentkező és rákérdezünk, ha igen
  let med = myMed.find(med => med.medId === medId); // Kivesszük a myMed objektumból a med-et
  if (med.state == 'torolt') { if (!confirm('🐙 Meditáció végleges törlése! Ez már nem visszaállítható. Biztosan folytatod?')) return; }
  if (med.jelentkezett > 0 || med.varolistan > 0) { if (!confirm('🦊 A jelentkezők listája vagy a várólista nem üres! Gondolj rá, hogy még a törlés előtt a korábbi jelentkezők kapjanak értesítést! Biztosan törlöd a meditációt?')) return; }
  let userId = myUser.userId; // aki törli a meditációt
  await fetch('/api/deleteMed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medId, userId })
  });
  //console.log(`Meditáció sikeresen törölve`);
  await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
  await updateEventSection(true); // Újratöltjük a meditációk listáját
}
window.deleteMed = deleteMed;  // függvény elérhetővé tétele az ablakban


// Törölt meditáció visszaállítása
export async function recoverMed(medId) {
  medId = Number(medId); // legyen szám, ha esetleg string-ként jön be
  //console.log(`Meditáció visszaállítása: ${medId}`);
  let userId = myUser.userId; // aki visszaállítja a meditációt
  await fetch('/api/recoverMed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medId, userId })
  });
  //console.log(`Meditáció sikeresen visszaállítva`);
  await fetchMedDataArray(); // Frissítjük a myMed tömböt az adatbázisból
  await updateEventSection(true); // Újratöltjük a meditációk listáját
}
window.recoverMed = recoverMed;  // függvény elérhetővé tétele az ablakban


// Új meditáció létrehozása popup
export async function showNewMedForm() {
  let modalContainer = document.createElement("div");
  modalContainer.classList.add("modal-container");

  let modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  modalContent.innerHTML = `
    <span class="close-btn" onclick="closeModal()">✖</span>
    <h2>Új meditáció létrehozása</h2>
    
    <div class="med-form">
      <label for="newMedTitle"><b>Cím</b></label>
      <input type="text" id="newMedTitle" placeholder="(Opcionális)">

      <label for="newMedDate"><b>Dátum</b></label>
      <input type="text" id="newMedDate">

      <label for="newMedTime"><b>Idő</b></label>
      <input type="time" id="newMedTime" value="18:00">
      
      <label for="newMaxEmber"><b>MaxEmber</b></label>
      <input type="number" id="newMaxEmber" value=14>

      <button onclick="saveNewMed()">✅ Mentés</button>
    </div>
  `;
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);
  // Dátum picker init
  flatpickr("#newMedDate", {
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

  document.getElementById("newMedDate").value = formattedDate;
  modalContainer.addEventListener("click", (event) => { if (event.target === modalContainer) { closeModal(); } });
}
window.showNewMedForm = showNewMedForm;  // függvény elérhetővé tétele az ablakban

// Modal bezárása X gombbal és háttérre kattintással
export async function closeModal() {
  document.querySelector(".modal-container").remove();
}
window.closeModal = closeModal;


// Új meditáció elmentése a mentés gombra kattintáskor
export async function saveNewMed() {
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
    await updateEventSection(true); // frissítjük a meditációs lista kijelzését
    await updateMedDetails(newMedId); // kinyitjuk a med részletek mutatását
    let newMedElement = document.querySelector(`[data-med-id="${newMedId}"]`);
    if (newMedElement) {
      newMedElement.scrollIntoView({ behavior: "smooth" });
      //toggleMedDetails(newMedElement, result.medData);
    }
  } else {
    alert("saveNewMed – Hiba történt a meditáció létrehozása közben.");
  }
}
window.saveNewMed = saveNewMed;  // függvény elérhetővé tétele az ablakban


// szerkeszthetőre váltja a med adatmezőt
export async function editMedField(fieldName, fieldType, currentValue, medId) {
  medId = Number(medId);
  //console.log('editMedField...', fieldName, fieldType, currentValue, medId);
  let fieldContainer = lastOpenedMedDiv.querySelector(`#${fieldName}-container`);
  if (fieldName == "cim" || fieldName == "teaser" || fieldName == "message" || fieldName == "maxEmber") {
    //console.log(fieldContainer);
    // Lecseréljük a szöveget egy input mezőre
    fieldContainer.innerHTML = `
        <input type="${fieldType}" id="${fieldName}-input" value="${currentValue}" class="edit-input" onclick="event.stopPropagation();">
        <a role="button" class="save-link" onclick="event.stopPropagation(); saveMedField('${fieldName}', '${fieldType}', '${currentValue}', '${medId}')">✅ <span>Mentés</span></a>
    `;
  } else if (fieldName == "state") {
    // Lecseréljük a szöveget egy combo list-re
    let optionsHtml = Object.entries(stateMapping)
      .map(([key, value]) => `<option value="${key}" ${key === currentValue ? "selected" : ""}>${value}</option>`)
      .join("");
    fieldContainer.innerHTML = `
        <select id="${fieldName}-input" class="edit-input" onclick="event.stopPropagation();">
          ${optionsHtml}
        </select>
        <a role="button" class="save-link" onclick="event.stopPropagation(); saveMedField('${fieldName}', '${fieldType}', '${currentValue}', '${medId}')">✅ <span>Mentés</span></a>
    `;
  } else if (fieldName == "date") {
    // isostring dátum szétszedése
    let dateObj = new Date(currentValue);
    // Kinyerjük a dátumot YYYY.MM.DD formátumban
    let currentDate = dateObj.getFullYear() + "." + 
                      ("0" + (dateObj.getMonth() + 1)).slice(-2) + "." + 
                      ("0" + dateObj.getDate()).slice(-2);
    // Kinyerjük az időt HH:MM formátumban
    let currentTime = ("0" + dateObj.getHours()).slice(-2) + ":" + 
                      ("0" + dateObj.getMinutes()).slice(-2);
    //console.log("Átalakított dátum:", currentDate, "Idő:", currentTime);
    await showEditMedDateForm(medId, currentDate, currentTime); // popup az új dátum és idő megadásához
  }
  
}
window.editMedField = editMedField;  // függvény elérhetővé tétele az ablakban


// Meditációs mező szerkesztése: Mentés
export async function saveMedField(fieldName, fieldType, currentValue, medId) {
  medId = Number(medId);
  //console.log('saveMedField...', fieldName, fieldType, medId);
  let newValue = document.getElementById(fieldName + "-input").value;
  let fieldContainer = lastOpenedMedDiv.querySelector(`#${fieldName}-container`);
  //console.log('Új érték beállítása: ', newValue);
  if (fieldName == "cim" || fieldName == "teaser" || fieldName == "message" || fieldName == "maxEmber") {
    if (fieldName == "maxEmber") newValue = Number(newValue); // ha maxEmber, akkor szám legyen
    let mentesSikeres = await saveNewMedData(fieldName, newValue, medId);  // firestore frissítése
    if (!mentesSikeres) newValue = currentValue; // sikertelen mentés? –» érték visszaállítása
    if (fieldName == "maxEmber") newValue = Number(newValue); // ha maxEmber, akkor szám legyen
  } else if (fieldName == "state") {
    let mentesSikeres = await saveNewMedData(fieldName, newValue, medId);  // firestore frissítése
    if (!mentesSikeres) newValue = currentValue; // sikertelen mentés? –» érték visszaállítása
    newValue = stateMapping[newValue]; // stateMapping-ből kiolvassuk a szép kiírást
  }
  await fetchMedDataArray(); // frissítjük a myMed array-t
  await updateMedRow(medId); // frissítjük a meditációs sor kijelzését
  await updateMedDetails(medId); // kinyitjuk a med részletek mutatását
  let medElement = document.querySelector(`[data-med-id="${medId}"]`); //listában odaugrunk
  if (medElement) { medElement.scrollIntoView({ behavior: "smooth" }); }
}
window.saveMedField = saveMedField;  // függvény elérhetővé tétele az ablakban


// Új Med értékek mentése Firestore-ba –» szerver hívás
export async function saveNewMedData(key, newValue, medId) {
  medId = Number(medId);
  const userId = myUser.userId;
  //console.log('saveNewMedData...',medId, key, newValue, userId);
  try {
    const response = await fetch('/api/saveMedData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medId, key, newValue, userId }),
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
    console.error('saveNewMedData – Hiba a meditáció adatmentés során:', error.message);
    return false;
  }
}


// Dátum és idő módosítás popup
export async function showEditMedDateForm(medId, currentDate, currentTime) {
  let modalContainer = document.createElement("div");
  modalContainer.classList.add("modal-container");
  let modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  modalContent.innerHTML = `
    <span class="close-btn" onclick="closeModal()">✖</span>
    <h2>Meditáció időpontja</h2>
    <div class="med-form">
      <label for="editMedDate"><b>Dátum</b></label>
      <input type="text" id="editMedDate">
      <label for="editMedTime"><b>Idő</b></label>
      <input type="time" id="editMedTime" value="${currentTime}">
      <button onclick="saveMedDate('${medId}')">✅ Mentés</button>
    </div>
  `;
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);
  // Alapértelmezett dátum beállítása
  document.getElementById("editMedDate").value = currentDate;
  // Flatpickr dátumválasztó inicializálása
  flatpickr("#editMedDate", {
    dateFormat: "Y.m.d",
    static: true,
    disableMobile: true
  });
  modalContainer.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
      closeModal();
    }
  });
}
window.showEditMedDateForm = showEditMedDateForm;


// Dátum és idő módosítás popup – dátum mentés
export async function saveMedDate(medId) {
  medId = Number(medId);
  let date = document.getElementById("editMedDate").value;
  let time = document.getElementById("editMedTime").value;
  // Az adatbázis ISO-formátumot vár –» konvertáljuk
  let parts = date.split(".");
  let isoDate = parts[0] + "-" + parts[1] + "-" + parts[2]; // YYYY-MM-DD formátum
  let newDateTime = new Date(`${isoDate}T${time}`);
  //console.log("ISO formátumban:", selectedDateTime);
  let now = new Date();
  // Ellenőrizzük, hogy elmúlt-e már a beállított dátum?
  if (newDateTime < now) {
    let confirmPast = confirm("🐷 A beállított dátum már elmúlt. Biztosan így akarod?");
    if (!confirmPast) return;
  }
  closeModal();
  await saveNewMedData("date", newDateTime, medId); // Firestore frissítés
  await fetchMedDataArray(); // frissítjük a myMed array-t
  await updateEventSection(true); // frissítjük a meditációs lista kijelzését
  await updateMedDetails(medId); // kinyitjuk a med részletek mutatását
  let medElement = document.querySelector(`[data-med-id="${medId}"]`);
  if (medElement) { medElement.scrollIntoView({ behavior: "smooth" }); }
}
window.saveMedDate = saveMedDate;


// Jelenléti ív mutatása
export async function showJelenletiIv(medId) {
  medId = Number(medId);
  try {
    let existingPopup = document.getElementById("jelenletiIvPopup");
    if (existingPopup) { existingPopup.remove(); } // Ha már létezik a popup, előbb töröljük
    let popup = document.createElement("div"); // Új popup container létrehozása
    popup.id = "jelenletiIvPopup";
    popup.classList.add("popup-overlay");
    popup.innerHTML = `
      <div class="popup-content">
        <span class="popup-close" onclick="closeJelenletiIv()">&times;</span>
        <h2>Jelenléti ív</h2>
        <div id="jelentkezokList">Betöltés...</div>
        <button class="popup-btn" onclick="closeJelenletiIv()">Bezárás</button>
      </div>
    `;
    document.body.appendChild(popup);
    popup.style.display = "flex"; // Popup megjelenítése
    let jelentkezokList = document.getElementById("jelentkezokList");
    jelentkezokList.innerHTML = "";
    // API hívás a jelentkezők lekérésére
    let response = await fetch("/api/getMedJelentkezokData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medId }),
    });

    let result = await response.json();
    if (!result.data || result.data.length === 0) {
      jelentkezokList.innerHTML = "<p>Nincsenek jelentkezők.</p>";
      return;
    }
    let dbJelentkezo = 0;
    // Jelentkezők listájának dinamikus generálása
    result.data.forEach((jel) => {
      let jelentkezo = document.createElement("div");
      jelentkezo.classList.add("jelentkezo-row-jelenletiiv");
      jelentkezo.style.backgroundColor = jel.jelen ? stateMappingMedColor.jelen : stateMappingMedColor[jel.state];
      jelentkezo.innerText = jel.nev;
      jelentkezo.dataset.jelId = jel.docId;
      jelentkezo.dataset.jelen = jel.jelen; // Tárolja az aktuális állapotot

      // Kattintásra módosítja az állapotot
      jelentkezo.addEventListener("click", async function () {
        let jelenStatus = this.dataset.jelen === "true"; // true → false vagy fordítva
        let newStatus = !jelenStatus;
        this.dataset.jelen = newStatus;
        this.style.backgroundColor = newStatus ? stateMappingMedColor.jelen : stateMappingMedColor[jel.state];
        // Frissítés Firestore-ban
        try {
          await fetch("/api/updateJelenStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ docId: jel.docId, medId, jelen: newStatus }),
          });
        } catch (error) {
          console.error("Hiba a jelen státusz frissítésekor:", error);
        }
      });
      jelentkezokList.appendChild(jelentkezo);
      dbJelentkezo = dbJelentkezo + 1;
    });
    let darabszam = document.createElement("div");
    darabszam.classList.add("jelentkezo-row-jelenletiiv");
    darabszam.innerText = "Összesen " + dbJelentkezo + " fő";
    jelentkezokList.appendChild(darabszam);
  } catch (error) {
    console.error("showJelenletiIv – Hiba:", error);
  }
}
window.showJelenletiIv = showJelenletiIv;


// Popup bezárása
export async function closeJelenletiIv() {
  let popup = document.getElementById("jelenletiIvPopup");
  if (popup) {
    popup.remove();
  }
}
window.closeJelenletiIv = closeJelenletiIv;


// Megjeleníti a meditációk listáját leírásokkal a jelentkezéshez
export async function showMedSection(refresh = false) {
  // Töröljük a korábbi tartalmat
  await hideAllSections();
  // Új tartalom létrehozása
  let newBox = document.createElement("div");
  newBox.classList.add("med-content-box"); // Meditációs lista konténer
  newBox.innerHTML = `
    <h2>Meditációk</h2>
    
    <div class="filter-options">
      <label class="switch">
        <input type="checkbox" id="toggleShowElmult_jelentkezes" ${myUser.show_elmult ? "checked" : ""} onclick="toggleShowElmult('jelentkezes')">
        <span class="slider round"></span>
      </label>
      <span> Korábbiak mutatása</span>
    </div>
  `;
  // mutatni kívánt med lista létrehozása filter-rel
  let filteredMeds = myMed.filter(med => {
    let isDeleted = med.state === "torolt"; // isDeleted=true, ha torolt meditációról van szó
    let isPast = new Date(med.date) < new Date(); // isPast=true, ha elmúlt meditációról van szó
    // első zárójel: TRUE = ha nem törölt med
    // második zárójel: TRUE = ha nem múlt még el a med VAGY mutatjuk a törölteket
    // együttesen: TRUE = ha egyszerre true mind a két zárójel, azaz ha a törlés szempontjából is mutatni való és az elmúlás szempontjából is mutatni való
    // ekkor return –» bekerül a filteredMeds listába!
    return (!isDeleted) && (!isPast || myUser.show_elmult);
  });
  filteredMeds = filteredMeds.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (filteredMeds.length === 0) {
    newBox.innerHTML += `<p>Nincs elérhető meditáció.</p>`;
  } else {
    filteredMeds.forEach((med) => {
      let medDiv = document.createElement("div");
      medDiv.classList.add("med-row");
      medDiv.dataset.medId = med.medId; // Meditáció ID tárolása attribútumban
      medDiv.style.backgroundColor = colorStateMapping[med.state] || "#ffffff"; // Színkódolás
      // Formázott dátum és időpont
      let dateObj = new Date(med.date);
      let formattedDate = new Intl.DateTimeFormat("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
      // Meditáció státusza
      let statusText = stateMappingForUser[med.state] || "Ismeretlen állapot";
      const medEmojis = ['🧘', '🧘‍♂️', '🧘🏻‍♀️', '🧘🏻‍'];
      const randomEmoji = medEmojis[Math.floor(Math.random() * medEmojis.length)];
      const szabadHelyekSzama = med.maxEmber - med.jelentkezett;
      let status;
      if (szabadHelyekSzama > 8) {
        status = 4;
      } else if (szabadHelyekSzama > 5) {
        status = 3;
      } else if (szabadHelyekSzama > 2) {
        status = 2;
      } else if (szabadHelyekSzama > 0) {
        status = 1;
      } else { //betelt!
        status = 0;
      }
      if (med.state == "nyitva") {
      } else {
        status = 9;
      }
      let letszamText = stateMappingForMedLetszam[status] || "";
      // Alap HTML szerkezet
      medDiv.innerHTML = `
        <div class="med-header">
          <div class="med-title" title="${med.cim}">${randomEmoji} ${med.cim}</div>
          <div class="med-date">${formattedDate} – ${statusText}</div>
          <div class="med-participants">${letszamText}</div>
        </div>
        <div class="med-detail" style="display: none;"></div> <!-- Ide kerülnek majd a med részletek -->
      `;
      // Kattintás esemény hozzáadása
      medDiv.addEventListener("click", (event) => {
        if (event.target.closest(".jelentkezes-button")) return;  // Ha a gombra kattintottunk, akkor ne csukódjon vissza
        toggleShowMedDetails(medDiv, med, false, letszamText, med.state);
      });
      newBox.appendChild(medDiv);
    });
  }
  // Hozzáadjuk az új tartalmat
  const targetSection = document.getElementById("meditaciok-section");
  targetSection.innerHTML = ''; // korábbi tartalom törlése
  targetSection.appendChild(newBox);
  // Itt kezelem le, ha a főoldalról ugrottam a meditációkhoz
  // jumpTargetMedId-ben jön a medId, amire rá akarok ugrani és ki akarom nyitni
  if (jumpTargetMedId) {
    setTimeout(async () => { // várni, hogy betöltődjön a DOM
      //console.log("jumpTargetMedId", jumpTargetMedId);
      const targetDiv = newBox.querySelector(`.med-row[data-med-id="${jumpTargetMedId}"]`);
      const med = myMed.find(m => m.medId == jumpTargetMedId);
      if (targetDiv && med) {
        const szabadHelyekSzama = med.maxEmber - med.jelentkezett;
        let status;
        if (szabadHelyekSzama > 8) status = 4;
        else if (szabadHelyekSzama > 5) status = 3;
        else if (szabadHelyekSzama > 2) status = 2;
        else if (szabadHelyekSzama > 0) status = 1;
        else status = 0;
        if (med.state !== "nyitva") status = 9;

        const letszamText = stateMappingForMedLetszam[status] || "";
        //console.log(">> Ugrás megkísérlése:", jumpTargetMedId, targetDiv, med);
        await toggleShowMedDetails(targetDiv, med, false, letszamText, med.state);
        await clearJumpTargetMedId(); // egyszeri használat után töröljük
        targetSection.classList.add('visible');
        targetDiv.scrollIntoView({ behavior: 'smooth', block: 'start' }); // képernyő tekerjen oda
      }
    }, 30);
  }
  if (refresh) { targetSection.classList.add('visible'); } // ha frissítés, akkor láthatóvá kell tenni, mert amúgy ez a showSection-ban történik
}


// Kattintásra: meditáció részleteinek megjelenítése / visszacsukása – user meditáció jelentkezéskor
export async function toggleShowMedDetails(medDiv, med, refresh = false, letszamText, medState) {
  //console.log(medState);
  let jelState = "nem"; // jelentkezés státusza
  let med_jel_docId = 0;
  let detailDiv = medDiv.querySelector(".med-detail");
  let isOpen = detailDiv.style.display === "block";
  if (isOpen && !refresh) {
    // Ha már nyitva van, csukjuk össze
    detailDiv.style.display = "none";
    medDiv.classList.remove("expanded");
    detailDiv.innerHTML = ""; // tartalom törlése bezáráskor
  } else {
    // Ha zárva van, vagy refresh = true, akkor töltsük be az adatokat és nyissuk ki
    // Ha volt előzőleg nyitott elem (és nem ugyanez), azt csukjuk össze
    if (lastOpenedMedDiv && lastOpenedMedDiv !== medDiv) {
      let prevDetailDiv = lastOpenedMedDiv.querySelector(".med-detail");
      if (prevDetailDiv) {
        prevDetailDiv.style.display = "none";
        lastOpenedMedDiv.classList.remove("expanded");
      }
    }
    // Frissítsük a legutóbbi nyitott elemet
    await setLastOpenedMedDiv(medDiv);
    // Jelentkező státuszának lekérdezése 
    let userId = myUser.userId;
    let medId = med.medId;
    try {
      let response = await fetch('/api/getMedJelentkezoData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medId, userId })
      });
      let result = await response.json();
      //console.log(result.vanJelentkezes, result.data);
      if (result.vanJelentkezes) { // van jelentkezés: normál vagy várólista
        jelState = result.data.state;
        med_jel_docId = result.data.docId;
      } else { // nincs jelentkezés
        jelState = "nem";
        med_jel_docId = 0;
      }
    } catch (error) {
      console.error("toggleShowMedDetails – Hiba a státusz lekérdezésekor:", error);
    }
    let teaserText = "⚜️ " + med.teaser;
    if (med.teaser == "") {
      teaserText = "még nincsenek részletek";
    }
    detailDiv.innerHTML = ""; // Régi tartalom törlése, majd új felépítése
    let html = ` 
      <div class="med-data-row-usermed">
        <div class="data-content-usermed" id="teaser-container">
          <p id="teaser-value">${teaserText}</p>
        </div>
      </div>
    `;
    if (medState === "nyitva") { // Ha nyitva a jelentkezés –» mutatjuk, hogy van-e még hely
      if (jelState === "nem") {
        html += `
          <div class="med-data-row-usermed">
            <div>
              <span class="homescreen-state" style="background-color: '#eee'}">Még nem jelentkeztél</span>
            </div>
          </div>
          <div class="data-content-usermed-letszam" id="letszam-container">
            <p id="letszam-text">${letszamText}</p>
          </div>
        </div>`
      } else if (jelState === "jelentkezett") {
        html += `
          <div class="med-data-row-usermed">
            <div>
              <span class="homescreen-state" style="background-color: ${stateMappingMedColor[jelState] || '#eee'}">${stateMappingMedKiiras[jelState]}</span>
            </div>
          </div>`
      } else if (jelState === "varolistan") {
        html += `
          <div class="med-data-row-usermed">
            <div>
              <span class="homescreen-state" style="background-color: ${stateMappingMedColor[jelState] || '#eee'}">${stateMappingMedKiiras[jelState]}</span>
            </div>
          </div>
          <div class="med-data-row-usermed">
            <div class="data-content-usermed-letszam" id="letszam-container">
              <p id="letszam-text">${letszamText}</p>
            </div>
          </div>`
      } else if (jelState === "torolt") {
        html += `
          <div class="med-data-row-usermed">
            <div>
              <span class="homescreen-state" style="background-color: ${stateMappingMedColor[jelState] || '#eee'}">${stateMappingMedKiiras[jelState]}</span>
            </div>
          </div>
          <div class="med-data-row-usermed">
            <div class="data-content-usermed-letszam" id="letszam-container">
              <p id="letszam-text">${letszamText}</p>
            </div>
          </div>`
      }
      html += `
        <div class="icon-container">
          <span class="icon normal-signup" data-medid="${med.medId}" title="Jelentkezés" onclick="medJelentkezesGomb('${med.medId}', '${myUser.userId}', 'jelentkezett')">🌼 Jelentkezem</span>
          <span class="icon waitlist-signup" data-medid="${med.medId}" title="Várólistára jelentkezés" onclick="medJelentkezesGomb('${med.medId}', '${myUser.userId}', 'varolistan')">⏳ Bizonytalan</span>
          <span class="icon waitlist-signup" data-medid="${med.medId}" title="Jelentkezés lemondása" onclick="deleteJelentkezo('${med_jel_docId}', '${myUser.userId}', '${med.medId}', 1)">❌ Lemondom</span>
        </div>
      `;
    }
    detailDiv.innerHTML = html;
    detailDiv.style.display = "block";
    medDiv.classList.add("expanded");
  }
}


// Kijelzett meditációs sor frissítése – user meditáció jelentkezéskor
export async function updateShowMedRowAndDetails(medId) {
  medId = Number(medId); // számmá alakítjuk, ha string-ként jönne be a genya
  let med = myMed.find(med => med.medId === medId); // Kivesszük a myMed objektumból az aktuálisan frissítendő objektumot
  let medDiv = document.querySelector(`.med-row[data-med-id='${medId}']`); // megkeressük a medObj korábban kijelzett sorát
  medDiv.style.backgroundColor = colorStateMapping[med.state] || "#ffffff"; // Színkódolás
  // Formázott dátum és időpont
  let dateObj = new Date(med.date);
  let formattedDate = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
  // Meditáció státusza
  let statusText = stateMappingForUser[med.state] || "Ismeretlen állapot";
  const medEmojis = ['🧘', '🧘‍♂️', '🧘🏻‍♀️', '🧘🏻‍'];
  const randomEmoji = medEmojis[Math.floor(Math.random() * medEmojis.length)];
  const szabadHelyekSzama = med.maxEmber - med.jelentkezett;
  let status;
  if (szabadHelyekSzama > 8) {
    status = 4;
  } else if (szabadHelyekSzama > 5) {
    status = 3;
  } else if (szabadHelyekSzama > 2) {
    status = 2;
  } else if (szabadHelyekSzama > 0) {
    status = 1;
  } else { //betelt!
    status = 0;
  }
  if (med.state == "nyitva") {
  } else {
    status = 9;
  }
  let letszamText = stateMappingForMedLetszam[status] || "";
  // Alap HTML szerkezet
  medDiv.innerHTML = `
    <div class="med-header">
      <div class="med-title" title="${med.cim}">${randomEmoji} ${med.cim}</div>
      <div class="med-date">${formattedDate} – ${statusText}</div>
      <div class="med-participants">${letszamText}</div>
    </div>
    <div class="med-detail" style="display: none;"></div> <!-- Ide kerülnek majd a med részletek -->
  `;
  await toggleShowMedDetails(medDiv, med, true, letszamText, med.state);
}


// User jelentkezik a gomb megnyomásával a medId meditációra (normál jelentkezés vagy várólistára)
export async function medJelentkezesGomb(medId, userId, requestType) {
  event.stopPropagation();  //ne csukódjon össze a med div
  //console.log("medId, userId, requestType", medId, userId, requestType)
  await sendNewJelentkezo(medId, userId, requestType);
  await updateShowMedRowAndDetails(medId); // adott meditációs sor frissítése && részletek nézet frissítése
  await saveUserHistory("jelentkezés meditációra " + String(medId) + " " + requestType);
}
window.medJelentkezesGomb = medJelentkezesGomb;