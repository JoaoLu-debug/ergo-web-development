// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initVolumeSlider();
  initAudioVisualizer();
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
  gsap.set(["#slide2", "#slide3", "#slide4"], { opacity: 0, y: 40, autoAlpha: 0 });

  // Main scroll timeline to drive the slideshow and vertical progress bar
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-height-trigger",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8, // Smooth scrub delay
      invalidateOnRefresh: true
    }
  });

  // 1. Animate vertical progress bar fill from 0% to 100%
  mainTl.to(progressFill, {
    height: "100%",
    ease: "none"
  }, 0);

  // 2. Slide 1 out, Slide 2 in
  mainTl
    .to("#slide1", {
      opacity: 0,
      y: -40,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.15)
    .to("#slide2", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.25);

  // 3. Slide 2 out, Slide 3 in
  mainTl
    .to("#slide2", {
      opacity: 0,
      y: -40,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.45)
    .to("#slide3", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.55);

  // 4. Slide 3 out, Slide 4 in
  mainTl
    .to("#slide3", {
      opacity: 0,
      y: -40,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.75)
    .to("#slide4", {
      opacity: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.85);
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
   Canvas Ambient Sound Waveform (Siri / Apple Style)
   ========================================================================== */
function initAudioVisualizer() {
  const canvas = document.getElementById("visualizerCanvas");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const card = document.getElementById("playerCard");

  if (!canvas || !playBtn || !playIcon || !card) return;

  const ctx = canvas.getContext("2d");
  let animationId = null;
  let isPlaying = false;
  let phase = 0;
  
  // Set initial dimensions and adapt on resize
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Wave rendering parameters
  const wavesCount = 3;
  const colors = [
    "rgba(255, 255, 255, 0.4)",
    "rgba(249, 115, 22, 0.35)", // Orange accent highlight
    "rgba(255, 255, 255, 0.15)"
  ];
  const frequencies = [0.03, 0.05, 0.02];
  const speeds = [0.08, 0.12, 0.05];
  const baseAmplitudes = [12, 8, 16];
  
  // Wave state for smooth fading
  let globalAmplitudeMultiplier = 0;

  function drawWaveform() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Smooth transition between playing/paused visual states
    if (isPlaying) {
      globalAmplitudeMultiplier += (1 - globalAmplitudeMultiplier) * 0.1;
    } else {
      globalAmplitudeMultiplier += (0 - globalAmplitudeMultiplier) * 0.1;
    }

    const centerY = canvas.height / 2;

    for (let i = 0; i < wavesCount; i++) {
      ctx.beginPath();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = i === 0 ? 2 : 1;
      
      const freq = frequencies[i];
      const speed = speeds[i] * (isPlaying ? 1 : 0.2); // Slower movement when paused
      const amp = baseAmplitudes[i] * globalAmplitudeMultiplier;
      
      phase += speed * 0.005; 

      for (let x = 0; x < canvas.width; x++) {
        // Apply vertical envelope to fade waves near edges
        const envelope = Math.sin((x / canvas.width) * Math.PI);
        const y = centerY + Math.sin(x * freq + phase + i * 2) * amp * envelope;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    if (isPlaying || globalAmplitudeMultiplier > 0.005) {
      animationId = requestAnimationFrame(drawWaveform);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  playBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
      card.classList.add("playing");
      playIcon.className = "ph ph-pause";
      if (!animationId) drawWaveform();
    } else {
      card.classList.remove("playing");
      playIcon.className = "ph ph-play";
    }
  });

  // Skip buttons visual press feedback
  const skipBtns = [document.getElementById("prevBtn"), document.getElementById("nextBtn")];
  skipBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      gsap.fromTo(btn.querySelector("i"), 
        { rotate: 0 }, 
        { rotate: btn.id === "prevBtn" ? -90 : 90, duration: 0.4, ease: "back.out(1.7)" }
      );
    });
  });
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
    const button = form.querySelector("button");
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
