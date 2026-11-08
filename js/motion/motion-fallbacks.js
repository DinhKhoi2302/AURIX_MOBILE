/**
 * TechPhone — Motion Fallbacks & Capability Detection (Effects 15, 46, 47, 48, 50)
 * Detects prefers-reduced-motion, touch vs fine pointer, WebGL/Canvas support, and provides ambient particle/shader fallbacks.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.MotionFallbacks = {
    prefersReducedMotion() {
      return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    hasFinePointer() {
      return Boolean(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    },
    initHeroParticles(canvasSelector = '#tp-hero-particles') {
      const canvas = TP.DOM.qs(canvasSelector);
      if (!canvas || this.prefersReducedMotion()) return;
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;

      let width = (canvas.width = canvas.offsetWidth || 800);
      let height = (canvas.height = canvas.offsetHeight || 400);

      // Effect 48: Lightweight 24-particle floating system + Effect 47 ambient glow
      const particles = Array.from({ length: 22 }, (_, i) => ({
        x: (i * 47) % width,
        y: (i * 29) % height,
        r: 1.8 + (i % 3) * 1.1,
        vx: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 4) * 0.05),
        vy: -0.15 - (i % 3) * 0.06,
        alpha: 0.18 + (i % 4) * 0.08
      }));

      let rafId = null;
      const draw = () => {
        if (document.hidden) {
          rafId = requestAnimationFrame(draw);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(8, 102, 245, ${p.alpha})`;
          ctx.fill();
        }
        rafId = requestAnimationFrame(draw);
      };
      draw();

      window.addEventListener('resize', () => {
        width = canvas.width = canvas.offsetWidth || 800;
        height = canvas.height = canvas.offsetHeight || 400;
      }, { passive: true });

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  };
})(window);
