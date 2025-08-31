# Szeretetben App

A **Szeretetben App** egy felhasználói felület egyéni kezelésekre, tértisztításra, csoportos események (meditációk, workshopok, tanítások) szervezésére, jelentkezések kelelésére és a hozzá tartozó kommunikációhoz. Továbbá tesztek kitöltéséhez és kiértékeléséhez, fórum beszélgetésekhez, marketinghez (ajánlások, üzenetek) és visszajelzések kéréséhez.

Az alkalmazás lehetőséget biztosít vagy fog biztosítani:

- regisztráció, ügyfélprofilok kezelésére (email és sms verifikáció)
- időpontfoglalásra egyéni kezelésekre (időpontfoglaló rendszer emlékeztetőkkel)
- jelentkezés meghirdetett csoportos eseményekre (meditációk, workshopok, tanítások)
- időpont emlékeztetők kiküldésére (email, push üzenet, átjelentkezések, késői lemondások kezelése)
- tesztek kitöltésére és kiértékelésére (még nincs kész)
- teszteredmények vizuális megjelenítésére (html, pdf, email diagramokkal is)
- emailes értesítések automatikus küldésére (még nincs kész)
- értesítések push üzenetekkel (még nincs kész)
- admin felület (felhasználók, jogosultságok, profilok, beállítások, árak, feltételek, hírek, moderációk)
- aszisztens felület (szervezés, jelentkezések, felhasználók kezelése, fizetés)
- események szervezése (meditációk, workshopok, emailben gombbal jelentkezés, lemondások és várólista kezelés)
- visszajező kérdőívek készítése, kiküldése, összesítése
- ügyféltörténet és alap crm (időpontok, meditációk, lemondások)

A projekt `Node.js` alapú szerverrel, `Firebase Authentication` és `Firestore` adatbázissal működik, HTML/JS frontend mellett.

---

## 🔧 Fő technológiák

- **HTML + CSS** – frontend felület
- **Node.js + Express** – szerveroldali logika és API-k
- **Firebase Authentication** – bejelentkezés, regisztráció, jelszókezelés
- **Firestore (NoSQL)** – valós idejű adatbázis felhasználói és eseményadatokhoz
- **Firebase Cloud Messaging (tervezett)** – push értesítések
- **Nodemailer / Gmail SMTP (tervezett)** – emailküldés
- **Chart.js / SVG(tervezett)** – teszteredmények vizuális megjelenítése
- **Glitch.com** – fejlesztési és prototípus környezet
- **Seeme.hu** - API sms küldés, értesítések / verifikáció

---

## 📁 Fájlstruktúra

```text
.
├── README.md                 # Általános projektleírás
├── globals.js                # Backend globális változók, .env betöltése
├── package.json              # Projektfüggőségek, metaadatok
├── routes.js                 # Szerver oldali útvonalak regisztrációja
├── server.js                 # Szerver indítása, alapkonfiguráció
├── src/
│   └── seo.json              # SEO/meta beállítások
├── public/                   # Frontend HTML, CSS és JS
│   ├── index.html            # Login felület HTML
│   ├── index-css.css         # Login felület stílus
│   ├── index.js              # Login logika (JS)
│   ├── app.html              # Webapp fő HTML
│   ├── app.css               # Webapp fő CSS
│   ├── app-globals.js        # Frontend globális változók
│   ├── app.js                # Auth, webapp indítás, profil, adatlekérés, kilépés
│   ├── app1-profil.js        # Felhasználói profilkezelés
│   ├── app2-med.js           # Meditációk, események kezelése
│   ├── app3-users.js         # Felhasználólista, keresés, időpont
│   └── app4-pushnotif.js     # Push értesítések kezelése
├── controllers/              # Backend szerveroldali logika
│   ├── email.js              # Email-összeállítás logika
│   ├── emailsend.js          # Emailküldés kezelése
│   ├── login.js              # Bejelentkezési endpointok
│   ├── loginTest.js          # Előzetes teszt endpointok
│   ├── med.js                # Meditációs események endpointjai
│   └── user.js               # Felhasználói adatok kezelése


```

# Általános programszervezés

Legfontosabb, hogy frontendre ne kerüljenek ki érzékeny adatok, api kulcsok, adatbázis elemek, stb. Ezért minden ilyet a .env fájlban tárolunk és szerver oldalon kezelünk.

**Frontend**

A frontend-en a teljes webapp az app.html-en keresztül jelenik meg, ehhez kapcsolódnak a szkriptek, melyeket külön js fájlokba szervezünk. Elnevezésben az "app-" kezdettel illetjük és számozzuk őket. Az app-globals.js -ben definiált globális változók mindegyikét betöltjük mindegyik app- js szkriptbe. Mindegyik app- szkript mindegyik metódusát exportáljuk és a többi frontend szkriptben importáljuk ezáltal minden függvény mindenhonnan elérhető és hívható. Cserébe viszont egyedi és beszédes metódusneveket kell alkalmazni. A frontend-ről a backend-en szerveroldali endpoint (api) hívásokat alkalmazunk, melyek lehetnek GET vagy POST hívások és jellemzően JSON formátumban adják vissza a választ. A teljes futás ASYNC működésű, azaz nincsenek párhuzamos futások, mindig megvárjuk a válaszadást. Emiatt ASYNC / AWAIT -re van szükség. A hibakazelést TRY / CATCH ágakkal kezeljük.

**Backend**

A backend-en, azaz szerveroldalon kezeljük többek között az adatbázis kommunikációt, az email kommunikációt, push üzenetek küldését, mivel ezek mindig tartalmaznak érzékeny adatokat. Illetve minden olyan függvényt, melyet semmiképpen nem akarunk kódban sem láttatni a felhasználói oldalon, azaz pl. böngészőben előhívható módon. A szerveroldali JS szriptek külön fájlba szerveződnek (email, login, user, med, stb.). A külön fájlba szervezéshez a főkönyvtárban lévő routes.js definícióra van szükség (összefűzés), melyet a server.js-ben regisztrálunk. Illetve, szükség van még globális változókra, melyek mindegyik controller-ből elérhetőek: ezeket a globals.js-ben definiáljuk és mindegyik controller legelején betöltünk. A szerver endpoint metódusok egymást is hívni tudják, mint szerver hívást.

**Assets**

A megjelenített képfájlok, ikonok, stb. az Assets mappában találhatóak. Rákattintva megjelenik az URL melyet felhasználunk. Ezeket a Glitch valahol kívül tárolja felhőben.

# Biztonsági mentés

A biztonsági mentés manuálisan történik. Glitch-ből tömörített mappaként letölthető a fájl lista. Külön kell letölteni az Assets fájlokat és a ponttal kezdődő titkosított fájlokat: (.env, .gitignore, .nvmrc). Szerencsére ezek ritkán változnak.
Gyors biztonsági mentés: csak simán lementeni a tömörített fájl listát. (Glitch: Tools –» Export)

# Visszaállítás / Új Glitch telepítés

A lementett fájlokat és fájlstrukúrát manuálisan kell létrehozni és bemásolni Glitch-be. A Glitch megengedi teljes könyvtárak behúzását a strukturába. Létre kell hozni a ponttal kezdődő titkos fájlokat is (.env, .gitignore, .nvmrc). Be kell másolni az Assets-be a fájlokat (új hivatkozás URL-ek jönnek létre, melyeket a kódban frissíteni kell a helyes működéshez). Létre kell hozni a helyesen beállított Firebase-t és Firestore-t. Létre kell hozni a Firestore alap-adatbázis struktúrát.
Ha minden fájl és hivatkozás helyes és a .env is és az adatbázis is, akkor a Glitch automaikusan elindítja a szervert és az webapp máris elérhető és fut az új ....glitch.com címen.

# Glitch határai – kezdetben a Glitch-en fejlesztettünk, ez már nem aktuális

Kb. havi 1000 felhasználóig képes kiszolgálni az igényeket a Glitch. Ezen felül érdemes migrálni a programot pl. Google Cloud-ba, fizetős és jobban skálázható, valamint biztonságosabb környezetbe.