var canvas = document.getElementById('characterCanvas');
var ctx = canvas.getContext('2d');

var mazeImageData = null;

// --- Konstante igre ---
var EXIT_Y             = 480;    // izhod na dnu labirinta
var COUNTDOWN_START_MS = 60000;  // 60 sekund
var CLOCK_BONUS_MS     = 10000;  // +10s za vsako zbrano uro
var CLOCKS_COUNT       = 8;      // število ur v labirintu
var BASE_SIZE          = 8;      // osnovna velikost karakterja

// --- Stanje časovnika ---
var timerRunning     = false;
var timerFinished    = false;
var gameOver         = false;
var timerStartMs     = 0;
var timerElapsedMs   = 0;
var countdownBonusMs = 0;

// --- Ure za zbiranje (vzporedna polja) ---
var clockX         = [];
var clockY         = [];
var clockCollected = [];
var clockCount     = 0;

// --- Karakter ---
var charX      = 394;
var charY      = 4;
var charWidth  = BASE_SIZE;
var charHeight = BASE_SIZE;
var charSpeed  = 2;
var charFacing = Math.PI / 2;   // 0 = desno, PI/2 = dol

// --- Tipkovnica ---
var keyUp    = false;
var keyDown  = false;
var keyLeft  = false;
var keyRight = false;

// ========== LESTVICA ==========

var LEADERBOARD_KEY = 'speedmouse_times';

function loadLeaderboardTimes() {
    var saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved == null) {
        return [];
    }
    return JSON.parse(saved);
}

function saveLeaderboardTimes(times) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(times));
}

// Mehurčno urejanje - uredi polje od najmanjšega do največjega
function bubbleSort(times) {
    var n = times.length;
    for (var i = 0; i < n - 1; i++) {
        for (var j = 0; j < n - 1 - i; j++) {
            if (times[j] > times[j + 1]) {
                var temp   = times[j];
                times[j]   = times[j + 1];
                times[j + 1] = temp;
            }
        }
    }
}

function renderLeaderboard(times) {
    var tbody = document.getElementById('leaderboardBody');
    if (tbody == null) return;
    tbody.innerHTML = '';

    var maxShow = 5;
    if (times.length < maxShow) {
        maxShow = times.length;
    }

    for (var i = 0; i < maxShow; i++) {
        var tr = document.createElement('tr');
        if (i == 0) {
            tr.classList.add('lb-best');
        }
        tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + formatTime(times[i]) + '</td>';
        tbody.appendChild(tr);
    }
}

function addToLeaderboard(ms) {
    var times = loadLeaderboardTimes();
    times.push(ms);
    bubbleSort(times);
    saveLeaderboardTimes(times);
    renderLeaderboard(times);
}

function resetGame() {
    timerRunning     = false;
    timerFinished    = false;
    gameOver         = false;
    timerStartMs     = 0;
    timerElapsedMs   = 0;
    countdownBonusMs = 0;

    var timerEl = document.getElementById('timerDisplay');
    if (timerEl != null) {
        timerEl.textContent = formatTime(COUNTDOWN_START_MS);
        timerEl.classList.remove('timer-done');
        timerEl.classList.remove('timer-warning');
        timerEl.classList.remove('timer-danger');
    }

    charX      = 394;
    charY      = 4;
    charWidth  = BASE_SIZE;
    charHeight = BASE_SIZE;
    charFacing = Math.PI / 2;

    var sizeSlider  = document.getElementById('sizeSlider');
    var speedSlider = document.getElementById('speedSlider');
    if (sizeSlider != null) {
        sizeSlider.value    = BASE_SIZE;
        sizeSlider.disabled = false;
    }
    var sizeValEl = document.getElementById('sizeVal');
    if (sizeValEl != null) {
        sizeValEl.textContent = BASE_SIZE;
    }
    if (speedSlider != null) {
        speedSlider.value    = 2;
        speedSlider.disabled = false;
        charSpeed = 2;
    }
    var speedValEl = document.getElementById('speedVal');
    if (speedValEl != null) {
        speedValEl.textContent = '2.0';
    }

    generateClocks(CLOCKS_COUNT);
    updateClocksDisplay();
    drawCharacter();
}

function formatTime(ms) {
    var totalHundredths = Math.floor(ms / 10);
    var hh = totalHundredths % 100;
    var totalSecs = Math.floor(ms / 1000);
    var ss = totalSecs % 60;
    var mm = Math.floor(totalSecs / 60);
    var mmStr = String(mm).padStart(2, '0');
    var ssStr = String(ss).padStart(2, '0');
    var hhStr = String(hh).padStart(2, '0');
    return mmStr + ':' + ssStr + ':' + hhStr;
}

function getTimeRemaining() {
    if (!timerRunning && !timerFinished && !gameOver) {
        return COUNTDOWN_START_MS;
    }
    var remaining = COUNTDOWN_START_MS + countdownBonusMs - timerElapsedMs;
    if (remaining < 0) {
        remaining = 0;
    }
    return remaining;
}

function triggerGameOver() {
    if (gameOver || timerFinished) return;
    timerRunning   = false;
    gameOver       = true;
    timerElapsedMs = COUNTDOWN_START_MS + countdownBonusMs;

    var timerEl = document.getElementById('timerDisplay');
    if (timerEl != null) {
        timerEl.textContent = formatTime(0);
        timerEl.classList.remove('timer-warning');
        timerEl.classList.add('timer-danger');
    }

    var collected = 0;
    for (var i = 0; i < clockCount; i++) {
        if (clockCollected[i]) {
            collected++;
        }
    }

    setTimeout(function() {
        Swal.fire({
            title: '<span style="font-family:Orbitron,sans-serif;color:#e74c3c">CAUGHT!</span>',
            html: '<div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">' +
                  '<p style="font-size:1.1rem;color:#e74c3c;margin-bottom:8px">&#9201; Time\'s up!</p>' +
                  '<p>The lab doors have sealed shut.</p>' +
                  '<p style="color:#888;font-size:0.85rem;margin-top:6px">Nibbles didn\'t make it out in time...</p>' +
                  '<hr style="border-color:#3CB04333;margin:10px 0">' +
                  '<p style="color:#FFD700;font-size:0.9rem">Clocks collected: <b style="color:#fff">' + collected + ' / ' + CLOCKS_COUNT + '</b></p>' +
                  '</div>',
            background: '#0d0d18',
            color: '#ccc',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#e74c3c',
            width: '400px',
            customClass: { popup: 'swal-game-popup' }
        }).then(function() { resetGame(); });
    }, 200);
}

function drawClockIcon(x, y) {
    var r = 7;
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#FFD700';

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1400';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.4, -r * 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r * 0.65);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function generateClocks(n) {
    clockX         = [];
    clockY         = [];
    clockCollected = [];
    clockCount     = 0;

    if (mazeImageData == null) return;

    var margin       = 20;
    var minDistApart = 60;
    var maxAttempts  = 10000;
    var attempts     = 0;

    while (clockCount < n && attempts < maxAttempts) {
        attempts++;
        var x = margin + Math.floor(Math.random() * (canvas.width  - 2 * margin));
        var y = margin + Math.floor(Math.random() * (canvas.height - 2 * margin));

        if (isWall(x, y)) continue;
        if (isWall(x + 4, y) || isWall(x - 4, y) || isWall(x, y + 4) || isWall(x, y - 4)) continue;
        if (y < 40 || y > canvas.height - 40) continue;

        // Preveri, da ni preblizu obstoječe ure
        var tooClose = false;
        for (var i = 0; i < clockCount; i++) {
            var dx = clockX[i] - x;
            var dy = clockY[i] - y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistApart) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        clockX[clockCount]         = x;
        clockY[clockCount]         = y;
        clockCollected[clockCount] = false;
        clockCount++;
    }
}

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

function updateTimerDisplay() {
    var el = document.getElementById('timerDisplay');
    if (el == null) return;
    if (timerRunning) {
        timerElapsedMs = Date.now() - timerStartMs;
    }
    var remaining = getTimeRemaining();
    el.textContent = formatTime(remaining);

    el.classList.remove('timer-done');
    el.classList.remove('timer-warning');
    el.classList.remove('timer-danger');
    if (timerFinished) {
        el.classList.add('timer-done');
    } else if (timerRunning && remaining <= 10000) {
        el.classList.add('timer-danger');
    } else if (timerRunning && remaining <= 20000) {
        el.classList.add('timer-warning');
    }

    if (timerRunning && !timerFinished && remaining <= 0) {
        triggerGameOver();
    }
}

// ========== RISANJE KARAKTERJA ==========

function drawCharacter() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nariši ure
    for (var i = 0; i < clockCount; i++) {
        if (!clockCollected[i]) {
            drawClockIcon(clockX[i], clockY[i]);
        }
    }

    // Sredina karakterja
    var cx = charX + charWidth  / 2;
    var cy = charY + charHeight / 2;
    var hw = charWidth  / 2;
    var hh = charHeight / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(charFacing);

    // Telo pravokotnik
    ctx.fillStyle = '#3CB043';
    ctx.fillRect(-hw, -hh, charWidth, charHeight);

    // Nos - polkrog na sprednji strani (+x pred rotacijo)
    ctx.fillStyle = '#3CB043';
    ctx.beginPath();
    ctx.arc(hw, 0, hh, Math.PI / 2, -Math.PI / 2, true);
    ctx.fill();

    ctx.restore();
}

// ========== ZAZNAVANJE TRKOV ==========

function isWall(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);

    if (mazeImageData == null || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return true;
    }

    var index = (y * canvas.width + x) * 4;
    var r = mazeImageData.data[index];
    var g = mazeImageData.data[index + 1];
    var b = mazeImageData.data[index + 2];
    var a = mazeImageData.data[index + 3];

    return a > 100 && (r > 80 || g > 80 || b > 80);
}

// Preveri 4 kotičke pravokotnika in sredino nosne stranice
function canMove(newX, newY) {
    // Horizontalne meje platna
    if (newX < 0 || newX + charWidth > canvas.width) return false;

    // Navpične meje - dovoli malo nad platnom in pod platnom (izhod)
    if (newY < -40) return false;
    if (newY + charHeight <= 0 || newY >= canvas.height) return true;

    if (mazeImageData == null) return true;

    // Preveri 4 kotičke pravokotnika
    if (isWall(newX,              newY             )) return false;  // zgornji levi
    if (isWall(newX + charWidth,  newY             )) return false;  // zgornji desni
    if (isWall(newX,              newY + charHeight)) return false;  // spodnji levi
    if (isWall(newX + charWidth,  newY + charHeight)) return false;  // spodnji desni

    // Preveri sredino nosne (sprednje) stranice
    var noseMidX = Math.round(newX + charWidth  / 2 + Math.cos(charFacing) * charWidth  / 2);
    var noseMidY = Math.round(newY + charHeight / 2 + Math.sin(charFacing) * charHeight / 2);
    if (isWall(noseMidX, noseMidY)) return false;

    return true;
}

// ========== PREMIKANJE ==========

function moveCharacter(dx, dy) {
    if (gameOver || timerFinished) return;

    // Posodobi smer, kamor gleda karakter
    if (dx != 0 || dy != 0) {
        charFacing = Math.atan2(dy, dx);
    }

    // Začni časovnik pri prvem premiku
    if (!timerRunning && !timerFinished) {
        timerRunning = true;
        timerStartMs = Date.now();
        var sizeSlider  = document.getElementById('sizeSlider');
        var speedSlider = document.getElementById('speedSlider');
        if (sizeSlider  != null) sizeSlider.disabled  = true;
        if (speedSlider != null) speedSlider.disabled = true;
    }

    // Premik po korakih (da ne preskočimo zidu)
    var steps = Math.ceil(Math.abs(dx));
    if (Math.ceil(Math.abs(dy)) > steps) {
        steps = Math.ceil(Math.abs(dy));
    }
    if (steps < 1) steps = 1;

    var stepX = dx / steps;
    var stepY = dy / steps;

    for (var s = 0; s < steps; s++) {
        var nextX = charX + stepX;
        var nextY = charY + stepY;

        if (canMove(nextX, nextY)) {
            charX = nextX;
            charY = nextY;
        } else {
            var movedX = canMove(nextX, charY);
            if (movedX) charX = nextX;

            var movedY = canMove(charX, nextY);
            if (movedY) charY = nextY;

            if (!movedX && !movedY) break;
        }
    }

    // Preveri zbiranje ur
    var charCx = charX + charWidth  / 2;
    var charCy = charY + charHeight / 2;
    for (var i = 0; i < clockCount; i++) {
        if (!clockCollected[i]) {
            var ddx  = charCx - clockX[i];
            var ddy  = charCy - clockY[i];
            var dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < 12) {
                clockCollected[i] = true;
                countdownBonusMs += CLOCK_BONUS_MS;
                updateClocksDisplay();
                Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1400,
                    background: '#0d0d18',
                    color: '#FFD700',
                }).fire({ icon: 'success', title: '+10 seconds!' });
            }
        }
    }

    // Preveri, ali je karakter dosegel izhod
    if (timerRunning && !timerFinished && !gameOver && charY + charHeight >= EXIT_Y) {
        timerRunning   = false;
        timerFinished  = true;
        timerElapsedMs = Date.now() - timerStartMs;
        addToLeaderboard(timerElapsedMs);

        var remaining = getTimeRemaining();
        var collected = 0;
        for (var i = 0; i < clockCount; i++) {
            if (clockCollected[i]) collected++;
        }

        setTimeout(function() {
            Swal.fire({
                title: '<span style="font-family:Orbitron,sans-serif;color:#3CB043">ESCAPED! &#127881;</span>',
                html: '<div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">' +
                      '<p style="color:#3CB043;font-size:1rem">Nibbles made it out!</p>' +
                      '<hr style="border-color:#3CB04333;margin:10px 0">' +
                      '<p>&#9201; Time taken: <b style="color:#fff">' + formatTime(timerElapsedMs) + '</b></p>' +
                      '<p>&#9201; Time remaining: <b style="color:#FFD700">' + formatTime(remaining) + '</b></p>' +
                      '<p>&#128336; Clocks collected: <b style="color:#FFD700">' + collected + ' / ' + CLOCKS_COUNT + '</b></p>' +
                      '</div>',
                background: '#0d0d18',
                color: '#ccc',
                confirmButtonText: 'Play Again',
                confirmButtonColor: '#3CB043',
                width: '400px',
                customClass: { popup: 'swal-game-popup' }
            }).then(function() { resetGame(); });
        }, 200);
    }

    drawCharacter();
}

// ========== IGRA ZANKA ==========

function gameLoop() {
    var dx = 0;
    var dy = 0;

    if (keyUp)    dy = -charSpeed;
    if (keyDown)  dy =  charSpeed;
    if (keyLeft)  dx = -charSpeed;
    if (keyRight) dx =  charSpeed;

    // Diagonalno gibanje - normaliziraj hitrost
    if (dx != 0 && dy != 0) {
        var norm = charSpeed / Math.sqrt(2);
        if (dx > 0) dx =  norm; else dx = -norm;
        if (dy > 0) dy =  norm; else dy = -norm;
    }

    if (dx != 0 || dy != 0) {
        moveCharacter(dx, dy);
    } else {
        drawCharacter();
    }

    updateTimerDisplay();
    requestAnimationFrame(gameLoop);
}

// ========== TIPKOVNICA ==========

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

// ========== NALAGANJE ==========

function loadMazeCollisionData() {
    var mazeCanvas = document.getElementById('mazeCanvas');

    // setInterval deluje kot ponavljajoča ura:
    // vsake 100 milisekund pokliče spodnjo funkcijo,
    // dokler je ne ustavimo s clearInterval.
    // To potrebujemo ker se labirint nariše z zakasnitvijo
    // (SVG se naloži iz datoteke) — ne moremo vedeti točno kdaj je pripravljen.
    var checkInterval = setInterval(function() {

        // getContext('2d') nam da dostop do orodij za branje canvasa
        var mazeCtx = mazeCanvas.getContext('2d');

        // getImageData prebere VSE piksle iz canvasa v eno dolgo polje.
        // Vsak piksel zasede 4 mesta zaporedoma: [ R, G, B, A, R, G, B, A, ... ]
        //   R = rdeča (0-255)
        //   G = zelena (0-255)
        //   B = modra  (0-255)
        //   A = prosojnost (0=prozoren, 255=poln)
        // Parametri: začetek x=0, y=0, širina, višina canvasa
        var imageData = mazeCtx.getImageData(0, 0, mazeCanvas.width, mazeCanvas.height);

        // Preverimo ali je že kakšen piksel namaljan.
        // Zidovi so rdeče barve (R visok, G in B nizka).
        // Gremo po vsakem pikslu — skačemo po 4 ker en piksel = 4 vrednosti.
        var hasPainted = false;
        for (var i = 0; i < imageData.data.length; i += 4) {
            var R = imageData.data[i];      // rdeča komponenta tega piksla
            var G = imageData.data[i + 1];  // zelena komponenta tega piksla
            var B = imageData.data[i + 2];  // modra komponenta tega piksla
            if (R > 200 && G < 50 && B < 50) {
                // Našli smo rdeč piksel = zid je že namaljan
                hasPainted = true;
                break;
            }
        }

        if (hasPainted) {
            // Ustavimo ponavljajočo uro — ne rabimo več preverjati
            clearInterval(checkInterval);
            // Shranimo polje pikslov — funkcija isWall() ga bo
            // uporabljala za zaznavanje trkov med igro
            mazeImageData = imageData;
            // Zdaj ko vemo kje so zidovi, lahko postavimo ure na prosta mesta
            generateClocks(CLOCKS_COUNT);
            updateClocksDisplay();
        }
    }, 100);
}

window.addEventListener('load', function() {
    renderLeaderboard(loadLeaderboardTimes());
    drawCharacter();
    gameLoop();
    loadMazeCollisionData();
    setTimeout(showStoryIntro, 600);
});
