// Az app globális változói
// melyeket az app.js-ben és az összes modul js-ben importálunk
export let myUser = { USER_ID: 7 }; // user főobjektum – aktuálisan belépett user adatai
export let allUsers = []; // összes user listája objektum
export let askedUser = { USER_ID: 0 }; // ebbe a változóba kérünk le egy felhasználót (aki nem a belépett felhasználó)
export let myMed = [];  // meditációk listája objektum (jelentkezők nélkül)
export let medTable_selectedRow_medId = null; // meditációk táblázat kiválasztott sorának MED_ID-je
export let lastOpenedMedDiv = null; // legutóbb lenyitott meditációs sáv
export function setLastOpenedMedDiv(medDiv) {
  lastOpenedMedDiv = medDiv;
}
export let jumpTargetMedId = null; // megnyitandó med medId-je, ha a főoldalról ugrunk a meditációkhoz. Ha nincs ugrás, akkor null.
export function setJumpTargetMedId(medId) {
  jumpTargetMedId = medId;
}
export function clearJumpTargetMedId() {
  jumpTargetMedId = null;
}
export let calendar; //maga a naptár elem változója
export function setCalendar(cal) { // naptár létrehozása a változóba
  calendar = cal;
}
export let stillLoading = false; // jelzi, hogy még épp tart egy lekérés / betöltés egy gombnyomás után
export function setStillLoading(boo) {
  stillLoading = boo;
}


// meditációs állapotok nevei
export const stateMapping = {
  "cimre_var": "Címre vár", //20-16! nappal előtte figyelmeztetés –» email adminnak
  "teasert_var": "Teaserre vár",//15–13! nappal előtte figyelmeztetés –» email adminnak
  "uzenet_var": "Üzenetre vár",//12–9!-8!! nappal előtte figyelmeztetés –» email szervezőnek
  "kikuldheto": "Kiküldhető",//7 nappal előtte kiküldeni –» email-ek kiküldése (1); vagy: nem sikerült kiküldeni! –» email adminnak + szervezőnek
  "nyitva": "Jelentkezés nyitva",//2 nappal előtte –» email-ek kiküldése (2) aki még nem jelentkezett és jelentkezőknek emlékeztető email; 1 nappal előtte –» jelentkezőknek emlékeztető email
  "elmult": "Elmúlt",//aznap, egy órával utána beállítani
  "torolt": "Törölve"
};
// meditációs állapotok nevei a user-nek a meditációk jelentkezésénél
export const stateMappingForUser = {
  "cimre_var": "Szervezés alatt", //20-16! nappal előtte figyelmeztetés –» email adminnak
  "teasert_var": "Szervezés alatt",//15–13! nappal előtte figyelmeztetés –» email adminnak
  "uzenet_var": "Betervezett",//12–9!-8!! nappal előtte figyelmeztetés –» email szervezőnek
  "kikuldheto": "Betervezett",//7 nappal előtte kiküldeni –» email-ek kiküldése (1); vagy: nem sikerült kiküldeni! –» email adminnak + szervezőnek
  "nyitva": "Már lehet jelentkezni rá!",//2 nappal előtte –» email-ek kiküldése (2) aki még nem jelentkezett és jelentkezőknek emlékeztető email; 1 nappal előtte –» jelentkezőknek emlékeztető email
  "elmult": "Már elmúlt",//aznap, egy órával utána beállítani
  "torolt": "Törölve"
};
// meditációs sorok színjelölése
export const colorStateMapping = {
  "cimre_var": "#f5f50f", // light red
  "teasert_var": "#f5f50f", // light red
  "uzenet_var": "#f5f50f", // light yellow
  "kikuldheto": "#f5f50f", // darker yellow
  "nyitva": "#92f71e", // light green (standardized hex code)
  "elmult": "#6272fc", // light blue
  "torolt": "#b5b5b5" // gray (standardized hex code)
};
// meditációs sorok színjelölése
export const colorStateMappingForUser = {
  "cimre_var": "#fc5a4c", // light red
  "teasert_var": "#fc5a4c", // light orange
  "uzenet_var": "#f9ff85", // light yellow
  "kikuldheto": "#f9ff85", // light yellow
  "nyitva": "#92f71e", // light green (standardized hex code)
  "elmult": "#6272fc", // light blue
  "torolt": "#b5b5b5" // gray (standardized hex code)
};
// meditációra jelentkezés állapotok nevei
export const stateMappingMed = {
  "jelentkezett": "jelentkezett",
  "varolistan": "várólistán",
  "torolt": "lemondta",
};
// meditációra jelentkezés állapotok kiírásai
export const stateMappingMedKiiras = {
  "jelentkezett": "jelentkezés aktív",
  "varolistan": "várólistán",
  "torolt": "lemondva",
};
// meditációra jelentkezés színjelölése
export const stateMappingMedColor = {
  "jelentkezett": "#c6ff85", // light green
  "varolistan": "#ffaf85", // light orange
  "torolt": "#b5b5b5", // light gray
  "jelen": "#6cba13" // darker green
};
// meditációs létszámkijelzés a usernek
export const stateMappingForMedLetszam = {
  0: "Nincs már hely –» jelentkezz várólistára!", //betelt, nincs már hely
  1: "Már csak egyetlen hely maradt!",//már csak egyetlen hely maradt
  2: "Már csak néhány hely maradt!",//már csak néhány hely maradt
  3: "Akad még hely",//van még, de fogynak a helyek
  4: "Van még hely",//van még hely
  9: "",
};
// hónapok rövidített nevei
export const rovidHonapNevek = ["jan.", "feb.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szep.", "okt.", "nov.", "dec."];


// Változók összegyűjtése
/*
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
*/
//import { setLastOpenedMedDiv } from './app-globals.js';