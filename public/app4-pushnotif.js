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
//import { initPush } from './app4-pushnotif.js';
import { initCalendar } from './app5-calendar.js';

export async function initPush() {
  try {
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const response = await fetch("/api/init-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error("Backend push init sikertelen");
    console.log("Push engedélyezve backend alapján");
  } catch (err) {
    console.error("Push inicializálás hiba:", err);
  }
}
