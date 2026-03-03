const canvas = document.getElementById('characterCanvas');
const ctx = canvas.getContext('2d');

let mazeImageData = null;

// --- Timer state ---
const EXIT_Y  = 480;          // maze bottom exit (px)
let timerRunning  = false;
let timerFinished = false;
let timerStartMs  = 0;
let timerElapsedMs = 0;

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
    timerRunning  = false;
    timerFinished = false;
    timerStartMs  = 0;
    timerElapsedMs = 0;
    const timerEl = document.getElementById('timerDisplay');
    if (timerEl) {
        timerEl.textContent = '00:00:00';
        timerEl.classList.remove('timer-done');
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

function updateTimerDisplay() {
    const el = document.getElementById('timerDisplay');
    if (!el) return;
    if (timerRunning) {
        timerElapsedMs = Date.now() - timerStartMs;
    }
    el.textContent = formatTime(timerElapsedMs);
    if (timerFinished) {
        el.classList.add('timer-done');
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

        // --- Timer: stop when bottom edge of character reaches the exit wall ---
        if (timerRunning && !timerFinished && this.y + this.height >= EXIT_Y) {
            timerRunning  = false;
            timerFinished = true;
            timerElapsedMs = Date.now() - timerStartMs;
            addToLeaderboard(timerElapsedMs);
        }

        this.draw();
    }
};

// Keyboard controls
const keys = {};

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
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
        }
    }, 100);
}

// Wait for page to load
window.addEventListener('load', () => {
    character.draw();
    gameLoop();
    loadMazeCollisionData();
});
