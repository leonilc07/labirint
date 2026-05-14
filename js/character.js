// ============================================================
//  character.js  —  glavna logika igre
//  Tukaj je vse: karakter, trki, časovnik, ure, lestvica.
// ============================================================

// getElementById poišče HTML element po njegovem id="characterCanvas"
// canvas je "platno" — pravokotnik v katerega rišemo s kodo
const canvas = document.getElementById('characterCanvas');

// getContext('2d') nam da "čopič" s katerim rišemo na platno.
// Vse risalne ukaze (fillRect, arc, ...) kličemo na tem objektu ctx.
const ctx = canvas.getContext('2d');

// Slika ure — naložimo enkrat ob zagonu
const clockImg    = new Image();
clockImg.src      = 'img/clock.png';

const CLOCK_DRAW_SIZE = 20;   // velikost ure na canvasu (px)

// Tukaj bomo later shranili vse pike (piksle) labirinta.
// Na začetku je null (= nič / prazno) ker labirint še ni naložen.
let mazeImageData = null;

// ============================================================
//  KONSTANTE IGRE
//  To so vrednosti ki se med igro NE spremenijo.
//  Pišemo jih z VELIKIMI črkami da takoj vidimo da so konstante.
// ============================================================

const EXIT_Y             = 480;    // y-koordinata izhoda (piksel od vrha platna)
const COUNTDOWN_START_MS = 60000;  // začetni čas v milisekundah (60000 ms = 60 sekund)
const CLOCK_BONUS_MS     = 10000;  // bonus čas za vsako zbrano uro (10000 ms = 10 sekund)
const CLOCKS_COUNT       = 8;      // koliko ur postavimo v labirint
const BASE_SIZE          = 8;      // osnovna velikost karakterja v pikslih

// ============================================================
//  STANJE ČASOVNIKA
//  Te spremenljivke se med igro spreminjajoposodabljajo.
// ============================================================

// true/false vrednosti — ali časovnik teče, ali je igra končana
let timerRunning  = false;  // true ko igralec prvič premakne karakterja
let timerFinished = false;  // true ko igralec doseže izhod (zmaga)
let gameOver      = false;  // true ko čas poteče (poraz)

// Časovne vrednosti — shranjene v milisekundah
let timerStartMs     = 0;  // točen čas (ms) ko je časovnik začel teči
let timerElapsedMs   = 0;  // koliko ms je minilo od začetka
let countdownBonusMs = 0;  // skupaj bonus ms od zbranih ur

// ============================================================
//  URE ZA ZBIRANJE  —  vzporedna polja
//
//  Namesto enega polja objektov [{x,y,collected}, ...]
//  uporabimo tri ločena polja:
//    clockX[0]=100,  clockY[0]=200,  clockCollected[0]=false  → 1. ura
//    clockX[1]=300,  clockY[1]=150,  clockCollected[1]=true   → 2. ura (zbrana)
//    ...
//  clockCount pove koliko ur je trenutno v poljih.
// ============================================================

let clockX         = [];   // x-koordinate ur
let clockY         = [];   // y-koordinate ur
let clockCollected = [];   // ali je vsaka ura zbrana (true/false)
let clockCount     = 0;    // število ur v poljih

// ============================================================
//  KARAKTER  —  pozicija, velikost, hitrost, smer
// ============================================================

let charX      = 394;          // x-koordinata levega roba karakterja (v pikslih)
let charY      = 4;            // y-koordinata zgornjega roba karakterja
let charWidth  = BASE_SIZE;    // širina v pikslih
let charHeight = BASE_SIZE;    // višina v pikslih
let charSpeed  = 2;            // koliko piklov se premakne na en sličico
let charFacing = Math.PI / 2;  // kot v radianih, kamor gleda nos
                               // 0 = desno, PI/2 ≈ 1.57 = dol, PI = levo, 3*PI/2 = gor

// ============================================================
//  TIPKOVNICA  —  katere tipke so trenutno pritisnjene
//
//  Ko pritisnemo tipko → nastavimo na true.
//  Ko spustimo tipko   → nastavimo na false.
//  V gameLoop() potem preverimo te vrednosti vsak sličico.
// ============================================================

let keyUp    = false;  // gor  (ArrowUp ali W)
let keyDown  = false;  // dol  (ArrowDown ali S)
let keyLeft  = false;  // levo (ArrowLeft ali A)
let keyRight = false;  // desno (ArrowRight ali D)


// ============================================================
//  LESTVICA NAJBOLJŠIH ČASOV
// ============================================================

// Ključ pod katerim shranjujemo podatke v localStorage.
// localStorage je kot mali slovar ki si zapomni podatke med obiski strani.
const LEADERBOARD_KEY = 'speedmouse_times';

// Preberi shranjene čase iz localStorage.
// JSON.parse spremeni besedilo (npr. "[5000,12000]") nazaj v polje števil.
function loadLeaderboardTimes() {
    var saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved == null) {
        return [];  // Ni shranjenih časov — vrni prazno polje
    }
    return JSON.parse(saved);
}

// Shrani polje časov v localStorage.
// JSON.stringify naredi iz polja [5000,12000] besedilo "[5000,12000]"
// ker localStorage zna shraniti samo besedilo, ne polj.
function saveLeaderboardTimes(times) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(times));
}

// ============================================================
//  MEHURČNO UREJANJE  (Bubble Sort)
//
//  Uredi polje od najmanjšega do največjega.
//  Deluje tako da vsakič primerja sosednji dve vrednosti.
//  Če je leva večja od desne → ju zamenja.
//  Po vsakem polnem prehodu je največja vrednost "potisnjena"
//  na konec — kot mehurček ki se dviga na površje.
//
//  Primer: [30, 10, 20]
//  1. prehod: primerja 30↔10 → zameni → [10, 30, 20]
//             primerja 30↔20 → zameni → [10, 20, 30]
//  2. prehod: primerja 10↔20 → OK, ni zamene → [10, 20, 30]
//  Rezultat: [10, 20, 30] ✓
// ============================================================

function bubbleSort(times) {
    var n = times.length;  // dolžina polja

    // Zunanji for — koliko krat gremo čez celo polje.
    // i-krat je zadnjih i elementov že na pravem mestu,
    // zato gremo le do n-1-i.
    for (var i = 0; i < n - 1; i++) {

        // Notranji for — en prehod čez neurejen del polja
        for (var j = 0; j < n - 1 - i; j++) {

            // Primerjaj sosednji vrednosti
            if (times[j] > times[j + 1]) {
                // Leva je večja → zamenjaj ju s pomočjo začasne (temp) spremenljivke
                var temp     = times[j];
                times[j]     = times[j + 1];
                times[j + 1] = temp;
            }
        }
    }
    // Opomba: funkcija ne vrne ničesar — polje times je
    // spremenila neposredno (ista referenca v pomnilniku)
}

// Nariši lestvico v HTML tabelo
function renderLeaderboard(times) {
    // Poišči element <tbody id="leaderboardBody"> v HTML
    var tbody = document.getElementById('leaderboardBody');
    if (tbody == null) return;

    // Počisti staro vsebino tabele
    tbody.innerHTML = '';

    // Prikaži največ 5 rezultatov
    var maxShow = 5;
    if (times.length < maxShow) {
        maxShow = times.length;  // Če je manj kot 5, prikaži kolikor je
    }

    for (var i = 0; i < maxShow; i++) {
        // Ustvari novo vrstico <tr> v tabeli
        var tr = document.createElement('tr');

        // Nastavi vsebino vrstice: številka mesta in čas
        // (i+1) ker i začne pri 0, a prikazujemo 1, 2, 3...
        if (i == 0) {
            tr.classList.add('lb-best');
        }
        tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + formatTime(times[i]) + '</td>';

        // Dodaj vrstico v tabelo
        tbody.appendChild(tr);
    }
}

// Dodaj nov čas na lestvico, uredi, shrani in osveži prikaz
function addToLeaderboard(ms) {
    var times = loadLeaderboardTimes();  // naloži obstoječe čase
    times.push(ms);                      // dodaj novi čas na konec polja
    bubbleSort(times);                   // uredi od najhitrejšega do najpočasnejšega
    saveLeaderboardTimes(times);         // shrani nazaj v localStorage
    renderLeaderboard(times);            // osveži prikaz v HTML
}


// ============================================================
//  RESET IGRE  —  vse nazaj na začetek
// ============================================================

function resetGame() {
    // Ponastavi vse časovne spremenljivke
    timerRunning     = false;
    timerFinished    = false;
    gameOver         = false;
    timerStartMs     = 0;
    timerElapsedMs   = 0;
    countdownBonusMs = 0;

    // Ponastavi prikaz časovnika na začetnih 60 sekund
    // in odstrani CSS razrede za barve (rdeča/rumena)
    var timerEl = document.getElementById('timerDisplay');
    if (timerEl != null) {
        timerEl.textContent = formatTime(COUNTDOWN_START_MS);
        timerEl.classList.remove('timer-done');
        timerEl.classList.remove('timer-warning');
        timerEl.classList.remove('timer-danger');
    }

    // Vrni karakterja na začetni položaj
    charX      = 394;
    charY      = 4;
    charWidth  = BASE_SIZE;
    charHeight = BASE_SIZE;
    charFacing = Math.PI / 2;

    // Ponastavi drsnik za velikost in ga odkleni
    var sizeSlider = document.getElementById('sizeSlider');
    if (sizeSlider != null) {
        sizeSlider.value    = BASE_SIZE;
        sizeSlider.disabled = false;
    }
    var sizeValEl = document.getElementById('sizeVal');
    if (sizeValEl != null) {
        sizeValEl.textContent = BASE_SIZE;
    }

    // Ponastavi drsnik za hitrost in ga odkleni
    var speedSlider = document.getElementById('speedSlider');
    if (speedSlider != null) {
        speedSlider.value    = 2;
        speedSlider.disabled = false;
        charSpeed = 2;
    }
    var speedValEl = document.getElementById('speedVal');
    if (speedValEl != null) {
        speedValEl.textContent = '2.0';
    }

    // Znova postavi ure v labirint in posodobi prikaz
    generateClocks(CLOCKS_COUNT);
    updateClocksDisplay();
    drawCharacter();
}


// ============================================================
//  FORMATIRANJE ČASA
//
//  Pretvori milisekunde v berljiv niz "mm:ss:ss"
//  Primer: 75430 ms → "01:15:43"
//                       1 min 15 sek 43 stotink
// ============================================================

function formatTime(ms) {
    // Pretvori ms v stotinke sekunde (1 sekunda = 100 stotink)
    var totalHundredths = Math.floor(ms / 10);

    // Stotinke = ostanek pri deljenju s 100 (le zadnji dve mesti)
    // Primer: 7543 stotink → 7543 % 100 = 43
    var hh = totalHundredths % 100;

    // Pretvori ms v sekunde (zaokroži navzdol)
    var totalSecs = Math.floor(ms / 1000);

    // Sekunde = ostanek pri deljenju s 60 (le zadnji dve mesti)
    // Primer: 75 sekund → 75 % 60 = 15
    var ss = totalSecs % 60;

    // Minute = celoštevilsko deljenje sekund s 60
    var mm = Math.floor(totalSecs / 60);

    // padStart(2, '0') doda vodilno ničlo če je število enomestno
    // Primer: 5 → '05',  1 → '01',  12 → '12'
    var mmStr = String(mm).padStart(2, '0');
    var ssStr = String(ss).padStart(2, '0');
    var hhStr = String(hh).padStart(2, '0');

    return mmStr + ':' + ssStr + ':' + hhStr;
}


// ============================================================
//  PREOSTALI ČAS
//
//  Vrne koliko ms je še ostalo do konca.
//  Upošteva bonus čas od zbranih ur.
// ============================================================

function getTimeRemaining() {
    // Če igra še ni začela, vrni polnih 60 sekund
    if (!timerRunning && !timerFinished && !gameOver) {
        return COUNTDOWN_START_MS;
    }

    // Preostali čas = začetni čas + bonus - minuli čas
    var remaining = COUNTDOWN_START_MS + countdownBonusMs - timerElapsedMs;

    // Ne vrni negativne vrednosti
    if (remaining < 0) {
        remaining = 0;
    }
    return remaining;
}


// ============================================================
//  KONEC IGRE (PORAZ)  —  čas je potekel
// ============================================================

function triggerGameOver() {
    // Zaščita: ne pokliči dvakrat
    if (gameOver || timerFinished) return;

    timerRunning   = false;                              // ustavi štetje
    gameOver       = true;                               // označi poraz
    timerElapsedMs = COUNTDOWN_START_MS + countdownBonusMs;  // nastavi čas na nič

    // Obarva prikaz časovnika rdeče
    var timerEl = document.getElementById('timerDisplay');
    if (timerEl != null) {
        timerEl.textContent = formatTime(0);
        timerEl.classList.remove('timer-warning');
        timerEl.classList.add('timer-danger');
    }

    // Preštej koliko ur je bilo zbranih
    var collected = 0;
    for (var i = 0; i < clockCount; i++) {
        if (clockCollected[i]) {
            collected++;
        }
    }

    // setTimeout počaka 200ms preden prikaže pojavno okno.
    // Brez tega bi okno poskusilo odpreti se preden browser
    // konča izrisati zadnji sličici.
    setTimeout(function() {
        Swal.fire({
            title: '<span style="font-family:Orbitron,sans-serif;color:#e74c3c">UJETA!</span>',
            html: '<div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">' +
                  '<p style="font-size:1.1rem;color:#e74c3c;margin-bottom:8px">&#9201; Čas je potekel!</p>' +
                  '<p>Vrata laboratorija so se zaprla.</p>' +
                  '<p style="color:#888;font-size:0.85rem;margin-top:6px">Nibbles ni uspela pravočasno pobegniti...</p>' +
                  '<hr style="border-color:#3CB04333;margin:10px 0">' +
                  '<p style="color:#FFD700;font-size:0.9rem">Zbrane ure: <b style="color:#fff">' + collected + ' / ' + CLOCKS_COUNT + '</b></p>' +
                  '</div>',
            background: '#0d0d18',
            color: '#ccc',
            confirmButtonText: 'Poskusi znova',
            confirmButtonColor: '#e74c3c',
            width: '400px',
            customClass: { popup: 'swal-game-popup' }
        }).then(function() { resetGame(); });  // po kliku na gumb: ponastavi igro
    }, 200);
}


// ============================================================
//  RISANJE IKONE URE
//
//  Nariše uro (clock.png) na koordinatah (x, y), centriran.
// ============================================================

function drawClockIcon(x, y) {
    var half = CLOCK_DRAW_SIZE / 2;
    ctx.drawImage(clockImg, x - half, y - half, CLOCK_DRAW_SIZE, CLOCK_DRAW_SIZE);
}



// ============================================================
//  GENERIRANJE UR
//
//  Postavi n ur na naključna prosta mesta v labirintu.
//  "Prosto mesto" pomeni: ne na zidu, ne preblizu vhoda/izhoda,
//  in ne preblizu druge ure.
// ============================================================

function generateClocks(n) {
    // Počisti stara polja — začnemo znova
    clockX         = [];
    clockY         = [];
    clockCollected = [];
    clockCount     = 0;

    // Brez podatkov o labirintu ne moremo vedeti kje so zidovi
    if (mazeImageData == null) return;

    var margin       = 20;    // minimalna razdalja od roba canvasa (pikslih)
    var minDistApart = 60;    // minimalna razdalja med dvema urama (pikslih)
    var maxAttempts  = 10000; // varnostna meja — ne vrtimo neskončno
    var attempts     = 0;

    // Vrtimo dokler nimamo n ur ALI dokler ne prekoračimo maxAttempts
    while (clockCount < n && attempts < maxAttempts) {
        attempts++;

        // Izberi naključno točko znotraj platna (z odmikom od roba)
        var x = margin + Math.floor(Math.random() * (canvas.width  - 2 * margin));
        var y = margin + Math.floor(Math.random() * (canvas.height - 2 * margin));

        // Preskoči če je točka na zidu
        if (isWall(x, y)) continue;

        // Preskoči če je točka preblizu zidu (ura mora biti v hodniku)
        if (isWall(x + 4, y) || isWall(x - 4, y) || isWall(x, y + 4) || isWall(x, y - 4)) continue;

        // Preskoči območje vhoda (vrh) in izhoda (dno)
        if (y < 40 || y > canvas.height - 40) continue;

        // Preveri razdaljo do vsake že postavljene ure
        var tooClose = false;
        for (var i = 0; i < clockCount; i++) {
            // Pitagorov izrek: razdalja = sqrt(dx² + dy²)
            var dx   = clockX[i] - x;
            var dy   = clockY[i] - y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistApart) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        // Vse preveritve opravljene → shrani uro v polja
        clockX[clockCount]         = x;
        clockY[clockCount]         = y;
        clockCollected[clockCount] = false;  // še ni zbrana
        clockCount++;
    }
}

// Posodobi napis "X / 8" v stranskem panelu
function updateClocksDisplay() {
    var el = document.getElementById('clocksDisplay');
    if (el == null) return;

    var collected = 0;
    for (var i = 0; i < clockCount; i++) {
        if (clockCollected[i]) {
            collected++;
        }
    }
    el.textContent = collected + ' / ' + CLOCKS_COUNT;
}


// ============================================================
//  POSODOBI PRIKAZ ČASOVNIKA
//
//  Kliče se vsako sličico iz gameLoop().
//  Izračuna preostali čas in ga prikaže v HTML.
//  Sproži gameOver() če čas pade na 0.
// ============================================================

function updateTimerDisplay() {
    var el = document.getElementById('timerDisplay');
    if (el == null) return;

    // Izračunaj koliko ms je minilo (samo ko tekač teče)
    if (timerRunning) {
        // Date.now() vrne trenutni čas v ms od 1. 1. 1970
        // Razlika = koliko ms je minilo od začetka
        timerElapsedMs = Date.now() - timerStartMs;
    }

    var remaining = getTimeRemaining();
    el.textContent = formatTime(remaining);

    // Odstrani vse barvne razrede in dodaj ustreznega
    el.classList.remove('timer-done');
    el.classList.remove('timer-warning');
    el.classList.remove('timer-danger');

    if (timerFinished) {
        el.classList.add('timer-done');              // zelena — zmaga
    } else if (timerRunning && remaining <= 10000) {
        el.classList.add('timer-danger');            // rdeča — manj kot 10s
    } else if (timerRunning && remaining <= 20000) {
        el.classList.add('timer-warning');           // rumena — manj kot 20s
    }

    // Če je čas potekel, sproži poraz
    if (timerRunning && !timerFinished && remaining <= 0) {
        triggerGameOver();
    }
}


// ============================================================
//  RISANJE KARAKTERJA
//
//  Vsako sličico (60x na sekundo) počistimo platno in ga
//  narišemo znova na novi poziciji — to ustvari animacijo.
// ============================================================

function drawCharacter() {
    // Počisti vse na characterCanvas platnu
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nariši vse ure ki še niso zbrane
    for (var i = 0; i < clockCount; i++) {
        if (!clockCollected[i]) {
            drawClockIcon(clockX[i], clockY[i]);
        }
    }

    // Izračunaj center in polovice dimenzij karakterja
    // (potrebujemo za rotacijo okrog centra)
    var cx = charX + charWidth  / 2;   // x-koordinata centra
    var cy = charY + charHeight / 2;   // y-koordinata centra
    var hw = charWidth  / 2;           // polovica širine
    var hh = charHeight / 2;           // polovica višine

    ctx.save();              // shrani stanje (da rotacija ne vpliva na ostalo)
    ctx.translate(cx, cy);  // premakni izhodišče na center karakterja
    ctx.rotate(charFacing); // zavrti koordinatni sistem za kot charFacing

    // Po rotaciji je +x smer "naprej" (nos)
    // Nariši telo — pravokotnik centriran na (0,0)
    ctx.fillStyle = '#3CB043';   // zelena barva
    ctx.fillRect(-hw, -hh, charWidth, charHeight);

    // Nariši nos — polkrog na desni strani (+x = naprej po rotaciji)
    // arc(cx, cy, polmer, začetni kot, končni kot, smer)
    // Math.PI/2 do -Math.PI/2 v smeri urinega kazalca = desna polovica kroga
    ctx.fillStyle = '#3CB043';
    ctx.beginPath();
    ctx.arc(hw, 0, hh, Math.PI / 2, -Math.PI / 2, true);
    ctx.fill();

    ctx.restore();  // obnovi stanje risanja
}


// ============================================================
//  ZAZNAVANJE TRKOV
// ============================================================

// Preveri ali je piksel na koordinatah (x, y) del zidu.
// Naloži barvo piksla iz mazeImageData in jo razloži.
function isWall(x, y) {
    // Zaokroži na celo število (piksli so cela števila)
    x = Math.floor(x);
    y = Math.floor(y);

    // Če podatki niso naloženi ali smo izven meja → obravnavaj kot zid
    if (mazeImageData == null || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return true;
    }

    // Izračunaj položaj tega piksla v dolgem polju.
    // Polje je: [R,G,B,A, R,G,B,A, R,G,B,A, ...]
    // Vsaka vrstica ima canvas.width piklov, vsak piksel = 4 vrednosti.
    // Torej: piksel na (x, y) je na indeksu (y * širina + x) * 4
    var index = (y * canvas.width + x) * 4;

    var r = mazeImageData.data[index];      // rdeča komponenta (0-255)
    var g = mazeImageData.data[index + 1];  // zelena komponenta (0-255)
    var b = mazeImageData.data[index + 2];  // modra komponenta  (0-255)
    var a = mazeImageData.data[index + 3];  // prosojnost        (0-255)

    // Zid je rdeč (r visok, g in b nizka) in ni prozoren.
    // Prosta pot je črna (r=0, g=0, b=0).
    return a > 100 && (r > 80 || g > 80 || b > 80);
}

// Preveri ali se karakter na novi poziciji (newX, newY) dotika zidu.
// Gleda 4 kotičke pravokotnika + sredino nosne stranice (5 točk skupaj).
function canMove(newX, newY) {
    // Horizontalne meje — ne sme izven platna levo/desno
    if (newX < 0 || newX + charWidth > canvas.width) return false;

    // Navpične meje:
    //   - nad platnom: dovoli do -40 (pred vhodom)
    //   - pod platnom: dovoli (tam je izhod)
    if (newY < -40) return false;
    if (newY + charHeight <= 0 || newY >= canvas.height) return true;

    // Če podatki o labirintu niso naloženi, dovoli vse
    if (mazeImageData == null) return true;

    // Preveri vse 4 kotičke pravokotnika karakterja
    //
    //  (newX, newY) -------- (newX+charWidth, newY)
    //       |                          |
    //  (newX, newY+charHeight) - (newX+charWidth, newY+charHeight)
    //
    if (isWall(newX,             newY             )) return false;  // zgornji levi
    if (isWall(newX + charWidth, newY             )) return false;  // zgornji desni
    if (isWall(newX,             newY + charHeight)) return false;  // spodnji levi
    if (isWall(newX + charWidth, newY + charHeight)) return false;  // spodnji desni

    // Preveri konico nosa.
    // Nos je polkrog z radijem hh = charHeight/2, pritrjen na sprednji rob telesa.
    // Sprednji rob telesa je hw = charWidth/2 od centra → konica je hw + hh od centra.
    // Math.cos/sin(charFacing) da enotni vektor v smeri gledanja.
    const noseCx   = newX + charWidth  / 2;
    const noseCy   = newY + charHeight / 2;
    const noseTipX = Math.round(noseCx + Math.cos(charFacing) * (charWidth / 2 + charHeight / 2));
    const noseTipY = Math.round(noseCy + Math.sin(charFacing) * (charWidth / 2 + charHeight / 2));
    if (isWall(noseTipX, noseTipY)) return false;

    return true;  // vse točke so proste — premik je dovoljen
}


// ============================================================
//  PREMIKANJE KARAKTERJA
//
//  dx = želeni premik v pikslih vodoravno (negativen = levo)
//  dy = želeni premik v pikslih navpično  (negativen = gor)
// ============================================================

function moveCharacter(dx, dy) {
    // Blokiraj premikanje ko je igra končana
    if (gameOver || timerFinished) return;

    // Posodobi smer karakterja (kamor gleda nos).
    // Math.atan2(dy, dx) vrne kot vektorja (dx, dy) v radianih.
    if (dx != 0 || dy != 0) {
        charFacing = Math.atan2(dy, dx);
    }

    // Začni časovnik pri prvem premiku in zakleni drsnike
    if (!timerRunning && !timerFinished) {
        timerRunning = true;
        timerStartMs = Date.now();  // zapomni si točen začetni čas
        var sizeSlider  = document.getElementById('sizeSlider');
        var speedSlider = document.getElementById('speedSlider');
        if (sizeSlider  != null) sizeSlider.disabled  = true;
        if (speedSlider != null) speedSlider.disabled = true;
    }

    // Razdeli premik na manjše korake po 1 piksel.
    // To prepreči "tunneling" — da bi karakter pri visoki hitrosti
    // preskočil čez tanek zid.
    // Primer: hitrost = 3 → steps = 3, vsak korak = 1 piksel
    var steps = Math.ceil(Math.abs(dx));
    if (Math.ceil(Math.abs(dy)) > steps) {
        steps = Math.ceil(Math.abs(dy));
    }
    if (steps < 1) steps = 1;

    var stepX = dx / steps;  // koliko piklov na korak vodoravno
    var stepY = dy / steps;  // koliko piklov na korak navpično

    for (var s = 0; s < steps; s++) {
        var nextX = charX + stepX;
        var nextY = charY + stepY;

        if (canMove(nextX, nextY)) {
            // Oba premika skupaj delujeta → premakni diagonalno
            charX = nextX;
            charY = nextY;
        } else {
            // Skupni premik je blokiran → poskusi vsako os posebej
            // (drsenje vzdolž stene)

            var movedX = canMove(nextX, charY);  // samo vodoravni premik
            if (movedX) charX = nextX;

            var movedY = canMove(charX, nextY);  // samo navpični premik
            if (movedY) charY = nextY;

            // Če nobena os ni možna → karakter je popolnoma blokiran
            if (!movedX && !movedY) break;
        }
    }

    // Preveri zbiranje ur
    var charCx = charX + charWidth  / 2;   // center karakterja x
    var charCy = charY + charHeight / 2;   // center karakterja y

    for (var i = 0; i < clockCount; i++) {
        if (!clockCollected[i]) {
            // Razdalja med centrom karakterja in uro (Pitagorov izrek)
            var ddx  = charCx - clockX[i];
            var ddy  = charCy - clockY[i];
            var dist = Math.sqrt(ddx * ddx + ddy * ddy);

            if (dist < 12) {
                // Karakter je dovolj blizu ure → zberi jo
                clockCollected[i] = true;
                countdownBonusMs += CLOCK_BONUS_MS;  // dodaj bonus čas
                updateClocksDisplay();

                // Prikaži majhno obvestilo v kotu zaslona (toast)
                Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1400,
                    background: '#0d0d18',
                    color: '#FFD700',
                }).fire({ icon: 'success', title: '+10 sekund!' });
            }
        }
    }

    // Preveri zmago — karakter je prečkal spodnjo mejo (izhod)
    if (timerRunning && !timerFinished && !gameOver && charY + charHeight >= EXIT_Y) {
        timerRunning   = false;
        timerFinished  = true;
        timerElapsedMs = Date.now() - timerStartMs;  // izračunaj končni čas
        addToLeaderboard(timerElapsedMs);             // dodaj na lestvico

        var remaining = getTimeRemaining();
        var collected = 0;
        for (var i = 0; i < clockCount; i++) {
            if (clockCollected[i]) collected++;
        }

        setTimeout(function() {
            Swal.fire({
                title: '<span style="font-family:Orbitron,sans-serif;color:#3CB043">POBEGLA! &#127881;</span>',
                html: '<div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">' +
                      '<p style="color:#3CB043;font-size:1rem">Nibbles je pobegnila!</p>' +
                      '<hr style="border-color:#3CB04333;margin:10px 0">' +
                      '<p>&#9201; Porabljen čas: <b style="color:#fff">' + formatTime(timerElapsedMs) + '</b></p>' +
                      '<p>&#9201; Preostali čas: <b style="color:#FFD700">' + formatTime(remaining) + '</b></p>' +
                      '<p>&#128336; Zbrane ure: <b style="color:#FFD700">' + collected + ' / ' + CLOCKS_COUNT + '</b></p>' +
                      '</div>',
                background: '#0d0d18',
                color: '#ccc',
                confirmButtonText: 'Igraj znova',
                confirmButtonColor: '#3CB043',
                width: '400px',
                customClass: { popup: 'swal-game-popup' }
            }).then(function() { resetGame(); });
        }, 200);
    }

    // Na koncu vsakega premika znova nariši platno
    drawCharacter();
}


// ============================================================
//  IGRA ZANKA  (Game Loop)
//
//  requestAnimationFrame pove brskalniku: "pokliči gameLoop()
//  pred naslednjim izrisom zaslona". Brskalnik to naredi
//  ~60x na sekundo. Tako dobimo gladko animacijo.
//
//  Vsako sličico:
//  1. Preveri katere tipke so pritisnjene
//  2. Izračunaj dx, dy
//  3. Premakni karakterja
//  4. Posodobi prikaz časovnika
//  5. Zahtevaj naslednjo sličico
// ============================================================

function gameLoop() {
    var dx = 0;   // premik levo/desno (- = levo, + = desno)
    var dy = 0;   // premik gor/dol   (- = gor,  + = dol)

    if (keyUp)    dy = -charSpeed;
    if (keyDown)  dy =  charSpeed;
    if (keyLeft)  dx = -charSpeed;
    if (keyRight) dx =  charSpeed;

    // Diagonalno gibanje: brez korekcije bi bil karakter hitrejši
    // po diagonali (sqrt(2) ≈ 1.41x hitreje).
    // Normalizacija: deli hitrost s sqrt(2) da ohranimo enako hitrost.
    // Primer: speed=2, norm=2/sqrt(2)≈1.41 — skupna razdalja ostane 2.
    if (dx != 0 && dy != 0) {
        var norm = charSpeed / Math.sqrt(2);
        if (dx > 0) dx =  norm; else dx = -norm;
        if (dy > 0) dy =  norm; else dy = -norm;
    }

    if (dx != 0 || dy != 0) {
        moveCharacter(dx, dy);  // premakni karakterja (in nariši)
    } else {
        drawCharacter();         // stoji — samo nariši (ure se vrtijo)
    }

    updateTimerDisplay();         // osveži prikaz časa

    // Zahtevaj klic te iste funkcije pred naslednjo sličico
    requestAnimationFrame(gameLoop);
}


// ============================================================
//  TIPKOVNICA
//
//  addEventListener posluša za dogodke (events) na oknu.
//  'keydown' = tipka pritisnjena, 'keyup' = tipka sproščena.
//  e.key je ime tipke kot niz (npr. 'ArrowUp', 'w', 'W').
//  e.preventDefault() prepreči privzeto dejanje brskalnika
//  (npr. scrollanje strani z puščičnimi tipkami).
// ============================================================

window.addEventListener('keydown', function(e) {
    if (e.key == 'ArrowUp'    || e.key == 'w' || e.key == 'W') { keyUp    = true; e.preventDefault(); }
    if (e.key == 'ArrowDown'  || e.key == 's' || e.key == 'S') { keyDown  = true; e.preventDefault(); }
    if (e.key == 'ArrowLeft'  || e.key == 'a' || e.key == 'A') { keyLeft  = true; e.preventDefault(); }
    if (e.key == 'ArrowRight' || e.key == 'd' || e.key == 'D') { keyRight = true; e.preventDefault(); }
});

window.addEventListener('keyup', function(e) {
    if (e.key == 'ArrowUp'    || e.key == 'w' || e.key == 'W') keyUp    = false;
    if (e.key == 'ArrowDown'  || e.key == 's' || e.key == 'S') keyDown  = false;
    if (e.key == 'ArrowLeft'  || e.key == 'a' || e.key == 'A') keyLeft  = false;
    if (e.key == 'ArrowRight' || e.key == 'd' || e.key == 'D') keyRight = false;
});


// ============================================================
//  NALAGANJE PODATKOV O LABIRINTU
//
//  Ko se stran naloži, labirint (SVG) se šele začne risati.
//  Ta funkcija čaka dokler ni labirint dejansko namaljan
//  na mazeCanvas, nato shrani kopijo vseh piklov v mazeImageData.
//  Ta kopija je "snapshot" — zamrznjena slika labirinta
//  ki jo isWall() kasneje bere za zaznavanje trkov.
// ============================================================

function loadMazeCollisionData() {
    var mazeCanvas = document.getElementById('mazeCanvas');

    // setInterval deluje kot ponavljajoča ura:
    // vsake 100 milisekund pokliče spodnjo funkcijo,
    // dokler je ne ustavimo s clearInterval.
    var checkInterval = setInterval(function() {

        // getContext('2d') nam da dostop do orodij za branje canvasa
        var mazeCtx = mazeCanvas.getContext('2d');

        // getImageData prebere VSE piksle iz canvasa v eno dolgo polje.
        // Vsak piksel zasede 4 mesta zaporedoma: [ R, G, B, A, R, G, B, A, ... ]
        //   R = rdeča (0-255),  G = zelena,  B = modra,  A = prosojnost
        // Parametri: začetek x=0, y=0, širina, višina canvasa
        var imageData = mazeCtx.getImageData(0, 0, mazeCanvas.width, mazeCanvas.height);

        // Preverimo ali je labirint že namaljan.
        // Iščemo rdeč piksel — zidovi so rdeče barve.
        // i += 4 ker en piksel = 4 vrednosti (R,G,B,A)
        var hasPainted = false;
        for (var i = 0; i < imageData.data.length; i += 4) {
            var R = imageData.data[i];      // rdeča komponenta tega piksla
            var G = imageData.data[i + 1];  // zelena komponenta tega piksla
            var B = imageData.data[i + 2];  // modra komponenta tega piksla
            if (R > 200 && G < 50 && B < 50) {
                hasPainted = true;  // našli smo rdeč piksel = zid je namaljan
                break;
            }
        }

        if (hasPainted) {
            clearInterval(checkInterval);  // ustavi ponavljajočo uro
            mazeImageData = imageData;     // shrani snapshot piklov za trke
            generateClocks(CLOCKS_COUNT);  // postavi ure zdaj ko vemo kje so zidovi
            updateClocksDisplay();
        }
    }, 100);  // preverjaj vsakih 100ms
}


// ============================================================
//  ZAČETEK
//
//  'load' se sproži ko je HTML stran v celoti naložena.
//  Šele takrat so vsi elementi (canvas, tabela...) na voljo.
// ============================================================

window.addEventListener('load', function() {
    renderLeaderboard(loadLeaderboardTimes());  // prikaži shranjene čase
    drawCharacter();                            // nariši karakterja na začetni poziciji
    gameLoop();                                 // začni igro zanko (~60 sličic/sek)
    loadMazeCollisionData();                    // začni čakati na labirint
    setTimeout(showStoryIntro, 600);            // po 600ms prikaži uvodno okno
});
