// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initVolumeSlider();
  initAudioVisualizer();
  initMobileMenu();
  initBentoHoverGlow();
});

/* ==========================================================================
   GSAP Scroll-Driven Card Docking Animation
   ========================================================================== */
function initScrollAnimations() {
  const card = document.getElementById("playerCard");
  if (!card) return;

  // Hero Timeline (handles card collapse and translation to bottom docking bar)
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=900", // Scroll depth for docking animation
      scrub: 1.2,
      pin: true,
      invalidateOnRefresh: true,
      onLeave: () => {
        card.classList.add("is-docked");
        // Clear styles so CSS fixed layout takes over cleanly
        gsap.set(card, { clearProps: "all" });
      },
      onEnterBack: () => {
        card.classList.remove("is-docked");
      }
    }
  });

  // Calculate dynamic translateY values based on screen size
  heroTl
    .to(card, {
      y: () => {
        const heroHeight = window.innerHeight;
        const cardHeight = card.offsetHeight;
        // Move the center-aligned card so its bottom docks 24px above viewport bottom
        return (heroHeight / 2) - (cardHeight / 2) - 24;
      },
      maxWidth: "640px",
      borderRadius: "20px",
      padding: "12px 24px",
      backgroundColor: "rgba(18, 18, 20, 0.85)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
      ease: "none"
    }, 0)
    // Fade out expanded elements
    .to(".player-desc, .player-header, #progressColumn, .prev-btn, .next-btn", {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      stagger: 0.05,
      ease: "none"
    }, 0)
    // Scale and morph main title
    .to(".player-title", {
      fontSize: "16px",
      fontWeight: "600",
      letterSpacing: "-0.01em",
      ease: "none"
    }, 0)
    // Adjust layout spacing and elements in card
    .to(".player-inner", {
      gap: "20px",
      gridTemplateColumns: "auto 1fr",
      ease: "none"
    }, 0)
    .to(".player-interactive", {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: "16px",
      width: "100%",
      ease: "none"
    }, 0)
    .to(".volume-container", {
      width: "160px",
      padding: "8px 14px",
      ease: "none"
    }, 0)
    .to(".visualizer-container", {
      width: "120px",
      height: "32px",
      ease: "none"
    }, 0)
    .to(".play-btn", {
      width: "36px",
      height: "36px",
      fontSize: "14px",
      ease: "none"
    }, 0)
    // Sync the progress indicator in vertical track
    .to("#progressFill", {
      height: "100%",
      ease: "none"
    }, 0)
    // Sync the docked progress bar indicator at top of card
    .to("#dockedProgressBar", {
      width: "100%",
      ease: "none"
    }, 0);

  // Parallax effect on fixed background image
  gsap.to(".bg-image", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: {
      trigger: "#content",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });

  // Reveal Stagger on sections text and cards
  const sections = document.querySelectorAll(".page-section");
  sections.forEach(section => {
    const title = section.querySelector(".section-title");
    const cards = section.querySelectorAll(".bento-card, .project-card, .about-text, .about-stats, .contact-card");

    if (title) {
      gsap.from(title, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: title,
          start: "top 85%"
        }
      });
    }

    if (cards.length > 0) {
      gsap.from(cards, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cards[0],
          start: "top 80%"
        }
      });
    }
  });
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
  let volume = 54; // Initial volume matching image mockup

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
    "rgba(249, 115, 22, 0.3)", // Orange accent highlight
    "rgba(255, 255, 255, 0.15)"
  ];
  const frequencies = [0.03, 0.05, 0.02];
  const speeds = [0.08, 0.12, 0.05];
  const baseAmplitudes = [12, 8, 16];
  
  // Wave state for smooth fading
  let globalAmplitudeMultiplier = 0; // Starts at flat line

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
      
      // Simple offset per wave
      phase += speed * 0.005; 

      for (let x = 0; x < canvas.width; x++) {
        // Apply vertical envelope to fade waves near edges (smooth fade out)
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

    // Keep running animation loop if not fully flattened
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
      // Temporary rotation scaling animation
      gsap.fromTo(btn.querySelector("i"), 
        { rotate: 0 }, 
        { rotate: btn.id === "prevBtn" ? -90 : 90, duration: 0.4, ease: "back.out(1.7)" }
      );
    });
  });
}

/* ==========================================================================
   Bento Cards Radial Hover Glow effect
   ========================================================================== */
function initBentoHoverGlow() {
  const cards = document.querySelectorAll(".bento-card");
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

/* ==========================================================================
   Mobile Nav Drawer
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const nav = document.querySelector(".nav-links");
  
  if (!toggle || !nav) return;
  
  toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
    const icon = toggle.querySelector("i");
    if (nav.classList.contains("active")) {
      icon.className = "ph ph-x";
      gsap.to(nav, { 
        display: "flex", 
        opacity: 1, 
        y: 0, 
        duration: 0.3, 
        ease: "power2.out" 
      });
    } else {
      icon.className = "ph ph-list";
      gsap.to(nav, { 
        opacity: 0, 
        y: -10, 
        duration: 0.2, 
        ease: "power2.in", 
        onComplete: () => gsap.set(nav, { clearProps: "all" }) 
      });
    }
  });

  // Close mobile nav when clicking a link
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("active")) {
        nav.classList.remove("active");
        toggle.querySelector("i").className = "ph ph-list";
        gsap.set(nav, { clearProps: "all" });
      }
    });
  });
}
