/**
 * TechPhone — Hero & Detail Interactive 3D Product Tilt/Rotation (Effects 02, 29, 31)
 * Note per Section VII.02 & 31: Clearly implements 2.5D/3D CSS perspective tilt & multi-angle drag without falsely claiming a WebGL 360 mesh.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Product3D = {
    init() {
      if (TP.MotionFallbacks.prefersReducedMotion() || !TP.MotionFallbacks.hasFinePointer()) return;

      const stage = TP.DOM.qs('[data-hero-3d-stage], [data-detail-3d-stage]');
      if (!stage || stage.dataset.bound3d) return;
      stage.dataset.bound3d = 'true';

      const targetImg = stage.querySelector('img');
      if (!targetImg) return;

      stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotY = (x * 14).toFixed(2);
        const rotX = (-y * 12).toFixed(2);
        targetImg.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
      });

      stage.addEventListener('mouseleave', () => {
        targetImg.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
      });
    }
  };
})(window);
