const canvas = document.getElementById('characterCanvas');
const ctx = canvas.getContext('2d');

let mazeImageData = null;

// --- Game constants ---
const EXIT_Y             = 480;    // maze bottom exit (px)
const COUNTDOWN_START_MS = 60000;  // 60-second countdown
const CLOCK_BONUS_MS     = 10000;  // +10s per collected clock
const CLOCKS_COUNT       = 8;      // clocks scattered in maze

// --- Timer state ---
let timerRunning     = false;
let timerFinished    = false;  // true when player wins
let gameOver         = false;  // true when time runs out
let timerStartMs     = 0;
let timerElapsedMs   = 0;
let countdownBonusMs = 0;      // total bonus from collected clocks

// --- Clock pickups ---
let clockPickups = [];

// --- Leaderboard ---
const leaderboardTimes = [];

function addToLeaderboard(ms) {
    leaderboardTimes.push(ms);
    leaderboardTimes.sort((a, b) => a - b);
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    leaderboardTimes.slice(0, 5).forEach((t, i) => {
        const tr = document.createElement('tr');
        if (i === 0) tr.classList.add('lb-best');
        tr.innerHTML = `<td>${i + 1}</td><td>${formatTime(t)}</td>`;
        tbody.appendChild(tr);
    });
}

function resetGame() {
    // Reset timer
    timerRunning     = false;
    timerFinished    = false;
    gameOver         = false;
    timerStartMs     = 0;
    timerElapsedMs   = 0;
    countdownBonusMs = 0;
    const timerEl = document.getElementById('timerDisplay');
    if (timerEl) {
        timerEl.textContent = formatTime(COUNTDOWN_START_MS);
        timerEl.classList.remove('timer-done', 'timer-warning', 'timer-danger');
    }

    // Reset character position and size
    character.x = 394;
    character.y = 4;
    character.width  = BASE_SIZE;
    character.height = BASE_SIZE;
    character.facing = Math.PI / 2;

    // Restore sliders to defaults and unlock them
    const sizeSlider  = document.getElementById('sizeSlider');
    const speedSlider = document.getElementById('speedSlider');
    if (sizeSlider)  { sizeSlider.value  = BASE_SIZE; sizeSlider.disabled  = false; }
    if (speedSlider) { speedSlider.value = 2;         speedSlider.disabled = false; character.speed = 2; }

    // Regenerate clock pickups
    generateClocks(CLOCKS_COUNT);
    updateClocksDisplay();

    character.draw();
}

function formatTime(ms) {
    const totalHundredths = Math.floor(ms / 10);
    const hh = totalHundredths % 100;
    const totalSecs = Math.floor(ms / 1000);
    const ss = totalSecs % 60;
    const mm = Math.floor(totalSecs / 60);
    return (
        String(mm).padStart(2, '0') + ':' +
        String(ss).padStart(2, '0') + ':' +
        String(hh).padStart(2, '0')
    );
}

function getTimeRemaining() {
    if (!timerRunning && !timerFinished && !gameOver) return COUNTDOWN_START_MS;
    return Math.max(0, COUNTDOWN_START_MS + countdownBonusMs - timerElapsedMs);
}

function triggerGameOver() {
    if (gameOver || timerFinished) return;
    timerRunning   = false;
    gameOver       = true;
    timerElapsedMs = COUNTDOWN_START_MS + countdownBonusMs;

    const timerEl = document.getElementById('timerDisplay');
    if (timerEl) {
        timerEl.textContent = formatTime(0);
        timerEl.classList.remove('timer-warning');
        timerEl.classList.add('timer-danger');
    }

    const collected = clockPickups.filter(c => c.collected).length;
    setTimeout(() => {
        Swal.fire({
            title: '<span style="font-family:Orbitron,sans-serif;color:#e74c3c">CAUGHT!</span>',
            html: `
              <div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">
                <p style="font-size:1.1rem;color:#e74c3c;margin-bottom:8px">&#9201; Time\'s up!</p>
                <p>The lab doors have sealed shut.</p>
                <p style="color:#888;font-size:0.85rem;margin-top:6px">Nibbles didn\'t make it out in time...</p>
                <hr style="border-color:#3CB04333;margin:10px 0">
                <p style="color:#FFD700;font-size:0.9rem">Clocks collected: <b style="color:#fff">${collected} / ${CLOCKS_COUNT}</b></p>
              </div>
            `,
            background: '#0d0d18',
            color: '#ccc',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#e74c3c',
            width: '400px',
            customClass: { popup: 'swal-game-popup' }
        }).then(() => { resetGame(); });
    }, 200);
}

function drawClockIcon(x, y) {
    const r = 7;
    ctx.save();
    ctx.translate(x, y);

    // Glow
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#FFD700';

    // Clock face
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1400';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hands (no glow)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    // Hour hand (~10 o'clock)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.4, -r * 0.35);
    ctx.stroke();

    // Minute hand (~12 o'clock)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r * 0.65);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function generateClocks(n) {
    clockPickups = [];
    if (!mazeImageData) return;

    const margin       = 20;
    const minDistApart = 60;
    const maxAttempts  = 10000;
    let attempts = 0;

    while (clockPickups.length < n && attempts < maxAttempts) {
        attempts++;
        const x = margin + Math.floor(Math.random() * (canvas.width  - 2 * margin));
        const y = margin + Math.floor(Math.random() * (canvas.height - 2 * margin));

        // Must be open path
        if (character.isWall(x, y)) continue;
        // Must have clear neighbours so clock sits inside a corridor
        if (character.isWall(x + 4, y) || character.isWall(x - 4, y) ||
            character.isWall(x, y + 4) || character.isWall(x, y - 4)) continue;
        // Avoid entrance/exit areas
        if (y < 40 || y > canvas.height - 40) continue;
        // Avoid clumping
        if (clockPickups.some(c => Math.hypot(c.x - x, c.y - y) < minDistApart)) continue;

        clockPickups.push({ x, y, collected: false });
    }
}

function updateClocksDisplay() {
    const el = document.getElementById('clocksDisplay');
    if (!el) return;
    const collected = clockPickups.filter(c => c.collected).length;
    el.textContent = collected + ' / ' + CLOCKS_COUNT;
}

function updateTimerDisplay() {
    const el = document.getElementById('timerDisplay');
    if (!el) return;
    if (timerRunning) {
        timerElapsedMs = Date.now() - timerStartMs;
    }
    const remaining = getTimeRemaining();
    el.textContent = formatTime(remaining);

    el.classList.remove('timer-done', 'timer-warning', 'timer-danger');
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

const BASE_SIZE = 12; // original character size in px

const character = {
    x: 394,
    y: 4,    // starts just inside the maze top entrance
    width: BASE_SIZE,
    height: BASE_SIZE,
    color: '#3CB043',
    speed: 2,
    facing: Math.PI / 2, // angle in radians; 0 = right, PI/2 = down (starting direction)
    draw: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw clock pickups
        clockPickups.forEach(clock => {
            if (!clock.collected) drawClockIcon(clock.x, clock.y);
        });

        // Draw at center, rotated to face movement direction
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const hw = this.width / 2;
        const hh = this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.facing);

        // Body rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(-hw, -hh, this.width, this.height);

        // Nose semicircle on the +x side ("forward" before rotation)
        ctx.fillStyle = '#3CB043';
        ctx.beginPath();
        ctx.arc(hw, 0, hh, Math.PI / 2, -Math.PI / 2, true);
        ctx.fill();

        ctx.restore();
    },
    canMove: function(newX, newY) {
        // Allow the character to exist above the maze (waiting zone)
        // and below it (exit zone), but keep it within horizontal bounds.
        if (newX < 0 || newX + this.width > canvas.width) return false;

        // Vertical: allow above canvas (down to -40) and past bottom (exit)
        if (newY < -40) return false;

        // Outside canvas vertically — no wall checks needed
        if (newY + this.height <= 0 || newY >= canvas.height) return true;

        if (!mazeImageData) return true;

        // Check pixels along the perimeter of the potential new position
        // step = 1 ensures we don't skip over thin walls
        const step = 1;

        // Top edge
        for (let x = newX; x <= newX + this.width; x += step) {
            if (this.isWall(x, newY)) return false;
        }
        
        // Bottom edge
        for (let x = newX; x <= newX + this.width; x += step) {
            if (this.isWall(x, newY + this.height)) return false;
        }
        
        // Left edge
        for (let y = newY; y <= newY + this.height; y += step) {
            if (this.isWall(newX, y)) return false;
        }
        
        // Right edge
        for (let y = newY; y <= newY + this.height; y += step) {
            if (this.isWall(newX + this.width, y)) return false;
        }

        // Also check the center to prevent hopping over small islands
        if (this.isWall(newX + this.width / 2, newY + this.height / 2)) return false;

        // Check the nose semicircle — it extends hh pixels beyond the front edge
        // in the facing direction, so the rectangle checks alone miss it.
        const newCx  = newX + this.width  / 2;
        const newCy  = newY + this.height / 2;
        const hw     = this.width  / 2;
        const hh     = this.height / 2;
        const noseCx = newCx + hw * Math.cos(this.facing);
        const noseCy = newCy + hw * Math.sin(this.facing);
        const arcSteps = 10;
        for (let i = 0; i <= arcSteps; i++) {
            const angle = (this.facing - Math.PI / 2) + (Math.PI / arcSteps) * i;
            const nx = noseCx + hh * Math.cos(angle);
            const ny = noseCy + hh * Math.sin(angle);
            if (this.isWall(nx, ny)) return false;
        }

        return true;
    },
    isWall: function(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        
        if (!mazeImageData || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
            return true;
        }

        const index = (y * canvas.width + x) * 4;
        const r = mazeImageData.data[index];
        const g = mazeImageData.data[index + 1];
        const b = mazeImageData.data[index + 2];
        const a = mazeImageData.data[index + 3];

        // Wall detection logic for black background + red walls:
        // The static snapshot is taken right after walls are drawn (red on black).
        // Red wall pixels: r=255, g=0, b=0  → isWall = true
        // Black path pixels: r=0,   g=0, b=0  → isWall = false
        // Green solution pixels are drawn later and don't affect the snapshot.
        // A pixel counts as a wall if it is significantly non-black.
        return a > 100 && (r > 80 || g > 80 || b > 80);
    },
    move: function(dx, dy) {
        // Block movement when game is over
        if (gameOver || timerFinished) return;

        // --- Update facing angle based on movement direction ---
        if (dx !== 0 || dy !== 0) {
            this.facing = Math.atan2(dy, dx);
        }

        // --- Timer: start on first movement ---
        if (!timerRunning && !timerFinished) {
            timerRunning = true;
            timerStartMs = Date.now();
            // Lock size and speed sliders once the player starts moving
            const sizeSlider  = document.getElementById('sizeSlider');
            const speedSlider = document.getElementById('speedSlider');
            if (sizeSlider)  sizeSlider.disabled  = true;
            if (speedSlider) speedSlider.disabled = true;
        }

        // Break movement into smaller 1px steps to prevent tunneling through thin walls.
        // For each step, try the combined move first; if blocked, try each axis
        // independently so the character slides along the wall instead of stopping.
        const steps = Math.max(Math.ceil(Math.abs(dx)), Math.ceil(Math.abs(dy)));
        const stepX = dx / steps;
        const stepY = dy / steps;

        for (let i = 0; i < steps; i++) {
            const nextX = this.x + stepX;
            const nextY = this.y + stepY;

            if (this.canMove(nextX, nextY)) {
                // Combined move works — move diagonally
                this.x = nextX;
                this.y = nextY;
            } else {
                // Try sliding along X only
                const movedX = this.canMove(nextX, this.y);
                if (movedX) this.x = nextX;

                // Try sliding along Y only
                const movedY = this.canMove(this.x, nextY);
                if (movedY) this.y = nextY;

                // If neither axis is free, fully blocked — stop
                if (!movedX && !movedY) break;
            }
        }

        // --- Check clock pickups ---
        const charCx = this.x + this.width / 2;
        const charCy = this.y + this.height / 2;
        clockPickups.forEach(clock => {
            if (!clock.collected && Math.hypot(charCx - clock.x, charCy - clock.y) < 12) {
                clock.collected = true;
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
        });

        // --- Win: reached the exit before time ran out ---
        if (timerRunning && !timerFinished && !gameOver && this.y + this.height >= EXIT_Y) {
            timerRunning   = false;
            timerFinished  = true;
            timerElapsedMs = Date.now() - timerStartMs;
            addToLeaderboard(timerElapsedMs);

            const remaining  = getTimeRemaining();
            const collected  = clockPickups.filter(c => c.collected).length;
            setTimeout(() => {
                Swal.fire({
                    title: '<span style="font-family:Orbitron,sans-serif;color:#3CB043">ESCAPED! &#127881;</span>',
                    html: `
                      <div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">
                        <p style="color:#3CB043;font-size:1rem">Nibbles made it out!</p>
                        <hr style="border-color:#3CB04333;margin:10px 0">
                        <p>&#9201; Time taken: <b style="color:#fff">${formatTime(timerElapsedMs)}</b></p>
                        <p>&#9201; Time remaining: <b style="color:#FFD700">${formatTime(remaining)}</b></p>
                        <p>&#128336; Clocks collected: <b style="color:#FFD700">${collected} / ${CLOCKS_COUNT}</b></p>
                      </div>
                    `,
                    background: '#0d0d18',
                    color: '#ccc',
                    confirmButtonText: 'Play Again',
                    confirmButtonColor: '#3CB043',
                    width: '400px',
                    customClass: { popup: 'swal-game-popup' }
                }).then(() => { resetGame(); });
            }, 200);
        }

        this.draw();
    }
};

// Keyboard controls
const keys = {};

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop for smooth movement
function gameLoop() {
    let dx = 0;
    let dy = 0;

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        dy = -character.speed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        dy = character.speed;
    }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        dx = -character.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        dx = character.speed;
    }

    // Normalize diagonal speed so it matches straight movement
    if (dx !== 0 && dy !== 0) {
        const norm = character.speed / Math.sqrt(2);
        dx = Math.sign(dx) * norm;
        dy = Math.sign(dy) * norm;
    }

    if (dx !== 0 || dy !== 0) {
        character.move(dx, dy);
    } else {
        character.draw();
    }

    updateTimerDisplay();
    requestAnimationFrame(gameLoop);
}

// Load maze image data for collision detection
function loadMazeCollisionData() {
    const mazeCanvas = document.getElementById('mazeCanvas');

    // Poll until LineDraw.js has painted walls onto mazeCanvas.
    // A painted canvas has at least one dark (wall) pixel.
    const checkInterval = setInterval(() => {
        const mazeCtx = mazeCanvas.getContext('2d');
        const imageData = mazeCtx.getImageData(0, 0, mazeCanvas.width, mazeCanvas.height);

        let hasPainted = false;
        for (let i = 0; i < imageData.data.length; i += 4) {
            // Look for a red wall pixel (r high, g+b low)
            if (imageData.data[i] > 200 && imageData.data[i + 1] < 50 && imageData.data[i + 2] < 50) {
                hasPainted = true;
                break;
            }
        }

        if (hasPainted) {
            clearInterval(checkInterval);
            mazeImageData = imageData;
            console.log('Maze collision data loaded from canvas');
            generateClocks(CLOCKS_COUNT);
            updateClocksDisplay();
        }
    }, 100);
}

// Wait for page to load
window.addEventListener('load', () => {
    character.draw();
    gameLoop();
    loadMazeCollisionData();
    setTimeout(showStoryIntro, 600);
});
