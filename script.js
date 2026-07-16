// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initVolumeSlider();
  initContactForm();
});

/* ==========================================================================
   GSAP Scroll-Driven Inner Slideshow
   ========================================================================== */
function initScrollAnimations() {
  const card = document.getElementById("playerCard");
  const progressFill = document.getElementById("progressFill");
  if (!card || !progressFill) return;

  // Initialize initial states for slides
  // Slide 1 starts active and visible
  gsap.set("#slide1", { opacity: 1, y: 0, autoAlpha: 1 });
  // Slides 2, 3, 4 start offset and hidden
  gsap.set(["#slide2", "#slide3", "#slide4"], { opacity: 0, y: 30, autoAlpha: 0 });

  // Main scroll timeline to drive the slideshow and vertical progress bar
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-height-trigger",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // High scrub value for liquid, smooth scroll inertia
      invalidateOnRefresh: true
    }
  });

  // 1. Animate vertical progress bar fill from 0% to 100%
  mainTl.to(progressFill, {
    height: "100%",
    ease: "none"
  }, 0);

  // 2. Slide 1 out, Slide 2 in (Smooth overlapping transitions)
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

  // 3. Slide 2 out, Slide 3 in
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

  // 4. Slide 3 out, Slide 4 in
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
    
    // Clamp offset to track bounds
    offsetX = Math.max(0, Math.min(offsetX, trackWidth));
    const percentage = (offsetX / trackWidth) * 100;
    
    volume = Math.round((offsetX / trackWidth) * 100);
    valText.textContent = volume;
    handle.style.left = `${percentage}%`;
  }

  // Pointer Down
  container.addEventListener("pointerdown", (e) => {
    isDragging = true;
    container.setPointerCapture(e.pointerId);
    updateVolume(e.clientX);
  });

  // Pointer Move
  container.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    updateVolume(e.clientX);
  });

  // Pointer Up / Cancel
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

    // Visual feedback for successful submit
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
