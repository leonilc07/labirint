// Nariše zidove labirinta na mazeCanvas in razkrije rešitev prek gumba
window.addEventListener('load', function() {
    var mazeCanvas = document.getElementById('mazeCanvas');
    var ctx = mazeCanvas.getContext('2d');

    // Vzporedna polja za zidove labirinta
    var wallX1    = [];
    var wallY1    = [];
    var wallX2    = [];
    var wallY2    = [];
    var wallCount = 0;

    // Vzporedna polja za točke rešitve
    var solX     = [];
    var solY     = [];
    var solCount = 0;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

    // Nariši vse zidove (rdeče linije na črnem ozadju)
    function drawWalls() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';

        for (var i = 0; i < wallCount; i++) {
            ctx.beginPath();
            ctx.moveTo(wallX1[i], wallY1[i]);
            ctx.lineTo(wallX2[i], wallY2[i]);
            ctx.stroke();
        }
    }

    // Nariši rešitev do določenega deleža (0 = nič, 1 = vse)
    function drawSolution(progress) {
        if (solCount == 0 || progress <= 0) return;

        var count = Math.floor(progress * (solCount - 1));
        if (count < 1) return;

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(solX[0], solY[0]);

        for (var i = 1; i <= count; i++) {
            ctx.lineTo(solX[i], solY[i]);
        }
        ctx.stroke();
    }

    // Naloži SVG datoteko z labirintom
    fetch('img/maze.svg')
        .then(function(response) {
            return response.text();
        })
        .then(function(svgContent) {
            var parser     = new DOMParser();
            var svgDoc     = parser.parseFromString(svgContent, 'image/svg+xml');
            var svgElement = svgDoc.querySelector('svg');

            // Preberi zidove iz prve skupine <g> v SVG
            var wallGroup    = svgElement.querySelector('g');
            var lineElements = wallGroup.querySelectorAll('line');
            for (var i = 0; i < lineElements.length; i++) {
                wallX1[wallCount] = parseFloat(lineElements[i].getAttribute('x1'));
                wallY1[wallCount] = parseFloat(lineElements[i].getAttribute('y1'));
                wallX2[wallCount] = parseFloat(lineElements[i].getAttribute('x2'));
                wallY2[wallCount] = parseFloat(lineElements[i].getAttribute('y2'));
                wallCount++;
            }

            // Preberi točke rešitvene poti
            var polyline = svgElement.querySelector('#maze');
            if (polyline != null) {
                var pointsStr  = polyline.getAttribute('points').trim();
                var pointParts = pointsStr.split(/\s+/);
                for (var i = 0; i < pointParts.length; i++) {
                    var xy = pointParts[i].split(',');
                    solX[solCount] = parseFloat(xy[0]);
                    solY[solCount] = parseFloat(xy[1]);
                    solCount++;
                }
            }

            // Nariši samo zidove (brez rešitve)
            drawWalls();

            var solutionAnimating = false;
            var solutionDone      = false;

            // Gumb za prikaz/skritje rešitve
            window.toggleMazeSolution = function() {
                // Če je rešitev že vidna, jo skrij
                if (solutionDone) {
                    solutionDone = false;
                    drawWalls();
                    return;
                }

                // Če se animacija že izvaja, jo ustavi
                if (solutionAnimating) {
                    solutionAnimating = false;
                    drawWalls();
                    return;
                }

                if (solCount == 0) return;

                solutionAnimating = true;
                var duration  = 6000;
                var startTime = null;

                function animate(timestamp) {
                    if (!solutionAnimating) return;
                    if (startTime == null) startTime = timestamp;

                    var progress = (timestamp - startTime) / duration;
                    if (progress > 1) progress = 1;

                    drawWalls();
                    drawSolution(progress);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        solutionAnimating = false;
                        solutionDone      = true;
                    }
                }

                requestAnimationFrame(animate);
            };

            window.drawMazeSolution = function() {
                window.toggleMazeSolution();
            };
        });
});

