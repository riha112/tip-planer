(function() {
let isEnabled = false;

  const scene = document.getElementById('scene');
  const ball = document.getElementById('ball');

  const RADIUS = 60; // half of 120px
  const GRAVITY = 2200;      // px/s^2
  const RESTITUTION = 0.72;  // bounciness
  const FRICTION = 0.985;    // horizontal damping on floor contact
  const AIR_DRAG = 0.999;

  let width = window.innerWidth;
  let height = window.innerHeight;

  let x = width / 2 - RADIUS;
  let y = height / 2 - RADIUS;
  let vx = 120;
  let vy = 0;

  let dragging = false;
  let dragPointerId = null;
  let lastPointerX = 0, lastPointerY = 0;
  let lastTime = 0;
  let velocityHistory = []; // for smoother throw velocity

  let squishX = 1, squishY = 1;
  let squishTargetX = 1, squishTargetY = 1;

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
  });

  function pointerDown(e) {
    dragging = true;
    dragPointerId = e.pointerId;
    ball.setPointerCapture(e.pointerId);
    const rect = scene.getBoundingClientRect();
    lastPointerX = e.clientX - rect.left;
    lastPointerY = e.clientY - rect.top;
    lastTime = performance.now();
    velocityHistory = [];
    vx = 0;
    vy = 0;
  }

  function pointerMove(e) {
    if (!isEnabled) return;
    if (!dragging || e.pointerId !== dragPointerId) return;
    const rect = scene.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const now = performance.now();
    const dt = Math.max((now - lastTime) / 1000, 0.001);

    const dx = px - lastPointerX;
    const dy = py - lastPointerY;

    // move ball center to pointer
    x = px - RADIUS;
    y = py - RADIUS;

    // track instantaneous velocity samples
    velocityHistory.push({ vx: dx / dt, vy: dy / dt, t: now });
    // keep only recent ~100ms of samples
    velocityHistory = velocityHistory.filter(s => now - s.t < 100);

    // squish in direction of motion while dragging
    const speed = Math.hypot(dx, dy);
    if (speed > 1) {
      const stretch = Math.min(1 + speed / 80, 1.35);
      const angle = Math.atan2(dy, dx);
      squishTargetX = 1 + (stretch - 1) * Math.abs(Math.cos(angle));
      squishTargetY = 1 + (stretch - 1) * Math.abs(Math.sin(angle));
    }

    lastPointerX = px;
    lastPointerY = py;
    lastTime = now;
  }

  function pointerUp(e) {
    if (!isEnabled) return;

    if (!dragging || e.pointerId !== dragPointerId) return;
    dragging = false;
    ball.releasePointerCapture(e.pointerId);

    // compute average velocity from recent samples for a natural throw
    if (velocityHistory.length > 0) {
      let sumVx = 0, sumVy = 0;
      for (const s of velocityHistory) {
        sumVx += s.vx;
        sumVy += s.vy;
      }
      vx = sumVx / velocityHistory.length;
      vy = sumVy / velocityHistory.length;
    } else {
      vx = 0;
      vy = 0;
    }
  }

  ball.style.touchAction = 'none';
  ball.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  window.addEventListener('pointercancel', pointerUp);

    const SCROLL_FORCE = 0.9; // px/s of velocity per unit of wheel delta

function checkBodyScrollPosition() {
  const el = document.body;
  const scrollTop = window.scrollY || el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = window.innerHeight;

  const isAtTop = scrollTop <= 0;
  const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

  return isAtTop || isAtBottom;
};

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
    if (!isEnabled) return;

    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (checkBodyScrollPosition()) {
        return;
    }

    // Body scroll down -> force up
    // Body scroll up   -> force down
    const impulse = -deltaY * SCROLL_FORCE;
    vy += impulse;

    // Small squish reaction so the force feels tangible
    const factor = Math.min(Math.abs(impulse) / 900, 0.35);

    if (impulse < 0) {
        // Being pushed up: stretch vertically
        squishTargetY = 1 + factor;
        squishTargetX = 1 - factor * 0.6;
    } else if (impulse > 0) {
        // Being pushed down: squash
        squishTargetY = 1 - factor * 0.6;
        squishTargetX = 1 + factor;
    }
    }, { passive: true });

  let prevTime = performance.now();

  function step(now) {
    if (!isEnabled) return;

    let dt = (now - prevTime) / 1000;
    dt = Math.min(dt, 0.032); // clamp for stability
    prevTime = now;

    if (!dragging) {
      vy += GRAVITY * dt;
      vx *= AIR_DRAG;

      x += vx * dt;
      y += vy * dt;

      const floorY = height - RADIUS * 2;
      const ceilingY = 0;
      const leftX = 0;
      const rightX = width - RADIUS * 2;

      let bounced = false;
      let impactSpeed = 0;

      if (y > floorY) {
        y = floorY;
        if (vy > 30) {
          impactSpeed = vy;
          vy = -vy * RESTITUTION;
          bounced = true;
        } else {
          vy = 0;
        }
        vx *= FRICTION;
      }
      if (y < ceilingY) {
        y = ceilingY;
        vy = -vy * RESTITUTION;
        bounced = true;
      }
      if (x < leftX) {
        x = leftX;
        vx = -vx * RESTITUTION;
        bounced = true;
      }
      if (x > rightX) {
        x = rightX;
        vx = -vx * RESTITUTION;
        bounced = true;
      }

      if (bounced && impactSpeed > 200) {
        const factor = Math.min(impactSpeed / 1400, 0.5);
        squishTargetX = 1 + factor;
        squishTargetY = 1 - factor * 0.7;
        setTimeout(() => {}, 0);
      } else if (bounced) {
        squishTargetX = 1.15;
        squishTargetY = 0.9;
      }
    }

    // ease squish back to normal
    squishX += (squishTargetX - squishX) * 0.35;
    squishY += (squishTargetY - squishY) * 0.35;
    squishTargetX += (1 - squishTargetX) * 0.12;
    squishTargetY += (1 - squishTargetY) * 0.12;

    ball.style.transform =
      `translate(${x}px, ${y}px) scale(${squishX}, ${squishY})`;

    requestAnimationFrame(step);
  }


  PIPE.subscribe(EVENTS.onConfigUpdate, (key, value) => {
    if (key !== 'hideStressBall') return;

    isEnabled = value;
    if (isEnabled) {
      requestAnimationFrame(step);
    }
  });
})();