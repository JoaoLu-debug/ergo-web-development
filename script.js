// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundAnimation();
  initScrollAnimations();
  initContactForm();
  initFolderHover();
});

/* ==========================================================================
   Background Image Sequence Animation (Canvas with Capped Resolution)
   ========================================================================== */
const frameCount = 151;
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
    const targetWidth = 320;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    
    bgCanvas.width = targetWidth;
    bgCanvas.height = Math.round(targetWidth / aspect);
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

const frameAspect = 320 / 137; // Constant aspect ratio cached globally for speed

// Custom cover scale rendering logic (simulates CSS object-fit: cover on Canvas)
function drawCoverImage(img, ctx, canvasWidth, canvasHeight) {
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, x, y;
  
  if (frameAspect > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * frameAspect;
    x = (canvasWidth - drawWidth) / 2;
    y = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / frameAspect;
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

  // Initialize initial states for slides with blur
  gsap.set("#slide1", { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)" });
  gsap.set(["#slide2", "#slide4"], { opacity: 0, y: 30, autoAlpha: 0, filter: "blur(8px)" });
  gsap.set("#slide3", { opacity: 0, y: 30, autoAlpha: 0 });
  gsap.set("#slide3Text", { filter: "blur(8px)" });

  // Main scroll timeline to drive the slideshow, background canvas, and progress bar
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-height-trigger",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8, // Optimized scrub catching speed (highly responsive)
      invalidateOnRefresh: true
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

  // 3. Slide 1 out, Slide 2 in (Smooth transitions with hold zones)
  mainTl
    .to("#slide1", {
      opacity: 0,
      y: -30,
      filter: "blur(8px)",
      autoAlpha: 0,
      duration: 0.15,
      ease: "power2.in"
    }, 0.20)
    .to("#slide2", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      autoAlpha: 1,
      duration: 0.15,
      ease: "power2.out"
    }, 0.20);

  // 4. Slide 2 out, Slide 3 in (Slide 3 text unblurs, parent remains sharp)
  mainTl
    .to("#slide2", {
      opacity: 0,
      y: -30,
      filter: "blur(8px)",
      autoAlpha: 0,
      duration: 0.15,
      ease: "power2.in"
    }, 0.50)
    .to("#slide3", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.15,
      ease: "power2.out"
    }, 0.50)
    .to("#slide3Text", {
      filter: "blur(0px)",
      duration: 0.15,
      ease: "power2.out"
    }, 0.50)
    // Fade in 3D Folder specifically on Slide 3
    .to("#folderContainer", {
      display: "flex",
      opacity: 1,
      scale: 1,
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
      ease: "power2.in"
    }, 0.80)
    .to("#slide3Text", {
      filter: "blur(8px)",
      duration: 0.15,
      ease: "power2.in"
    }, 0.80)
    .to("#slide4", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      autoAlpha: 1,
      duration: 0.15,
      ease: "power2.out"
    }, 0.80)
    // Fade out 3D Folder on Slide 4
    .to("#folderContainer", {
      opacity: 0,
      scale: 0.9,
      autoAlpha: 0,
      duration: 0.15,
      display: "none",
      ease: "sine.inOut"
    }, 0.80);
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

/* ==========================================================================
   Slide 3 Plans Folder Hover Interaction
   ========================================================================== */
function initFolderHover() {
  const folder = document.getElementById("folderContainer");
  const card = document.getElementById("playerCard");
  
  if (!folder || !card) return;
  
  // Mouseenter on the folder container -> show the plans layout
  folder.addEventListener("mouseenter", () => {
    card.classList.add("show-plans");
  });
  
  // Mouseleave from the player card entirely -> reset back to default slide text
  card.addEventListener("mouseleave", () => {
    card.classList.remove("show-plans");
  });
}
