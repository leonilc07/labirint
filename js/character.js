const canvas = document.getElementById('characterCanvas');
const ctx = canvas.getContext('2d');

const character = {
    x: 388,
    y: 4,
    width: 12,
    height: 12,
    color: '#3CB043',
    draw: function () {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width, this.y + this.height / 2, this.height / 2, Math.PI / 2, -Math.PI / 2, true);
        ctx.fill();
    }
};

character.draw();
