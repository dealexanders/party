// oneko.js
// Based on https://github.com/adryd325/oneko.js with custom CTA/RSVP glue.
// Single-file script: kitten, CTA show/expand, RSVP handling, touch support, a11y.

(function oneko() {
  // Respect reduced motion
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) return;

  // DOM refs (resolved after DOM is ready via 'defer', but also guarded below)
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------
  // 1) CAT / SPRITES / SOUNDS
  // ---------------------------
  const nekoEl = document.createElement("div");

  let nekoPosX = 32;
  let nekoPosY = 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const nekoSpeed = 10;

  // Audio elements (optional)
  const purrSound = new Audio('./cat-purring.wav');
  const dizzySound = new Audio('./cat-dizzy.wav');

  // Sound state tracking
  let isPurring = false;
  let lastClickTime = 0;
  const clickCooldown = 1000; // ms

  // CTA state tracking
  let ctaVisible = false;
  let ctaExpanded = false;

  // === Webhook to Make.com (Telegram automation) ===
const WEBHOOK_URL = 'https://hook.eu2.make.com/z5w20n7fbr698ff20i59y4pibm5c8bkb';

  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function initCat() {
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;

    let nekoFile = "./oneko.gif";
    const curScript = document.currentScript;
    if (curScript && curScript.dataset && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat;
    }
    nekoEl.style.backgroundImage = `url(${nekoFile})`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    document.addEventListener("click", (event) => {
      const now = Date.now();
      if (now - lastClickTime >= clickCooldown) {
        lastClickTime = now;
        playDizzySound();
      }
    });

    // CTA click handler: expand when clicking on the CTA box
    document.addEventListener("click", (event) => {
      const cta = $('#cta');
      if (cta && cta.contains(event.target) && ctaVisible) {
        event.stopPropagation();
        expandCTA();
      }
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;
  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;

    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function startPurring() {
    if (isPurring) return;
    isPurring = true;
    purrSound.loop = true;
    purrSound.volume = 0.3;
    purrSound.play().catch(() => {});
  }

  function stopPurring() {
    if (!isPurring) return;
    isPurring = false;
    purrSound.pause();
    purrSound.currentTime = 0;
  }

  function playDizzySound() {
    dizzySound.volume = 0.5;
    dizzySound.currentTime = 0;
    dizzySound.play().catch(() => {});
  }

  function showCTA() {
    if (ctaVisible) return;
    ctaVisible = true;
    const cta = $('#cta');
    if (cta) {
      cta.classList.add('visible');
      cta.setAttribute('aria-expanded', 'false');
    }
  }

  function expandCTA() {
    if (ctaExpanded) return;
    ctaExpanded = true;
    const cta = $('#cta');
    if (cta) {
      cta.classList.add('expanded');
      cta.setAttribute('aria-expanded', 'true');
    }
  }

  function idle() {
    idleTime += 1;

    // Start purring after a short idle
    if (idleTime > 5) startPurring();

    // Random idle animations
    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation == null) {
      let options = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) options.push("scratchWallW");
      if (nekoPosY < 32) options.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) options.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) options.push("scratchWallS");
      idleAnimation = options[Math.floor(Math.random() * options.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  // Keep the cat outside the expanded CTA area
  function enforceCTACollision() {
    const cta = $('#cta');
    if (!cta || !cta.classList.contains('visible') || !cta.classList.contains('expanded')) return;

    const rect = cta.getBoundingClientRect();
    const catRadius = 16; // logical sprite radius

    const left = rect.left + catRadius;
    const right = rect.right - catRadius;
    const top = rect.top + catRadius;
    const bottom = rect.bottom - catRadius;

    const isInside =
      nekoPosX > left && nekoPosX < right && nekoPosY > top && nekoPosY < bottom;
    if (!isInside) return;

    const distLeft = Math.abs(nekoPosX - left);
    const distRight = Math.abs(right - nekoPosX);
    const distTop = Math.abs(nekoPosY - top);
    const distBottom = Math.abs(bottom - nekoPosY);
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft)      nekoPosX = left;
    else if (minDist === distRight) nekoPosX = right;
    else if (minDist === distTop)   nekoPosY = top;
    else                            nekoPosY = bottom;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) { // near cursor: idle/animate
      idle();
      return;
    }

    stopPurring();  // moving -> stop purr
    showCTA();      // first move -> reveal CTA

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = '';
    direction += diffY / distance >  0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance >  0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction || "idle", frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    enforceCTACollision();

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top  = `${nekoPosY - 16}px`;
  }

// Send RSVP data to Make.com webhook as form-urlencoded (avoids CORS preflight)
function sendWebhook(name, decision) {
  const data = new URLSearchParams({
    name: name,
    decision: decision
  }).toString();

  // Try beacon first (reliable when user navigates away); falls back to fetch
  const blob = new Blob([data], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
  const beaconsent = (navigator.sendBeacon && navigator.sendBeacon(WEBHOOK_URL, blob));

  if (!beaconsent) {
    // Fallback: regular POST; keepalive helps on page unload
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: data,
      keepalive: true
    }).catch(() => { /* ignore network errors to not break UI */ });
  }
}


  // ---------------------------
  // 2) CTA / RSVP / ACCESSIBILITY
  // ---------------------------
  function initUI() {
    const cta = $('#cta');
    const instructions = $('#instructions');
    const nameInput = $('#guestName');
    const nameEcho = $('#guestNameEcho');
    const btnYes = $('#btnYes');
    const btnNo = $('#btnNo');
    const resultBox = $('#rsvpResult');

    // Hide instructions after first click or move
    let hasInteracted = false;
    const hideOnce = () => {
      if (hasInteracted) return;
      hasInteracted = true;
      if (instructions) instructions.classList.add('hidden');
    };
    document.addEventListener('click', hideOnce, { passive: true });
    document.addEventListener('mousemove', hideOnce, { passive: true });

    // Keyboard: allow Enter/Space to expand CTA when visible
    if (cta) {
      cta.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && cta.classList.contains('visible')) {
          e.preventDefault();
          cta.click(); // oneko.js click handler will expand
        }
      });

      // Mirror expanded class to aria-expanded for a11y
      const obs = new MutationObserver(() => {
        cta.setAttribute('aria-expanded', cta.classList.contains('expanded') ? 'true' : 'false');
      });
      obs.observe(cta, { attributes: true, attributeFilter: ['class'] });
    }

    // RSVP glue
    const STORAGE_KEY = 'party-rsvp';

    // Reflect name into the text
    if (nameInput && nameEcho) {
      nameInput.addEventListener('input', () => {
        const n = nameInput.value.trim();
        nameEcho.textContent = n || 'юзернейм';
      });
    }

    function showResult(name, choice, restored = false) {
      if (!resultBox) return;
      if (!name) {
        resultBox.style.display = 'block';
        resultBox.textContent = 'Будь ласка, введи своє імʼя 😊';
        return;
      }
      const yesMsg = `Дякуємо, ${name}! Чекаємо на тебе 🎈`;
      const noMsg  = `Шкода, ${name}. Якщо щось зміниться — дай знати.`;
      resultBox.textContent = choice === 'yes' ? yesMsg : noMsg;
      resultBox.style.display = 'block';
      if (!restored) resultBox.animate([{opacity:0},{opacity:1}], { duration: 180 });
    }

    function handle(choice) {
      const name = (nameInput && nameInput.value || '').trim();
    
      // Map internal flag to the exact visible text you want to send
      const decisionText = choice === 'yes' ? 'Я прийду' : 'Я не прийду';
    
      // Show result message in the UI (keeps your current UX)
      showResult(name, choice);
    
      // If name is missing, focus the field and stop (do NOT send)
      if (!name) {
        if (nameInput) nameInput.focus();
        return;
      }
    
      // Persist locally (optional—kept as-is)
      try {
        localStorage.setItem('party-rsvp', JSON.stringify({ name, choice, at: new Date().toISOString() }));
      } catch (_) {}
    
      // >>> Send to Make.com webhook <<<
      sendWebhook(name, decisionText);
    }

    if (btnYes) btnYes.addEventListener('click', () => handle('yes'));
    if (btnNo)  btnNo .addEventListener('click', () => handle('no'));

    // Touch support: convert touch moves to mousemove so the cat follows on mobile
    const forwardTouch = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY, bubbles: true }));
    };
    window.addEventListener('touchstart', forwardTouch, { passive: true });
    window.addEventListener('touchmove',  forwardTouch, { passive: true });
  }

  // ---------------------------
  // 3) BOOT
  // ---------------------------
  function boot() {
    initCat();
    initUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
