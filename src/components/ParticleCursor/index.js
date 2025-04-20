import React, { useEffect } from 'react';
import { useParticle } from '../../contexts/ParticleContext';
import './styles.css';

const ParticleCursor = () => {
  const { particleSettings } = useParticle();

  useEffect(() => {
    if (!particleSettings.enabled) return;

    let animationFrameId;
    const particles = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    class Particle {
      constructor(x, y, isClick = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * (isClick ? particleSettings.particleSize * 2 : particleSettings.particleSize) + 1;
        this.speedX = isClick ? (Math.random() - 0.5) * 8 : (Math.random() * 2 - 1);
        this.speedY = isClick ? (Math.random() - 0.5) * 8 : (Math.random() * 2 - 1);
        this.life = 0;
        this.maxLife = isClick ? 40 : 20;
        this.alpha = 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        this.alpha = 1 - this.life/this.maxLife;
        if (this.size > 0.1) this.size -= 0.1;
        return this.life <= this.maxLife;
      }

      draw() {
        ctx.fillStyle = `${particleSettings.particleColor}${Math.floor(this.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const addParticles = (x, y, isClick = false) => {
      const count = isClick ? particleSettings.clickParticleCount : particleSettings.trailParticleCount;
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, isClick));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let i = particles.length;
      while (i--) {
        const isAlive = particles[i].update();
        if (isAlive) {
          particles[i].draw();
        } else {
          particles.splice(i, 1);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    let throttleTimer;
    const throttledMouseMove = (e) => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          addParticles(e.clientX, e.clientY);
          throttleTimer = null;
        }, 16);
      }
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    if (particleSettings.trailEnabled) {
      window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    }
    if (particleSettings.clickEnabled) {
      window.addEventListener('click', (e) => addParticles(e.clientX, e.clientY, true), { passive: true });
    }

    resizeCanvas();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(throttleTimer);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', throttledMouseMove);
      window.removeEventListener('click', addParticles);
      document.body.removeChild(canvas);
    };
  }, [particleSettings]);

  return null;
};

export default React.memo(ParticleCursor);