(function() {
if (localStorage.getItem('yuki')) {
    return;
}

const deadline = new Date("2026-09-01T00:00:00");

if (new Date() > deadline) {
    return;
}

let hdom = document.createElement('div');
hdom.id = 'HBDY';
hdom.innerHTML = `
<canvas id="hpdcanvas"></canvas>
<div class="hpdcanvas-text">
    <h1>HAPPY<br>BIRTHDAY 🎉</h1>
    <p>🦴🐩🦴🐩🦴🐩🦴🐩🦴🐩🦴🐩🦴🐩🦴🐩🦴</p>
</div>
`;
document.body.append(hdom);

const canvas = document.getElementById("hpdcanvas");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
});


// ===============================
// CONFETTI PARTICLES
// ===============================

const particles = [];

const colors = [
    "#ff004c",
    "#ffea00",
    "#00ff88",
    "#00aaff",
    "#ff00cc",
    "#ff7700",
    "#ffffff",
    "#9b5cff"
];


class Particle {

    constructor(x, y, angle, speed) {

        this.x = x;
        this.y = y;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.width = 6 + Math.random() * 8;
        this.height = 8 + Math.random() * 14;

        this.gravity = 0.25 + Math.random() * 0.15;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed =
            (Math.random() - 0.5) * 0.3;

        this.color =
            colors[Math.floor(Math.random() * colors.length)];

        this.life = 1;
    }


    update() {

        // Gravity
        this.vy += this.gravity;

        // Air resistance
        this.vx *= 0.995;
        this.vy *= 0.995;

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Rotate
        this.rotation += this.rotationSpeed;

        // Remove when far below screen
        if (this.y > H + 100) {
            this.life = 0;
        }
    }


    draw() {

        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.globalAlpha = this.life;

        ctx.fillStyle = this.color;

        ctx.fillRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();
    }
}


// ===============================
// SHOOT CONFETTI
// ===============================

function shoot(x, y, direction) {

    for (let i = 0; i < 150; i++) {

        // Random upward angle
        const angle =
            direction === "left"
            ? random(-Math.PI + 0.2, -0.2)
            : random(-Math.PI + 0.2, -0.2);

        // Make left/right cannons point outward
        let finalAngle;

        if (direction === "left") {
            finalAngle = random(-2.9, -1.0);
        } else {
            finalAngle = random(-2.1, -0.2);
        }

        const speed = random(10, 22);

        particles.push(
            new Particle(
                x,
                y,
                finalAngle,
                speed
            )
        );
    }
}


// ===============================
// CENTER EXPLOSION
// ===============================

function explode(x, y) {

    for (let i = 0; i < 250; i++) {

        const angle =
            Math.random() * Math.PI * 2;

        const speed =
            random(5, 20);

        particles.push(
            new Particle(
                x,
                y,
                angle,
                speed
            )
        );
    }
}


function random(min, max) {
    return Math.random() * (max - min) + min;
}


// ===============================
// ANIMATION LOOP
// ===============================

function animate() {

    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {

        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();


// ===============================
// START PARTY
// ===============================

function party() {

    // Big center blast
    explode(
        W / 2,
        H * 0.75
    );


    // Left cannon
    shoot(
        W * 0.08,
        H * 0.9,
        "left"
    );


    // Right cannon
    shoot(
        W * 0.92,
        H * 0.9,
        "right"
    );


    // More explosions
    setTimeout(() => {

        explode(
            W * 0.25,
            H * 0.65
        );

        explode(
            W * 0.75,
            H * 0.65
        );

    }, 700);


    setTimeout(() => {

        shoot(
            W * 0.05,
            H * 0.9,
            "left"
        );

        shoot(
            W * 0.95,
            H * 0.9,
            "right"
        );

    }, 1400);


    setTimeout(() => {

        explode(
            W / 2,
            H * 0.5
        );

    }, 2200);


    setTimeout(() => {

        explode(
            W * 0.3,
            H * 0.55
        );

        explode(
            W * 0.7,
            H * 0.55
        );

    }, 3000);

}
 setTimeout(() => {
    hdom.remove();
 }, 7000);
localStorage.setItem('yuki', '1');
// Start after page loads
window.onload = party;
})();
