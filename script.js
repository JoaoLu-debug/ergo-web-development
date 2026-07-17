// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundAnimation();
  initScrollAnimations();
  initVolumeSlider();
  initContactForm();
});

/* ==========================================================================
   Background Image Sequence Animation (Canvas with Capped Resolution)
   ========================================================================== */
const frameCount = 270;
const currentFramePath = index => `fluid/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;
const bgImages = [];
const bgAnimationState = { frame: 0 };
let bgCanvas, bgContext;

function initBackgroundAnimation() {
  bgCanvas = document.getElementById("bgCanvas");
  if (!bgCanvas) return;
  
  bgContext = bgCanvas.getContext("2d");
  
  // Set capped internal canvas resolution (width capped to 1280px)
  // Lowers pixel processing demands by up to 80% on high-DPI displays.
  // The CSS blur(12px) filters out any low-res artifacts, making it look beautifully soft and smooth.
  function resizeBgCanvas() {
    const maxWidth = 1280;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    
    if (w > maxWidth) {
      bgCanvas.width = maxWidth;
      bgCanvas.height = Math.round(maxWidth / aspect);
    } else {
      bgCanvas.width = w;
      bgCanvas.height = h;
    }
    renderBgFrame();
  }
  window.addEventListener("resize", resizeBgCanvas);
  
  // Preload and pre-decode all 270 frames
  let firstLoaded = false;
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFramePath(i);
    
    // Call HTML5 decode API to decompress image into GPU cache immediately
    // This removes micro-stutters/lag during scrolling because decoding is done beforehand.
    if (img.decode) {
      img.decode().catch(() => { /* silent fallback */ });
    }
    
    if (i === 1) {
      img.onload = () => {
        firstLoaded = true;
        resizeBgCanvas();
      };
    }
    bgImages.push(img);
  }
  
  if (firstLoaded) resizeBgCanvas();
}

function renderBgFrame() {
  if (bgImages.length === 0 || !bgCanvas || !bgContext) return;
  
  const activeFrameIndex = Math.min(bgAnimationState.frame, frameCount - 1);
  const img = bgImages[activeFrameIndex];
  
  if (img && (img.complete || img.naturalWidth > 0)) {
    drawCoverImage(img, bgContext, bgCanvas.width, bgCanvas.height);
  }
}

// Custom cover scale rendering logic (simulates CSS object-fit: cover on Canvas)
function drawCoverImage(img, ctx, canvasWidth, canvasHeight) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, x, y;
  
  if (imgRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    x = (canvasWidth - drawWidth) / 2;
    y = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    x = 0;
    y = (canvasHeight - drawHeight) / 2;
  }
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

/* ==========================================================================
   GSAP Scroll-Driven Inner Slideshow & Background Sync
   ========================================================================== */
function initScrollAnimations() {
  const card = document.getElementById("playerCard");
  const progressFill = document.getElementById("progressFill");
  if (!card || !progressFill) return;

  // Initialize initial states for slides
  gsap.set("#slide1", { opacity: 1, y: 0, autoAlpha: 1 });
  gsap.set(["#slide2", "#slide3", "#slide4"], { opacity: 0, y: 30, autoAlpha: 0 });

  // Main scroll timeline to drive the slideshow, background canvas, and progress bar
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-height-trigger",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8, // Optimized scrub catching speed (highly responsive)
      invalidateOnRefresh: true,
      onUpdate: () => {
        renderBgFrame();
      }
    }
  });

  // 1. Animate vertical progress bar fill from 0% to 100%
  mainTl.to(progressFill, {
    height: "100%",
    ease: "none"
  }, 0);

  // 2. Animate background canvas frames from 0 to 269
  mainTl.to(bgAnimationState, {
    frame: frameCount - 1,
    snap: "frame",
    ease: "none",
    duration: 1.0,
    onUpdate: renderBgFrame
  }, 0);

  // 3. Slide 1 out, Slide 2 in (Smooth overlapping transitions)
  mainTl
    .to("#slide1", {
      opacity: 0,
      y: -30,
      autoAlpha: 0,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.15)
    .to("#slide2", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.20);

  // 4. Slide 2 out, Slide 3 in
  mainTl
    .to("#slide2", {
      opacity: 0,
      y: -30,
      autoAlpha: 0,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.45)
    .to("#slide3", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.50);

  // 5. Slide 3 out, Slide 4 in
  mainTl
    .to("#slide3", {
      opacity: 0,
      y: -30,
      autoAlpha: 0,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.75)
    .to("#slide4", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.15,
      ease: "sine.inOut"
    }, 0.80);
}

/* ==========================================================================
   Interactive Volume Control (Mouse/Touch Drag Math)
   ========================================================================== */
function initVolumeSlider() {
  const container = document.getElementById("volumeContainer");
  const track = container.querySelector(".slider-track");
  const handle = document.getElementById("sliderHandle");
  const valText = document.getElementById("volumeValue");

  if (!container || !track || !handle || !valText) return;

  let isDragging = false;
  let volume = 54; // Initial volume

  function updateVolume(clientX) {
    const rect = track.getBoundingClientRect();
    const trackWidth = rect.width;
    let offsetX = clientX - rect.left;
    
    offsetX = Math.max(0, Math.min(offsetX, trackWidth));
    const percentage = (offsetX / trackWidth) * 100;
    
    volume = Math.round((offsetX / trackWidth) * 100);
    valText.textContent = volume;
    handle.style.left = `${percentage}%`;
  }

  container.addEventListener("pointerdown", (e) => {
    isDragging = true;
    container.setPointerCapture(e.pointerId);
    updateVolume(e.clientX);
  });

  container.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    updateVolume(e.clientX);
  });

  const handleRelease = (e) => {
    if (isDragging) {
      isDragging = false;
      container.releasePointerCapture(e.pointerId);
    }
  };
  
  container.addEventListener("pointerup", handleRelease);
  container.addEventListener("pointercancel", handleRelease);
}

/* ==========================================================================
   Compact Inline Contact Form Submission
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    const value = input.value.trim();

    if (!value) return;

    gsap.to(form, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      onComplete: () => {
        form.innerHTML = `<p class="player-desc" style="color: #22c55e; font-weight: 500;"><i class="ph ph-check-circle" style="vertical-align: middle; margin-right: 4px;"></i> e-mail recebido. entraremos em contato!</p>`;
        gsap.to(form, { opacity: 1, y: 0, duration: 0.3 });
      }
    });
  });
}
