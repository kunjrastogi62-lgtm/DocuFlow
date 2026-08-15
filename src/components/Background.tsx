import React, { useEffect, useRef } from 'react';

export const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Handle Resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Particle System
    const particles: Particle[] = [];
    const numParticles = Math.min(60, (width * height) / 20000); // responsive number of particles

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 150, 255, ${this.alpha})`;
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(100, 150, 255, 0.8)';
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    // Moving Gradient Blobs
    let time = 0;

    const animate = () => {
      time += 0.002;
      ctx.clearRect(0, 0, width, height);

      // Base background
      const baseGradient = ctx.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, '#020617'); // slate-950
      baseGradient.addColorStop(1, '#0f172a'); // slate-900
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      // Gradient Blobs
      const createBlob = (x: number, y: number, r: number, color1: string, color2: string) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Moving blob 1 (Navy/Purple)
      const x1 = width / 2 + Math.cos(time) * width * 0.3;
      const y1 = height / 2 + Math.sin(time * 0.8) * height * 0.3;
      createBlob(x1, y1, width * 0.6, 'rgba(49, 46, 129, 0.15)', 'rgba(49, 46, 129, 0)'); // indigo-900

      // Moving blob 2 (Blue/Teal)
      const x2 = width / 2 + Math.cos(time * 1.2 + Math.PI) * width * 0.4;
      const y2 = height / 2 + Math.sin(time * 1.1 + Math.PI) * height * 0.4;
      createBlob(x2, y2, width * 0.5, 'rgba(30, 64, 175, 0.12)', 'rgba(30, 64, 175, 0)'); // blue-800

      // Reset shadow for blobs
      ctx.shadowBlur = 0;

      // Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
