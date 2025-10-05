// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

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
  
  // Audio elements
  const purrSound = new Audio('./cat-purring.wav');
  const dizzySound = new Audio('./cat-dizzy.wav');
  
  // Sound state tracking
  let isPurring = false;
  let isRunning = false;
  let lastDistance = 0;
  let lastClickTime = 0;
  const clickCooldown = 1000; // 1 second cooldown
  
  // CTA state tracking
  let ctaVisible = false;
  let ctaExpanded = false;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function init() {
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

    let nekoFile = "./oneko.gif"
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat
    }
    nekoEl.style.backgroundImage = `url(${nekoFile})`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    document.addEventListener("click", function (event) {
      const currentTime = Date.now();
      if (currentTime - lastClickTime >= clickCooldown) {
        lastClickTime = currentTime;
        playDizzySound();
      }
    });

    // CTA click handler
    document.addEventListener("click", function (event) {
      const cta = document.getElementById('cta');
      if (cta && cta.contains(event.target) && ctaVisible) {
        event.stopPropagation();
        expandCTA();
      }
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    // Stops execution if the neko element is removed from DOM
    if (!nekoEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp
      frame()
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
    if (!isPurring) {
      isPurring = true;
      purrSound.loop = true;
      purrSound.volume = 0.3;
      purrSound.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  function stopPurring() {
    if (isPurring) {
      isPurring = false;
      purrSound.pause();
      purrSound.currentTime = 0;
    }
  }

  function playDizzySound() {
    dizzySound.volume = 0.5;
    dizzySound.currentTime = 0; // Reset to beginning
    dizzySound.play().catch(e => console.log('Audio play failed:', e));
  }

  function stopRunningSound() {
    if (isRunning) {
      isRunning = false;
    }
  }

  function showCTA() {
    if (!ctaVisible) {
      ctaVisible = true;
      const cta = document.getElementById('cta');
      if (cta) {
        cta.classList.add('visible');
      }
    }
  }

  function expandCTA() {
    if (!ctaExpanded) {
      ctaExpanded = true;
      const cta = document.getElementById('cta');
      if (cta) {
        cta.classList.add('expanded');
      }
    }
  }

  function idle() {
    idleTime += 1;
    
    // Start purring when idle
    if (idleTime > 5) {
      startPurring();
    }

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  // Prevent the cat from entering the expanded CTA content zone
  function enforceCTACollision() {
    const cta = document.getElementById('cta');
    // Only enforce when CTA is both visible and expanded
    if (!cta || !cta.classList.contains('visible') || !cta.classList.contains('expanded')) return;

    const rect = cta.getBoundingClientRect();
    // Use the logical sprite radius (16px). If visually scaled, the cat will keep a margin.
    const catRadius = 16;

    const left = rect.left + catRadius;
    const right = rect.right - catRadius;
    const top = rect.top + catRadius;
    const bottom = rect.bottom - catRadius;

    const isInside = nekoPosX > left && nekoPosX < right && nekoPosY > top && nekoPosY < bottom;
    if (!isInside) return;

    const distLeft = Math.abs(nekoPosX - left);
    const distRight = Math.abs(right - nekoPosX);
    const distTop = Math.abs(nekoPosY - top);
    const distBottom = Math.abs(bottom - nekoPosY);
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft) {
      nekoPosX = left;
    } else if (minDist === distRight) {
      nekoPosX = right;
    } else if (minDist === distTop) {
      nekoPosY = top;
    } else {
      nekoPosY = bottom;
    }
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    // Stop purring when cat starts moving
    stopPurring();
    
    // Show CTA when cat starts moving
    showCTA();
    
    lastDistance = distance;
    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      // count down after being alerted before moving
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    // Keep the cat outside the CTA content zone when expanded
    enforceCTACollision();

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  init();
})();
