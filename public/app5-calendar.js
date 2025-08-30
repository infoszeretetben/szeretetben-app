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
import { fetchUsersDataArray, updateUsersSection, showNewIdopontForm, saveNewIdopont, openBillingo, saveUserHistory, showUserHistory } from './app3-users.js';
import { initPush } from './app4-pushnotif.js';
//import { initCalendar } from './app5-calendar.js';

// inicializálja (frissíti, újra betölti) a naptárat – Szabad időpontok naptár
// calendar definíció és nézet beállítások
export async function initCalendar() {
  const calendarDiv = document.getElementById('calendar-container');
  const calendarElem = document.getElementById('calendar');
  if (!calendarElem) {
    console.error('❌ Nem található #calendar elem a DOM-ban!');
    return;
  }
  if (calendar) { calendar.destroy(); } // előző naptár példány törlése, hogy ne jöjjön létre másodpéldány
  
  
  const newCal = new FullCalendar.Calendar(document.getElementById('calendar'), {
    initialView: 'dayGridMonth',
    locale: 'hu',
    buttonText: {
      today:    'Most',
      month:    'Havi',
      week:     'Heti'
    },
    firstDay: 1,
    validRange: {
      start: new Date()
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'

    },
    views: {
      timeGridWeek: {
        titleFormat: (info) => {
          const start = info.start.marker;
          const endDateObj = info.end.marker;
          if (!start || !endDateObj) return '';
          const end = new Date(endDateObj);
          end.setDate(end.getDate() - 1);
          const startDay = start.getDate();
          const endDay = end.getDate();
          const startMonth = start.toLocaleDateString('hu-HU', { month: 'long' });
          const endMonth = end.toLocaleDateString('hu-HU', { month: 'long' });
          if (start.getMonth() === end.getMonth()) {
            // ugyanabban a hónapban
            return `${startMonth} ${startDay} – ${endDay}.`;
          } else {
            // két külön hónap
            return `${startMonth} ${startDay} – ${endMonth} ${endDay}.`;
          }
        },
        slotMinTime: '09:00:00',  // csak 9-21h mutassa
        slotMaxTime: '21:00:00',
        allDaySlot: false
      },
    },
    hiddenDays: [0, 6], // 0 = vasárnap, 6 = szombat – ne mutassa
    dayMaxEventRows: false,   // ne limitálja az eseményeket
    dayMaxEvents: false,      // ne cserélje +gombra
    expandRows: true,          // engedje nőni a sormagasságot
    dayHeaderContent: function(arg) {
      const viewType = arg.view.type;
      const napnevek = ['VAS', 'HÉT', 'KEDD', 'SZER', 'CSÜT', 'PÉNT', 'SZOM'];
      const napnev = napnevek[arg.date.getDay()];
      if (viewType === 'timeGridWeek') {
        const napSzam = arg.date.getDate().toString().padStart(2, '0');
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        const napElem = document.createElement('div');
        napElem.textContent = napSzam;
        napElem.style.fontSize = '1.7em';
        napElem.style.fontWeight = '600';
        const napnevElem = document.createElement('div');
        napnevElem.textContent = napnev;
        napnevElem.style.fontSize = '0.8em';
        wrapper.appendChild(napElem);
        wrapper.appendChild(napnevElem);
        return { domNodes: [wrapper] };
      } else {
        // havi nézet: csak napnév, nagybetűsen
        return napnev;
      }
    },
    dayCellDidMount: function(arg) {
      const d = new Date(arg.date);
      const h = d.getMonth(); // 0–11
      const szinek = [
        '#fff9f0', '#f0fff4', '#f0f8ff', '#f0f0ff',
        '#f5f5f5', '#fff0f5', '#f0ffff', '#fffff0',
        '#e6f7ff', '#fdf6e3', '#fef2f2', '#f3f0ff'
      ];
      arg.el.style.backgroundColor = szinek[h];
    },
    viewDidMount: function(viewInfo) {
      if (viewInfo.view.type !== 'dayGridMonth') return;
      setTimeout(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekRows = document.querySelectorAll('.fc-daygrid-body .fc-daygrid-row');
        weekRows.forEach(row => {
          const dayCells = row.querySelectorAll('.fc-daygrid-day');
          let rowHasFuture = false;
          let rowHasEvents = false;
          dayCells.forEach(cell => {
            const dateStr = cell.getAttribute('data-date');
            const date = new Date(dateStr);
            if (date >= today) {
              rowHasFuture = true;
            }
          });
          if (!rowHasFuture) { // Ha a sor minden napja múltbeli, akkor elrejtjük
            row.classList.add('fc-hide-row');
          }
        });
      }, 0); // egy tick késleltetés
    },
    events: [] // ide jönnek majd az események
  });
  
  // Naptár betöltése a calendar változóba
  await setCalendar(newCal);
  calendar.render();
  // Láthatóvá tesszük
  calendarDiv.style.display = 'block';
  setTimeout(() => {
    calendar.updateSize();
  }, 0);
  
  // havi nézet nap kockájára kattintunk –» nyíljon meg az a hét heti nézetben
  calendar.setOption('dateClick', function(info) {
    const clickedDate = new Date(info.dateStr);
    // Ellenőrizzük, hogy az adott héten van-e aktív nap
    if (!isWeekActive(clickedDate)) return;
    // Heti nézetre váltás, és a kiválasztott dátum hetének betöltése
    calendar.changeView('timeGridWeek', clickedDate);
  });
}


// Hónapok színezése
function getMonthColor(month) {
  const szinek = [
    '#fff9f0', // jan
    '#f0fff4', // febr
    '#f0f8ff', // márc
    '#f0f0ff', // ápr
    '#f5f5f5', // máj
    '#fff0f5', // jún
    '#f0ffff', // júl
    '#fffff0', // aug
    '#e6f7ff', // szept
    '#fdf6e3', // okt
    '#fef2f2', // nov
    '#f3f0ff'  // dec
  ];
  return szinek[month] || '#ffffff';
}

// Az adott héten ellenőrzi, van-e aktív nap (ami még nem múlt el)
// true = van, false = nincs
function isWeekActive(date) {
  const now = new Date();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // hétfő
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // vasárnap
  // Ellenőrizzük, hogy van-e olyan nap a héten, ami jövőbeli
  return now <= endOfWeek;
}
