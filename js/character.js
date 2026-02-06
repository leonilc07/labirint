const canvas = document.getElementById('characterCanvas');
const ctx = canvas.getContext('2d');

let mazeImageData = null;

const character = {
    x: 388,
    y: 4,
    width: 12,
    height: 12,
    color: '#3CB043',
    speed: 2,
    draw: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width, this.y + this.height / 2, this.height / 2, Math.PI / 2, -Math.PI / 2, true);
        ctx.fill();
    },
    canMove: function(newX, newY) {
        // Check canvas boundaries first
        if (newX < 0 || newX + this.width > canvas.width ||
            newY < 0 || newY + this.height > canvas.height) {
            return false;
        }

        if (!mazeImageData) {
            return true;
        }

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

        // Wall detection logic:
        // 1. Must be visible (alpha > 100)
        // 2. Must be dark (RGB < 200). 
        // Note: The red solution line is R=255, so it will NOT count as a wall (255 < 200 is false).
        // Background is white (255, 255, 255), so it won't count as a wall.
        // Walls are black or dark gray, so they will trigger this.
        return a > 100 && r < 200 && g < 200 && b < 200;
    },
    move: function(dx, dy) {
        // Break movement into smaller steps if moving fast to prevent tunneling
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        const stepX = dx / steps;
        const stepY = dy / steps;

        for (let i = 0; i < steps; i++) {
            const nextX = this.x + stepX;
            const nextY = this.y + stepY;
            
            if (this.canMove(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            } else {
                // If we hit a wall, stop movement in this direction
                break;
            }
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

    if (dx !== 0 || dy !== 0) {
        character.move(dx, dy);
    } else {
        // Redraw to keep character on top if needed
        character.draw();
    }

    requestAnimationFrame(gameLoop);
}

// Load maze image data for collision detection
function loadMazeCollisionData() {
    // Wait for SVG to be loaded and inserted into DOM
    const checkSVG = setInterval(() => {
        const svgElement = document.querySelector('.maze-container svg');
        if (svgElement) {
            clearInterval(checkSVG);
            
            // Serialize the current SVG DOM to preserve any styles
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            img.onload = function() {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Fill white background first (important for transparency)
                tempCtx.fillStyle = '#FFFFFF';
                tempCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                mazeImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                
                URL.revokeObjectURL(url);
                console.log('Maze collision data loaded');
            };
            
            img.src = url;
        }
    }, 100);
}

// Wait for page to load
window.addEventListener('load', () => {
    character.draw();
    gameLoop();
    setTimeout(() => {
        loadMazeCollisionData();
    }, 1000);
});
