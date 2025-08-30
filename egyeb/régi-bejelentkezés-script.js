<!DOCTYPE html>
<html lang="hu">

<head>
    <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-auth-compat.js"></script>


    <script>
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        const firebaseConfig = {
          apiKey: "AIzaSyBqsRBiFQEw_QbI8e8cbkeM63EJkosuaq4",
          authDomain: "szeretetbenapp.firebaseapp.com",
          projectId: "szeretetbenapp",
          storageBucket: "szeretetbenapp.firebasestorage.app",
          messagingSenderId: "461393102877",
          appId: "1:461393102877:web:bf90328417e2433fff1ef4",
          measurementId: "G-PP2RL1FJVR"
        };
        // Firebase inicializálása
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        //console.log(auth);
      
        // JSONP callback függvény globális elérhetősége
        window.handleResponse = function (response) {
            if (response.status === "success") {
                // console.log("Adatszinkron sikeres:", response.message);
                // console.log("Felhasználó azonosítója:", response.user_id);
            } else {
                console.error("Hiba történt az adatszinkronizálás során:", response.message);
            }
        };
        
        // Felhasználó adatok szinkronizálása a Google Sheets-szel
        async function syncUserWithSheets(user, loginType) {
            const webhookUrl = "https://script.google.com/macros/s/AKfycby4Zx53GBLBLHxXr9_GQrQBh53kNKTyLAzlFWUHiH5hE4B3Ik6OaLniir3xhvtO5Cga/exec";
                
            return new Promise((resolve, reject) => {
                window.handleResponse = function (response) {
                    try {
                        if (response.status === "success") {
                            console.log("Adatszinkron sikeres:", response.message);
                            resolve(response.user_id);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (error) {
                        console.error("Hiba történt az adatszinkronizálás során:", error);
                        reject(error);
                    }
                };

                const queryParams = new URLSearchParams({
                    callback: "handleResponse",
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || "",
                    loginTime: new Date().toISOString(),
                    userEmailVerified: user.emailVerified,
                    loginType: loginType
                });

                const script = document.createElement("script");
                script.src = `${webhookUrl}?${queryParams.toString()}`;
                document.body.appendChild(script);
                console.log("Adatok elküldve az App Script-nek:", queryParams.toString());
            });
        }

        // Átirányítás a Szeretetben App oldalra
        function redirectToApp(userId, userFbuid, loginType) {
            const appUrl = "https://www.szeretetben.hu/szeretetben-app/";
            window.location.href = `${appUrl}?USER_ID=${userId}&fb_uid=${userFbuid}&login_type=${loginType}`;
        }
        
    //Email/Jelszó Belépés
      async function loginWithEmail() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          console.log("Sikeres email belépés:", user);
         
          // Adatok szinkronizálása és user_id lekérése
          const my_user_id = await syncUserWithSheets(user, "password");
          console.log("Lekért felhasználó azonosító:", my_user_id);
          
          // Átirányítás a Szeretetben App-ra
          //        ha létezik a felhasználó a User List-ben
          //        ha már vissza van igazolva az email címe
          if (my_user_id !== 0 && user.emailVerified) {
            // Átirányítás
            redirectToApp(my_user_id, user.uid);
            console.log("Átirányítás a Szeretetben App-ra");
          } else {
          	// Nem irányítjuk át
            console.log("Megtaláltalak, de az átirányítás sikertlen a Szeretetben App-ra");
            if (!user.emailVerified); {
                alert("Már regisztráltál, de még nem igazoltad vissza az email címed az email fiókodból!");
            }
          }
          
          //alert("Sikeresen bejelentkeztél!");
        } catch (error) {
            console.error("Belépési hiba:", error.message);
            const errorMessage = getFriendlyErrorMessage(error.code);
          	alert(errorMessage);
        }
    }

    // Központi hibaüzenet-kezelő
    function getFriendlyErrorMessage(errorCode) {
    const errorMessages = {
        "auth/user-not-found": "Nem található ilyen felhasználó. Ellenőrizze az email-címet, vagy regisztráljon új fiókot.",
        "auth/wrong-password": "Helytelen jelszó. Kérjük, próbálja újra, vagy használja a jelszó-helyreállítást.",
        "auth/invalid-email": "Érvénytelen email-cím. Kérjük, adjon meg egy helyes email-címet.",
        "auth/email-already-in-use": "Ez az email-cím már használatban van. Próbálja meg bejelentkezni, vagy használjon másik címet.",
        "auth/weak-password": "A megadott jelszó túl gyenge. Kérjük, használjon erősebb jelszót.",
        "auth/invalid-login-credentials": "Helytelen bejelentkezési adatok. Kérjük, ellenőrizze az email-címet és a jelszót.",
        "auth/too-many-requests": "Túl sok próbálkozás történt. Kérjük, próbálja újra később.",
        // További hibakódok hozzáadhatók itt
        };

        // Ha nincs egyedi üzenet, alapértelmezett üzenetet használunk
        return errorMessages[errorCode] || "Ismeretlen hiba történt. Kérjük, próbálja újra később.";

      }

    // Google Belépés
    async function googleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
          const result = await auth.signInWithPopup(provider);
          const user = result.user;
          console.log("Sikeres belépés:", user);
          
          // Adatok szinkronizálása és user_id lekérése
          const my_user_id = await syncUserWithSheets(user, "google");
          //console.log("Lekért felhasználó azonosító:", my_user_id);
          
          // Átirányítás a Szeretetben App-ra
          //        ha létezik a felhasználó a User List-ben
          //        ha már vissza van igazolva az email címe
          if (my_user_id !== 0 && user.emailVerified) {
            // Átirányítás
            redirectToApp(my_user_id, user.uid);
            console.log("Átirányítás a Szeretetben App-ra");
          } else {
          	// Nem irányítjuk át
            console.log("Beléptél, de az átirányítás sikertlen a Szeretetben App-ra");
            if (!user.emailVerified); {
                alert("Már regisztráltál, de még nem igazoltad vissza az email címed az email fiókodból!");
            }
          }
    
          // alert(`Üdvözlünk, ${user.displayName}`);
          // További műveletek, pl. adatbázis frissítése
        } catch (error) {
          console.error("Hiba történt a belépés során:", error.message);
        }
    }

    // Facebook Belépés
    async function facebookLogin() {
        const provider = new firebase.auth.FacebookAuthProvider();

        try {
            const result = await auth.signInWithPopup(provider); // `await` használható, mert `facebookLogin` async
            const user = result.user;
    
            // Adatok szinkronizálása és user_id lekérése
            const my_user_id = await syncUserWithSheets(user, "facebook"); // Ez is `await`
            console.log("Lekért felhasználó azonosító:", my_user_id);
  
            // Átirányítás a Szeretetben App-ra
            //        ha létezik a felhasználó a User List-ben
            //        ha már vissza van igazolva az email címe
            if (my_user_id !== 0 && user.emailVerified) {
              // Átirányítás
              redirectToApp(my_user_id, user.uid);
              console.log("Átirányítás a Szeretetben App-ra");
            } else {
              // Nem irányítjuk át
              console.log("Beléptél, de az átirányítás sikertlen a Szeretetben App-ra");
              if (!user.emailVerified); {
                alert("Már regisztráltál, de még nem igazoltad vissza az email címed az email fiókodból!");
              }
              
            }
  
              //alert(`Üdvözlünk, ${user.displayName}`);
              console.log("Facebook felhasználó:", user);
                
          } catch (error){
              console.error("Facebook belépési hiba:", error.message);
              alert(`Hiba: ${error.message}`);
          }
        }

    // Email/jelszó alapú regisztráció
      async function registerWithEmail() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          console.log("Sikeres regisztráció:", user);
          // alert("Sikeresen regisztráltál!");
          
          // Regisztráció után meghívom újra az oldalt, mert az ellenőrzi újra, hogy a felhasználó be van-e lépve
          alert("Igazold vissza az email címed az email fiókodból! Csak utána fogsz tudni belépni!");
          location.reload();
        } catch (error) {
          console.error("Regisztrációs hiba:", error.message);
          alert("Hiba: " + error.message);
        }
      }

    // Jelszó-helyreállítás
      async function resetPassword() {
        const email = document.getElementById('reset-email').value;
        try {
          await auth.sendPasswordResetEmail(email);
          alert("Jelszóhelyreállítási email elküldve!");
          //Frissíteni kell a lapot, hogy a bejelentkezés képernyőre jussunk újra
          location.reload();
        } catch (error) {
          console.error("Hiba történt a jelszó helyreállítása során:", error.message);
          alert("Hiba: " + error.message);
        }
      }

    // Az aktuális felhasználó állapotának figyelése
    auth.onAuthStateChanged(async user => {
        // Belépési mód lekérése 
        // A belépés módját majd az alkalmazáson belül kérjük le google sheet User List-ből, mivel a firebase nem jegyzi meg a legutóbbi belépés authentikációs módját. Azt nekem kell elmentenem belépéskor. Azért nem itt kérem le, mert így gyorsabban fut a belépés, nem kell api-ra várni.
        if (user && user.emailVerified) {
            console.log("Felhasználó bejelentkezve:", user);
            //alert(`Már be vagy jelentkezve, mint ${user.displayName}`);
            // Megjelenítjük a bejelentkezési üzenetet
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('logged-in-message').classList.remove('hidden');
            document.getElementById('user-name').innerText = user.displayName || "Ismeretlen felhasználó";

            try {
                // Adatok szinkronizálása és user_id lekérése
                const my_user_id = await syncUserWithSheets(user, "visszatert");
                console.log("Lekért felhasználó azonosító:", my_user_id);
    
                // Átirányítás a Szeretetben App-ra
                //        ha létezik a felhasználó a User List-ben
                //        ha már vissza van igazolva az email címe
                if (my_user_id !== 0 && user.emailVerified) {
                  // Átirányítás
                  redirectToApp(my_user_id, user.uid);
                  console.log("Átirányítás a Szeretetben App-ra");
                } else {
                  // Nem irányítjuk át
                  console.log("Beléptél, de az átirányítás sikertlen a Szeretetben App-ra");
                }
            } catch (error) {
                console.error("Hiba az adatszinkronizálás során:", error);
            }
            
        } else {
          console.log("Felhasználó kijelentkezve");
          // Megjelenítjük a belépési mezőket
          document.getElementById('login-form').classList.remove('hidden');
          document.getElementById('logged-in-message').classList.add('hidden');

        }
    });
    </script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bejelentkezés</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Roboto', sans-serif;
            background-color: #e3f2fd; /* Világoskék háttérszín */
            display: flex; /* Flexbox bekapcsolása */
    		flex-direction: column; /* Függőleges elrendezés */
    		justify-content: center; /* Függőleges középre igazítás */
    		align-items: center; /* Vízszintes középre igazítás */
            height: 100vh; /* Teljes képernyő magasság */
            margin: 10;
        }
        .container {
            background-color: #fff;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 400px;
            text-align: center;
            margin: 0 auto;
    		padding-top: calc(1rem + 2rem + 16px + 300px); /* Fejléc padding + margó */
        }
        .header {
        	position: fixed; /* Fixálás az oldal tetejére */
    		top: 0; /* Az oldal tetején kezdődjön */
    		left: 50%; /* Középre igazítás vízszintesen */
    		transform: translateX(-50%); /* Kiegyenlíti a balra tolódást */
    		color: #fff;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.5rem;
            font-weight: 700;
            text-transform: uppercase;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    		text-align: center;
            margin: 0 auto 20px auto; /* Középre helyezés és távolság */
            background-color: #4a90e2;
            z-index: 1000; /* Mindig a többi elem felett legyen */
    		max-width: 400px;
    		width: calc(100% - 40px); /* Kisebb eszközökön is jól nézzen ki */
    		margin: 10px auto; /* Margó a képernyő szélétől */
        }
        h2 {
            margin-bottom: 1.5rem;
            margin-top: 8rem;
            color: #333;
        }
        .input-group {
            margin-bottom: 1rem;
            text-align: left;
        }
        .input-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
        }
        .input-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        .btn {
            display: block;
            width: 100%;
            padding: 0.75rem;
            margin-top: 1rem;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 0.75rem;
            margin-top: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .social-btn img {
            width: 20px;
            height: 20px;
            margin-right: 0.5rem;
        }
        .social-btn.google {
            background-color: #fff;
            color: #333;
        }
        .social-btn.google:hover {
            background-color: #f8f9fa;
        }
        .social-btn.facebook {
            background-color: #3b5998;
            color: #fff;
        }
        .social-btn.facebook:hover {
            background-color: #2d4373;
        }
        .social-btn.apple {
            background-color: #000;
            color: #fff;
        }
        .social-btn.apple:hover {
            background-color: #333;
        }
        .link {
            display: block;
            margin-top: 1rem;
            color: #007bff;
            text-decoration: none;
            font-size: 0.9rem;
        }
        .link:hover {
            text-decoration: underline;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>

    <div class="container">
    	
        
        <div id="login-form">
            <div class="input-group">
                <label for="login-email">Email cím</label>
                <input type="email" id="login-email" placeholder="Adja meg az email címét">
            </div>
            <div class="input-group">
                <label for="login-password">Jelszó</label>
                <input type="password" id="login-password" placeholder="Adja meg a jelszavát">
            </div>
            <button class="btn" onclick="loginBtn()">Bejelentkezés</button>
            <div style="margin: 1.5rem 0; color: #888;">vagy</div>
            <div class="social-btn google" onclick="googleLoginBtn()">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google ikon">
                Google fiókkal
            </div>
            <div class="social-btn facebook" onclick="facebookLoginBtn()">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook ikon">
                Facebook fiókkal
            </div>
            <a href="#" class="link" onclick="showForm('forgot-password-form')">Elfelejtette a jelszavát?</a>
            <a href="#" class="link" onclick="showForm('register-form')">Nincs fiókja? Regisztráljon!</a>
        </div>

        <!-- Jelszó-helyreállítási űrlap -->
        <div id="forgot-password-form" class="hidden">
            <div class="input-group">
                <label for="reset-email">Email cím</label>
                <input type="email" id="reset-email" placeholder="Adja meg az email címét">
            </div>
            <button class="btn" onclick="resetPasswordBtn()">Jelszó helyreállítása</button>
            <a href="#" class="link" onclick="showForm('login-form')">Vissza a belépéshez</a>
        </div>

        <!-- Regisztrációs űrlap -->
        <div id="register-form" class="hidden">
            <div class="input-group">
                <label for="register-email">Email cím</label>
                <input type="email" id="register-email" placeholder="Adja meg az email címét">
            </div>
            <div class="input-group">
                <label for="register-password">Jelszó</label>
                <input type="password" id="register-password" placeholder="Adja meg a jelszavát">
            </div>
            <button class="btn" onclick="registerBtn()">Regisztráció</button>
            <div style="margin: 1.5rem 0; color: #888;">vagy</div>
            <div class="social-btn google" onclick="googleLoginBtn()">Google fiókkal</div>
            <div class="social-btn facebook" onclick="facebookLoginBtn()">Facebook fiókkal</div>
            <div class="social-btn apple" onclick="appleLoginBtn()">Apple fiókkal</div>
            <a href="#" class="link" onclick="showForm('login-form')">Van már fiókja? Lépjen be!</a>
        </div>
        
        <!-- Be vagy már jelentkezve lap -->
        <div id="logged-in-message" class="hidden">
            <h3>Bejelentkeztél <span id="user-name"></span> néven! Belépés...</h3>
        </div>

    </div>

    <script>
        // Funkciók váltása
        function showForm(formId) {
            document.querySelectorAll('.container > div').forEach(form => form.classList.add('hidden'));
            document.getElementById(formId).classList.remove('hidden');
            document.getElementById('form-title').innerText = formId === 'register-form' ? 'Regisztráció' : formId === 'forgot-password-form' ? 'Jelszó-helyreállítás' : 'Bejelentkezés';
        }

        // Belépés
        function loginBtn() {
            // alert("Belépési folyamat...");
            loginWithEmail();
        }

        // Jelszó-helyreállítás
        function resetPasswordBtn() {
            //alert("Jelszó-helyreállítási folyamat...");
            resetPassword();
        }

        // Regisztráció
        function registerBtn() {
            //alert("Regisztrációs folyamat...");
            registerWithEmail();
        }

        // Google, Facebook bejelentkezések
        function googleLoginBtn() {
            //alert("Google bejelentkezés...");
            googleLogin();
        }

        function facebookLoginBtn() {
            //alert("Facebook bejelentkezés...");
            facebookLogin();
        }
      
    </script>
</body>
</html>
