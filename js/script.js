function drawIt() {
    var x = 350;
    var y = 250;
    var dx = 2;
    var dy = 4;
    var WIDTH;
    var HEIGHT;
    var r = 10;
    var ctx;
    var paddlex;
    var paddleh;
    var paddlew;

    //tipke za premikanje ploščice
    var rightDown = false;
    var leftDown = false;

    //opeke
    var bricks;
    var NROWS;
    var NCOLS;
    var BRICKWIDTH;
    var BRICKHEIGHT;
    var PADDING;

    //timer
    var sekunde;
    var sekundeI;
    var minuteI;
    var izpisTimer;
    var start = true;

    //zajkljucek igre
    var GAMEOVER = false;
    var chestX, chestY, chestW, chestH;

    function init() {
        tocke = 0;
        $("#tocke").html(tocke);
        sekunde = 0;
        izpisTimer = "00:00";
        intTimer = setInterval(timer, 1000); // shrani v globalno spremenljivko
        ctx = $('#canvas')[0].getContext("2d");
        WIDTH = $("#canvas").width();
        HEIGHT = $("#canvas").height();
        // nastavi pozicijo skrinjice enkrat na začetku igre
        chestW = BRICKWIDTH;
        chestH = BRICKHEIGHT;
        chestX = Math.floor(Math.random() * (WIDTH - chestW));
        chestY = PADDING;
        return setInterval(draw, 10);
    }

    //timer
    function timer() {
        if (vPavzi) return; // ne štej časa med pavzo
        if (start == true) {
            sekunde++;

            sekundeI = ((sekundeI = (sekunde % 60)) > 9) ? sekundeI : "0" + sekundeI;
            minuteI = ((minuteI = Math.floor(sekunde / 60)) > 9) ? minuteI : "0" + minuteI;
            izpisTimer = minuteI + ":" + sekundeI;

            $("#cas").html(izpisTimer);
        }
    }

    //nastavljanje leve in desne tipke
    function onKeyDown(evt) {
        if (evt.keyCode == 65)
            leftDown = true;
        else if (evt.keyCode == 68) rightDown = true;
    }

    function onKeyUp(evt) {
        if (evt.keyCode == 65)
            leftDown = false;
        else if (evt.keyCode == 68) rightDown = false;
    }
    $(document).keydown(onKeyDown);
    $(document).keyup(onKeyUp);

    function init_paddle() {
        paddlex = WIDTH / 2;
        paddleh = 10;
        paddlew = 75;
    }

    function initbricks() { //inicializacija opek - polnjenje v tabelo
        NROWS = 5;
        NCOLS = 6;
        BRICKWIDTH = (WIDTH / NCOLS) - 1;
        BRICKHEIGHT = 30;
        PADDING = 1;
        bricks = new Array(NROWS);
        for (i = 0; i < NROWS; i++) {
            bricks[i] = new Array(NCOLS);
            for (j = 0; j < NCOLS; j++) {
                switch (i) {
                    case 0:
                        bricks[i][j] = 5;
                    break;
                    case 1:
                        bricks[i][j] = 4;
                    break;
                    case 2:
                        bricks[i][j] = 3;
                    break;
                    case 3:
                        bricks[i][j] = 2;
                    break;
                    case 4:
                        bricks[i][j] = 1;
                    break;
                }
            }
        }
    }


    function circle(x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    function rect(x, y, w, h) {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.closePath();
        ctx.fill();
    }

    function clear() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
    }
    //END LIBRARY CODE
    var brickColors = ['#050596', '#2865f3', '#249ce1', '#26c0e3', '#58c1ee'];

    function draw() {
        if (vPavzi) return; // igra je na pavzi
        clear();
        // pearl ball: radial gradient to simulate pearlescent sheen
        var pearlGrad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
        pearlGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        pearlGrad.addColorStop(0.4, 'rgba(248,248,255,0.95)');
        pearlGrad.addColorStop(0.7, 'rgba(234,238,242,0.95)');
        pearlGrad.addColorStop(1, 'rgba(200,200,205,0.9)');
        ctx.fillStyle = pearlGrad;
        circle(x, y, r);

        //premik ploščice levo in desno
        if (rightDown && !GAMEOVER) {
            if ((paddlex + paddlew) < WIDTH) {
                paddlex += 5;
            } else {
                paddlex = WIDTH - paddlew;
            }
        }
        else if (leftDown && !GAMEOVER) {
            if (paddlex > 0) {
                paddlex -= 5;
            } else {
                paddlex = 0;
            }
        }


        ctx.fillStyle = '#3ab8d4';
        rect(paddlex, HEIGHT - paddleh, paddlew, paddleh);

        //riši skrinjico (cilj) pred briki, da jo briki prekrijejo
        if (chest.complete) {
            ctx.drawImage(chest, chestX, chestY, chestW, chestH);
        }

        //riši opeke
        for (i = 0; i < NROWS; i++) {
            for (j = 0; j < NCOLS; j++) {
                if (bricks[i][j] > 0) {
                    ctx.fillStyle = brickColors[i % brickColors.length]; //za spremenit
                    rect((j * (BRICKWIDTH + PADDING)) + PADDING,
                        (i * (BRICKHEIGHT + PADDING)) + PADDING,
                        BRICKWIDTH, BRICKHEIGHT);
                }
            }
        }


        rowheight = BRICKHEIGHT + PADDING + r / 2; //Smo zadeli opeko?
        colwidth = BRICKWIDTH + PADDING + r / 2;
        row = Math.floor(y / rowheight);
        col = Math.floor(x / colwidth);
        if (y < NROWS * rowheight && row >= 0 && col >= 0 && bricks[row][col] > 0) {
            // razdalja žogce do vodoravnih in navpičnih robov opeke
            var distX = Math.abs(x - (col * colwidth + BRICKWIDTH / 2));
            var distY = Math.abs(y - (row * rowheight + BRICKHEIGHT / 2));

            if (distX / BRICKWIDTH > distY / BRICKHEIGHT)
                dx = -dx; // zadetek z leve ali desne strani
            else
                dy = -dy; // zadetek z zgornje ali spodnje strani

            bricks[row][col]--; // odštej zadetek (močnejši briki potrebujejo več zadetkov)
            tocke += 1;
            $("#tocke").html(tocke);
        }

        // preveri trčenje žogice s skrinjico
        if (x + r > chestX && x - r < chestX + chestW &&
            y + r > chestY && y - r < chestY + chestH) {
            GAMEOVER = true;
            clearInterval(intervalId);
            clearInterval(intTimer);
            dodajRezultat(tocke, izpisTimer);
            prikaziLestvico();
            winAlert(tocke, izpisTimer);
        }

        //odboj od leve in desne stene
        if (x + dx > WIDTH - r || x + dx < 0 + r)
            dx = -dx;//ce bi zogca zadela steno ji obrni x smer

        //odboj od zgornje stene
        if (y + dy < 0 + r)
            dy = -dy;//ce bi zogca zadela steno ji obrni y smer

        //odboj od spodnje stene
        else if (y + dy > HEIGHT - (r + paddleh)) {
            start = false;
            //preveri ali je zadel ploščico
            if (x > paddlex && x < paddlex + paddlew) {
                dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);//ce bolj na sredino ploščice zadene, manjši odboj, če bolj na rob, večji odboj
                dy = -dy; //obbrni y smer
                start = true;
            }

            //ustavi interval draw
            else if (y + dy > HEIGHT - r) {
                GAMEOVER = true;
                clearInterval(intervalId);
                clearInterval(intTimer);
                dodajRezultat(tocke, izpisTimer);
                prikaziLestvico();
                gameOverAlert(tocke, izpisTimer);
            }
        }
        x += dx;
        y += dy;
    }

    intervalId = init();
    init_paddle();
    initbricks();


}

var intervalId = null;
var intTimer = null;
var vPavzi = false;

// skrinjica — cilj igre
var chest = new Image();
chest.src = '../img/chest.png';

// nariše začetno stanje brez zagona igre
function predogled() {
    var canvas = $('#canvas')[0];
    var pctx = canvas.getContext("2d");
    var W = $("#canvas").width();
    var H = $("#canvas").height();
    var NROWS = 5, NCOLS = 6;
    var BRICKWIDTH = (W / NCOLS) - 1;
    var BRICKHEIGHT = 30;
    var PADDING = 1;
    var brickColors = ['#050596', '#2865f3', '#249ce1', '#26c0e3', '#58c1ee'];

    pctx.clearRect(0, 0, W, H);

    // skrinjica (cilj) — pod briki
    var chestW = 2 * BRICKWIDTH;
    var chestH = 2 * BRICKHEIGHT;
    var chestX = Math.floor(Math.random() * (W - chestW));
    if (chest.complete) {
        pctx.drawImage(chest, chestX, PADDING, chestW, chestH);
    }

    // opeke
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            pctx.fillStyle = brickColors[i % brickColors.length];
            pctx.fillRect(
                (j * (BRICKWIDTH + PADDING)) + PADDING,
                (i * (BRICKHEIGHT + PADDING)) + PADDING,
                BRICKWIDTH, BRICKHEIGHT
            );
        }
    }

    // ploščica
    var paddlew = 75, paddleh = 10;
    pctx.fillStyle = '#3ab8d4';
    pctx.fillRect(W / 2 - paddlew / 2, H - paddleh, paddlew, paddleh);

    // žogica (biser)
    var px = W / 2, py = H / 2, r = 10;
    var grad = pctx.createRadialGradient(px - 4, py - 4, 2, px, py, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(248,248,255,0.95)');
    grad.addColorStop(0.7, 'rgba(234,238,242,0.95)');
    grad.addColorStop(1, 'rgba(200,200,205,0.9)');
    pctx.beginPath();
    pctx.fillStyle = grad;
    pctx.arc(px, py, r, 0, Math.PI * 2, true);
    pctx.fill();
    pctx.closePath();
}

$(document).ready(function () {
    predogled();
    prikaziLestvico();
});

$("#pavza").on("click", function () {
    if (!intervalId) return; // igra ne teče
    vPavzi = !vPavzi;
    $(this).text(vPavzi ? 'Nadaljuj' : 'Pavza');
});

$("#start").on("click", function () {
    clearInterval(intervalId);
    clearInterval(intTimer);
    vPavzi = false;
    $("#pavza").text('Pavza');
    drawIt();
});

$("#reset").on("click", function () {
    clearInterval(intervalId);
    clearInterval(intTimer);
    predogled();
});

// Ključ pod katerim shranjujemo podatke v localStorage.
// localStorage je kot mali slovar ki si zapomni podatke med obiski strani.
var LEADERBOARD_KEY = 'morje_lestvica';

// Preberi shranjene rezultate iz localStorage.
// JSON.parse spremeni besedilo (npr. '[{"tocke":5,"cas":"00:10"}]') nazaj v polje objektov.
function loadLeaderboardTimes() {
    var saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved == null) {
        return [];  // Ni shranjenih rezultatov — vrni prazno polje
    }
    return JSON.parse(saved);
}

// Shrani polje rezultatov v localStorage.
// JSON.stringify naredi iz polja objektov besedilo,
// ker localStorage zna shraniti samo besedilo, ne polj.
function saveLeaderboardTimes(times) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(times));
}

// Doda nov rezultat in razvrsti z urejanjem z vstavljanjem (insertion sort).
// Razvrstimo po točkah padajoče — več točk = boljši rezultat.
function dodajRezultat(tocke, cas) {
    var rezultati = loadLeaderboardTimes();

    // Dodaj novi rezultat na konec polja
    rezultati.push({ tocke: tocke, cas: cas });

    // Urejanje z vstavljanjem (insertion sort) — padajoče po točkah
    for (var i = 1; i < rezultati.length; i++) {
        var kljuc = rezultati[i];  // element ki ga vstavljamo na pravo mesto
        var j = i - 1;
        // Premikaj elemente z manj točkami eno mesto v desno
        while (j >= 0 && rezultati[j].tocke < kljuc.tocke) {
            rezultati[j + 1] = rezultati[j];
            j--;
        }
        rezultati[j + 1] = kljuc;  // vstavi na pravo mesto
    }

    // Shrani samo top 10 rezultatov
    rezultati = rezultati.slice(0, 10);

    saveLeaderboardTimes(rezultati);
}

// Prikaži lestvico v HTML elementu #lestvica-seznam
function prikaziLestvico() {
    var rezultati = loadLeaderboardTimes();
    var seznam = $('#lestvica-seznam');
    seznam.empty();

    if (rezultati.length === 0) {
        seznam.append('<li>Še ni rezultatov.</li>');
        return;
    }

    for (var i = 0; i < rezultati.length; i++) {
        seznam.append(
            '<li>' + rezultati[i].tocke + ' točk &mdash; ' + rezultati[i].cas + '</li>'
        );
    }
}