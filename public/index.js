// Globális változók
let googleClientId;
let login_user = {}; // Belépő user adatai
  // Nézetek lekérése
const startPage = document.getElementById('start-page');
const emailLogin = document.getElementById('email-login');
const registerPage = document.getElementById('register-page');
const emailRegister = document.getElementById('email-register');
const forgotPassword = document.getElementById('forgot-password');
const loggedInPage = document.getElementById('logged-in-page');
const views = [startPage, emailLogin, registerPage, emailRegister, forgotPassword, loggedInPage];
  // Gombok és linkek lekérése
const googleLoginBtn = document.getElementById('google-login-btn');  
const googleRegisterBtn = document.getElementById('google-register-btn');
const emailLoginBtn = document.getElementById('email-login-btn');
const emailLoginSubmit = document.getElementById('email-login-submit');
const registerLink = document.getElementById('register-link');
const backToStartLinks = document.querySelectorAll('#back-to-start, #back-to-start-2');
const backToRegisterLink = document.getElementById('back-to-register');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToEmailLoginLink = document.getElementById('back-to-email-login');
const emailRegisterBtn = document.getElementById('email-register-btn');
const emailRegisterSubmitBtn = document.getElementById('email-register-submit');
const userNameSpan = document.getElementById('user-name');
const forgotPasswordBtn = document.getElementById('forgot-password-submit');


registerLink.textContent = "Betöltés...";
// Ellenőrizzük, hogy a Firebase betöltődött-e
if (!firebase || typeof firebase.initializeApp !== 'function') {
  console.error('A Firebase SDK nincs betöltve! Ellenőrizd az index.html fejlécét.');
} else {
  // Ez fusson le, amint betöltött a DOM
  document.addEventListener('DOMContentLoaded', async () => {
    //Szerver hívás teszt
    const fetchData = async () => {
      try {
        const response = await fetch('/api/test'); // A szerver teszt endpoint hívás
        if (!response.ok) {
          throw new Error(`Szerver elérés hiba: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Szerver OK:', data);
      } catch (error) {
        console.error('Szerver elérés hiba:', error);
      }
    };
    await fetchData(); // Szerver hívás teszt meghívása
    //Proxy elérhetőség ellenőrzése
    try {
      const response = await fetch('/api/proxy-test');
      if (!response.ok) {
        throw new Error(`Hiba proxy hívás során: ${response.message}`);
      }
      console.log ('✅ Proxy OK');
    } catch (error) {
      console.error('proba – Proxy hívás hiba', error);
    }
    

    // Google belépés gomb
    googleLoginBtn.addEventListener('click', () => {
        google.accounts.id.prompt(); // Megjeleníti a Google bejelentkezési ablakot
    });
    
    // Google regisztrálás gomb
    googleRegisterBtn.addEventListener('click', () => {
        google.accounts.id.prompt(); // Megjeleníti a Google bejelentkezési ablakot
    });

    // Váltás az email-es belépés lapra gomb
    emailLoginBtn.addEventListener('click', () => {
        showView(emailLogin);
    });
    
    // Email-Passw belépés gomb
    emailLoginSubmit.addEventListener('click', () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      loginWithEmailAndPassword(email, password);
    });

    // Regisztrálás link
    registerLink.addEventListener('click', () => {
        showView(registerPage);
    });

    // Vissza link
    backToStartLinks.forEach(link => {
        link.addEventListener('click', () => {
            showView(startPage);
        });
    });

    // Elfelejtett jelszó link
    forgotPasswordLink.addEventListener('click', () => {
        showView(forgotPassword);
    });

    // Vissza link
    backToEmailLoginLink.addEventListener('click', () => {
        showView(emailLogin);
    });

    // Email regisztrálás nézetváltás gomb
    emailRegisterBtn.addEventListener('click', () => {
        showView(emailRegister);
    });
    
    // Email-Passw regisztrálás gomb
    emailRegisterSubmitBtn.addEventListener('click', () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        registerWithEmailAndPassword(email, password);
    });

    // Vissza link
    backToRegisterLink.addEventListener('click', () => {
        showView(registerPage);
    });
    
    // Elfelejtett jelszó gomb
    forgotPasswordBtn.addEventListener('click', () => {
      const email = document.getElementById('forgot-email').value;
      sendForgotPassword(email);
    });
    
    await showView(startPage);  //Induláskor ezt mutassa
    await fetchConfig();  //Környezeti változók
    await renderGoogleButton();  //Google elérés inicializálása
    console.log('✅ Google OK');
    await fetchUserCount();  //Firebase elérés teszt
    await fetchDbTest();  //Firestore elérés teszt
    
    registerLink.textContent = "Regisztráció itt";
  });
}


// Nézetek váltása
function showView(viewToShow) {
    //console.log(viewToShow.id);
    views.forEach(view => {
      view.classList.add('hidden');
    });
    viewToShow.classList.remove('hidden');
}


// Környezeti változók és Google elérés inicializálása
async function fetchConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Hiba a konfiguráció betöltése során: ${response.statusText}`);
    }
    const config = await response.json();
    //console.log('Környezeti változók:', config);
    googleClientId = config.googleClientId;
  } catch (error) {
    console.error('Hiba a konfiguráció betöltése során:', error);
  }
}

// Google elérés inicializálása
function renderGoogleButton() {
  google.accounts.id.initialize({
    client_id: googleClientId,
    callback: googleLogin, // A beléptetési callback függvényed
    //cancel_on_tap_outside: true, // Engedélyezi a prompt kilépését, ha a felhasználó máshová kattint
    ux_mode: 'popup', // Direkt popup használata
  });
}


// Firebase elérés teszt (lekérjük hány felhasználó van regisztrálva)
async function fetchUserCount() {
  try {
    const response = await fetch('/api/firebase-test');
    if (!response.ok) throw new Error(`Firebase elérés hiba: ${response.statusText}`);
    const result = await response.json();
    if (result.data >> 0) console.log('✅ Firebase OK:', result.data);
  } catch (error) {
    console.error('Firebase elérés hiba:', error);
  }
}

// Firestore elérés teszt (lekérünk egy tesztadatot)
async function fetchDbTest() {
  try {
    const response = await fetch('/api/db-test');
    if (!response.ok) {
      throw new Error(`Hiba: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('✅ Firestore OK:', result);
  } catch (error) {
    console.error('fetchDbTest – Hiba a szerver elérésekor:', error);
  }
}

// Email-Passw belépés kezelése
async function loginWithEmailAndPassword(email, password) {
  backToStartLinks.textContent = "Belépés...";
  try {
    const response = await fetch('/api/login-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    console.log(result.message);
    if (response.ok && result.login_state) {
      //console.log(result.uid);
      //console.log(result.name);
      login_user.uid = result.uid;
      login_user.name = result.name;
      login_user.loginType = "email";
      login_user.userId = result.userId;
      backToStartLinks.textContent = "Vissza";
      await welcomeUserAndRedirect();
    } else {
      backToStartLinks.textContent = "Vissza";
      alert(result.message);
    }
  } catch (error) {
    backToStartLinks.textContent = "Vissza";
    console.error('Hiba a belépés során:', error.message);
  }
}


// Email-Passw regisztráció kezelése
async function registerWithEmailAndPassword(email, password) {
  backToRegisterLink.textContent = "Regisztráció...";
  try {
    const response = await fetch('/api/register-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    console.log(result.message);
    backToRegisterLink.textContent = "Vissza";
    alert(result.message);
    location.reload(true);
  } catch (error) {
    backToRegisterLink.textContent = "Vissza";
    console.error('Hiba a regisztráció közben:', error.message);
  }
}


// Jelszó emlékeztető kiküldés kezelése
async function sendForgotPassword(email) {
  backToStartLinks.textContent = "Pillanat...";
  try {
    // Megadott email elküldése a szervernek
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    });
    const data = await res.json();
    console.log(data.message);
    backToStartLinks.textContent = "Vissza";
    alert(data.message);
  } catch (error) {
    backToStartLinks.textContent = "Vissza";
    console.error('Hiba a kérés során:', error);
  } 
  location.reload(true);
}


// Google belépés és regisztráció kezelése
async function googleLogin(response) {
  //console.log('Google ID token:', response.credential);
  registerLink.textContent = "Google belépés...";
  backToStartLinks.textContent = "Google belépés...";
  try {
    // Google ID token elküldése a szervernek
    const res = await fetch('/api/login-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });
    const data = await res.json();
    if (data.success) {
      //console.log('Bejelentkezés sikeres!', data);
      login_user.uid = data.user.uid;
      login_user.name = data.user.displayName;
      login_user.loginType = "google";
      login_user.userId = data.userId;
      registerLink.textContent = "Regisztráció itt";
      backToStartLinks.textContent = "Vissza";
      await welcomeUserAndRedirect();
    } else {
      registerLink.textContent = "Regisztráció itt";
      backToStartLinks.textContent = "Vissza";
      console.error('Hiba a bejelentkezés során:', data.message);
    }
  } catch (error) {
    registerLink.textContent = "Regisztráció itt";
    backToStartLinks.textContent = "Vissza";
    console.error('Hiba a kérés során:', error);
  }
}

// Welcome message kijelzése, majd átirányítás
async function welcomeUserAndRedirect() {
  await showView(loggedInPage);
  userNameSpan.textContent = login_user.name;
  //console.log(login_user.uid);
  redirectToApp();
}

// Átirányítás a Szeretetben App oldalra
function redirectToApp() {
    //const appUrl = "https://www.szeretetben.hu/szeretetben-app/";
    const appUrl = "https://szeretetben-app.glitch.me/app.html"
    window.location.href = `${appUrl}?USER_ID=${login_user.userId}&fb_uid=${login_user.uid}&login_type=${login_user.loginType}`;
    //window.location.href = `${appUrl}`;
}
