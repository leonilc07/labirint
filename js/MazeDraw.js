// Draw the maze walls on the mazeCanvas and expose solution drawing via button
window.addEventListener('load', function () {
    const mazeCanvas = document.getElementById('mazeCanvas');
    const ctx = mazeCanvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

    fetch('img/maze.svg')
        .then(response => response.text())
        .then(svgContent => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');

            // --- Extract wall lines from the first <g> group ---
            const wallGroup = svgElement.querySelector('g');
            const wallLines = Array.from(wallGroup.querySelectorAll('line')).map(line => ({
                x1: parseFloat(line.getAttribute('x1')),
                y1: parseFloat(line.getAttribute('y1')),
                x2: parseFloat(line.getAttribute('x2')),
                y2: parseFloat(line.getAttribute('y2')),
            }));

            // --- Extract solution polyline points ---
            const polyline = svgElement.querySelector('#maze');
            const solutionPoints = polyline
                ? polyline.getAttribute('points').trim().split(/\s+/).map(pt => {
                    const [x, y] = pt.split(',').map(Number);
                    return { x, y };
                })
                : [];

            // Draw all maze walls as red lines on black background.
            // isWall in character.js checks r < 200 && g < 200 && b < 200.
            // Red walls: r=255, so they do NOT block movement — walls are
            // only detected structurally via the static snapshot taken before
            // any solution is drawn (see loadMazeCollisionData in character.js).
            // The snapshot is taken immediately after drawWalls(), while the
            // canvas has only the red walls on black. The collision check is
            // therefore: pixel is NOT black (i.e. r > 50 || g > 50 || b > 50
            // means open path) — see updated isWall in character.js.
            function drawWalls() {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'square';
                wallLines.forEach(({ x1, y1, x2, y2 }) => {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                });
            }

            // Draw the solution path up to the given progress fraction (0 → 1).
            // Uses bright green so it stands out on the black background and
            // does NOT trigger wall detection (green channel is high).
            function drawSolution(progress) {
                if (!solutionPoints.length || progress <= 0) return;
                const count = Math.floor(progress * (solutionPoints.length - 1));
                if (count < 1) return;

                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(solutionPoints[0].x, solutionPoints[0].y);
                for (let i = 1; i <= count; i++) {
                    ctx.lineTo(solutionPoints[i].x, solutionPoints[i].y);
                }
                ctx.stroke();
            }

            // Initial draw — walls only, no solution
            drawWalls();

            // Expose a global so the button can trigger the animation
            let solutionAnimating = false;
            let solutionDone = false;

            window.drawMazeSolution = function () {
                window.toggleMazeSolution();
            };

            window.toggleMazeSolution = function () {
                // If solution is visible, hide it
                if (solutionDone) {
                    solutionDone = false;
                    drawWalls();
                    return;
                }

                // If already animating, stop & hide
                if (solutionAnimating) {
                    solutionAnimating = false;
                    drawWalls();
                    return;
                }

                if (!solutionPoints.length) {
                    console.error('Solution polyline #maze not found in SVG');
                    return;
                }

                solutionAnimating = true;
                const duration = 6000; // 6 seconds
                let startTime = null;

                function animate(timestamp) {
                    if (!solutionAnimating) return; // cancelled
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);

                    drawWalls();           // redraw walls to keep canvas clean
                    drawSolution(progress);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        solutionAnimating = false;
                        solutionDone = true;
                    }
                }

                requestAnimationFrame(animate);
            };
        })
        .catch(error => console.error('Error loading maze SVG:', error));
});
