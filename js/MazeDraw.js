// ============================================================
//  MazeDraw.js  —  risanje labirinta in animacija rešitve
//
//  Ta datoteka skrbi za:
//    1. Nalaganje labirinta iz SVG datoteke
//    2. Risanje zidov (rdeče linije) na mazeCanvas
//    3. Animirano prikazovanje/skrivanje rešitvene poti
// ============================================================

// Počakamo da se stran v celoti naloži, šele takrat so HTML elementi na voljo
window.addEventListener('load', function() {

    // Poiščemo platno za labirint in dobimo "čopič" za risanje
    const mazeCanvas = document.getElementById('mazeCanvas');
    const ctx = mazeCanvas.getContext('2d');

    // ============================================================
    //  VZPOREDNA POLJA ZA ZIDOVE
    //
    //  Vsak zid je daljica med točkama (x1,y1) in (x2,y2).
    //  Namesto polja objektov [{x1,y1,x2,y2}, ...] uporabimo
    //  štiri ločena polja — eno za vsako koordinato.
    //    wallX1[0]=10, wallY1[0]=20, wallX2[0]=10, wallY2[0]=60  → 1. zid
    //    wallX1[1]=10, wallY1[1]=60, wallX2[1]=50, wallY2[1]=60  → 2. zid
    //    ...
    //  wallCount pove koliko zidov je v poljih.
    // ============================================================

    const wallX1    = [];   // x-koordinata začetnih točk zidov
    const wallY1    = [];   // y-koordinata začetnih točk zidov
    const wallX2    = [];   // x-koordinata končnih točk zidov
    const wallY2    = [];   // y-koordinata končnih točk zidov
    let wallCount = 0;    // število zidov v poljih

    // ============================================================
    //  VZPOREDNA POLJA ZA TOČKE REŠITVE
    //
    //  Rešitvena pot je zaporedje točk (x,y) ki tvorijo pot
    //  od vhoda do izhoda labirinta.
    //    solX[0]=394, solY[0]=4   → 1. točka (vhod)
    //    solX[1]=394, solY[1]=20  → 2. točka
    //    ...
    //  solCount pove koliko točk je v poljih.
    // ============================================================

    const solX     = [];   // x-koordinate točk rešitvene poti
    const solY     = [];   // y-koordinate točk rešitvene poti
    let solCount = 0;    // število točk rešitvene poti

    // Pobarvaj ozadje platna črno pred risanjem labirinta
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);


    // ============================================================
    //  RISANJE ZIDOV
    //
    //  Počisti platno in nariše vse zidove kot rdeče linije
    //  na črnem ozadju.
    //  Kličemo jo vsakič ko hočemo "ponastaviti" platno
    //  (npr. ko skrijemo rešitev).
    // ============================================================

    function drawWalls() {
        // Počisti platno — prebarva vse črno
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

        // Nastavi slog za risanje zidov
        ctx.strokeStyle = '#FF0000';  // rdeča barva zidov
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';       // kvadratni konci črt (brez zaokrožitve)

        // Nariši vsak zid kot daljico med (x1,y1) in (x2,y2)
        for (let i = 0; i < wallCount; i++) {
            ctx.beginPath();
            ctx.moveTo(wallX1[i], wallY1[i]);  // začni na prvi točki zidu
            ctx.lineTo(wallX2[i], wallY2[i]);  // potegni do druge točke
            ctx.stroke();                       // dejansko nariši črto
        }
    }


    // ============================================================
    //  RISANJE REŠITVE
    //
    //  Nariše del rešitvene poti glede na parameter progress.
    //  progress = 0.0 → nič (nariše samo vhod)
    //  progress = 0.5 → polovica poti
    //  progress = 1.0 → celotna pot do izhoda
    //
    //  Kličemo jo med animacijo z naraščajočim progress (0→1).
    // ============================================================

    function drawSolution(progress) {
        // Če ni točk ali je progress 0, ni kaj risati
        if (solCount == 0 || progress <= 0) return;

        // Izračunaj koliko točk poti narišemo.
        // Math.floor zaokroži navzdol na celo število.
        // Primer: 100 točk, progress=0.5 → count=49 → narišemo prvih 50 točk (0..49)
        const count = Math.floor(progress * (solCount - 1));
        if (count < 1) return;

        // Nastavi slog za rešitveno pot — zelena barva
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';  // zaokroženi vogali pri spremembi smeri

        // Začni pot na prvi točki in povežemo vse do count-te točke
        ctx.beginPath();
        ctx.moveTo(solX[0], solY[0]);  // začetek (vhod labirinta)

        for (let i = 1; i <= count; i++) {
            ctx.lineTo(solX[i], solY[i]);  // poveži z naslednjo točko
        }
        ctx.stroke();  // nariši celotno pot naenkrat
    }


    // ============================================================
    //  NALAGANJE SVG LABIRINTA
    //
    //  fetch() pošlje HTTP zahtevo za datoteko maze.svg.
    //  SVG vsebuje:
    //    - <g> element z <line> elementi (zidovi labirinta)
    //    - <polyline id="maze"> z atributom points (rešitvena pot)
    //
    //  fetch vrne "obljubo" (Promise) — kodo ki se izvede
    //  ko je datoteka naložena (.then(function(response){...})).
    //  Ker nalaganje traja, ne moremo čakati — zato uporabimo .then().
    // ============================================================

    fetch('img/maze.svg')
        .then(function(response) {
            // response.text() prebere vsebino datoteke kot besedilo
            return response.text();
        })
        .then(function(svgContent) {

            // DOMParser razčleni SVG besedilo v drevo elementov,
            // enako kot brskalnik razčleni HTML
            const parser     = new DOMParser();
            const svgDoc     = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');  // korenski <svg> element

            // --------------------------------------------------------
            //  PREBERI ZIDOVE
            //
            //  querySelector('g') najde prvo skupino <g> v SVG.
            //  querySelectorAll('line') vrne vse <line> elemente v njej.
            //  getAttribute('x1') prebere vrednost atributa x1="..."
            //  parseFloat pretvori besedilo "123.5" v število 123.5
            // --------------------------------------------------------

            const wallGroup    = svgElement.querySelector('g');
            const lineElements = wallGroup.querySelectorAll('line');

            for (let i = 0; i < lineElements.length; i++) {
                wallX1[wallCount] = parseFloat(lineElements[i].getAttribute('x1'));
                wallY1[wallCount] = parseFloat(lineElements[i].getAttribute('y1'));
                wallX2[wallCount] = parseFloat(lineElements[i].getAttribute('x2'));
                wallY2[wallCount] = parseFloat(lineElements[i].getAttribute('y2'));
                wallCount++;
            }

            // --------------------------------------------------------
            //  PREBERI REŠITVENO POT
            //
            //  <polyline id="maze" points="394,4 394,20 374,20 ...">
            //  points je en dolg niz koordinatnih parov ločenih s presledki.
            //  trim() odstrani morebitne presledke na začetku/koncu.
            //  split(/\s+/) razdeli po enem ali več presledkih/enter-jih.
            //  Vsak element je "x,y" niz ki ga razdelimo s split(',').
            // --------------------------------------------------------

            const polyline = svgElement.querySelector('#maze');
            if (polyline != null) {
                const pointsStr  = polyline.getAttribute('points').trim();
                const pointParts = pointsStr.split(/\s+/);  // razdeli na pare "x,y"

                for (let i = 0; i < pointParts.length; i++) {
                    const xy = pointParts[i].split(',');    // razdeli "x,y" → [x, y]
                    solX[solCount] = parseFloat(xy[0]);   // x kot število
                    solY[solCount] = parseFloat(xy[1]);   // y kot število
                    solCount++;
                }
            }

            // Nariši labirint (samo zidove, brez rešitve)
            drawWalls();

            // --------------------------------------------------------
            //  STANJE ANIMACIJE
            //
            //  solutionAnimating = true ko se animacija trenutno izvaja
            //  solutionDone      = true ko je animacija zaključena in
            //                      je rešitev v celoti vidna
            // --------------------------------------------------------

            let solutionAnimating = false;
            let solutionDone      = false;


            // ============================================================
            //  PREKLOP REŠITVE  (gumb "Show Solution")
            //
            //  window.toggleMazeSolution je globalna funkcija ker jo
            //  kliče onclick atribut v HTML-ju.
            //
            //  Logika:
            //    1. Rešitev je vidna → jo skrij (pobriši in nariši samo zidove)
            //    2. Animacija teče  → jo ustavi (pobriši in nariši samo zidove)
            //    3. Sicer           → začni animacijo (0 → 1 v 6 sekundah)
            // ============================================================

            window.toggleMazeSolution = function() {

                // Primer 1: rešitev je v celoti vidna → skrij jo
                if (solutionDone) {
                    solutionDone = false;
                    drawWalls();   // pobriši rešitev, ostanejo samo zidovi
                    return;
                }

                // Primer 2: animacija teče → ustavi jo
                if (solutionAnimating) {
                    solutionAnimating = false;
                    drawWalls();   // pobriši delno rešitev
                    return;
                }

                // Primer 3: rešitve ni — ni točk v polju
                if (solCount == 0) return;

                // Začni animacijo
                solutionAnimating = true;
                const duration  = 6000;   // čas celotne animacije v ms (6 sekund)
                let startTime = null;   // čas prvega klica animate() (null = še ni začeto)

                // --------------------------------------------------------
                //  ANIMACIJSKA ZANKA
                //
                //  requestAnimationFrame(animate) pove brskalniku:
                //  "pokliči animate() pred naslednjo sličico" (~60x/sek).
                //  timestamp = čas v ms ko je brskalnik poklical to funkcijo.
                //
                //  progress gre od 0.0 do 1.0 skozi 6000 ms.
                //  Ko progress doseže 1.0, animacija konča.
                // --------------------------------------------------------

                function animate(timestamp) {
                    // Če smo ustavili med animacijo → ne nadaljuj
                    if (!solutionAnimating) return;

                    // Ob prvem klicu si zapomni začetni čas
                    if (startTime == null) startTime = timestamp;

                    // Izračunaj napredek: koliko časa je minilo / skupni čas
                    let progress = (timestamp - startTime) / duration;
                    if (progress > 1) progress = 1;  // ne preseži 1.0

                    // Pobriši platno in nariši zidove + del rešitve
                    drawWalls();
                    drawSolution(progress);

                    if (progress < 1) {
                        // Animacija še ni končana → zahtevaj naslednjo sličico
                        requestAnimationFrame(animate);
                    } else {
                        // Animacija končana → označi kot dokončano
                        solutionAnimating = false;
                        solutionDone      = true;
                    }
                }

                // Začni animacijsko zanko
                requestAnimationFrame(animate);
            };

            // drawMazeSolution je vzdevek (alias) za toggleMazeSolution —
            // ohranjen za morebitno zunanja klicanje
            window.drawMazeSolution = function() {
                window.toggleMazeSolution();
            };
        });
});

