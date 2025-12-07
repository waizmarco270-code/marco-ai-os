import React, { useEffect, useRef } from 'react';
import { ThemeColors } from '../types';

interface ParticleBackgroundProps {
  theme: ThemeColors;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });

  // Helper to map tailwind classes to approximate hex for canvas
  const getThemeColor = (twClass: string) => {
      if (twClass.includes('cyan')) return 'rgb(6, 182, 212)'; // cyan-500
      if (twClass.includes('blue')) return 'rgb(37, 99, 235)'; // blue-600
      if (twClass.includes('red')) return 'rgb(239, 68, 68)'; // red-500
      if (twClass.includes('green')) return 'rgb(34, 197, 94)'; // green-500
      if (twClass.includes('emerald')) return 'rgb(16, 185, 129)'; // emerald-500
      if (twClass.includes('fuchsia')) return 'rgb(217, 70, 239)'; // fuchsia-500
      if (twClass.includes('purple')) return 'rgb(126, 34, 206)'; // purple-700
      if (twClass.includes('pink')) return 'rgb(236, 72, 153)'; // pink-500
      if (twClass.includes('slate')) return 'rgb(148, 163, 184)'; // slate-400
      if (twClass.includes('neutral')) return 'rgb(163, 163, 163)'; // neutral-400
      if (twClass.includes('white')) return 'rgb(255, 255, 255)';
      if (twClass.includes('black')) return 'rgb(0, 0, 0)';
      return 'rgb(255, 255, 255)';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{
      x: number, 
      y: number, 
      vx: number, 
      vy: number, 
      size: number, 
      baseX: number, 
      baseY: number
    }> = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
    };

    const initParticles = () => {
      particles = [];
      // Adjust density based on screen size
      const particleCount = Math.min(100, (canvas.width * canvas.height) / 10000); 
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.5, // Slow drift
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const primaryColor = getThemeColor(theme.primary);
      const secondaryColor = getThemeColor(theme.secondary);

      // Draw Connections
      ctx.strokeStyle = primaryColor;
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Interaction with mouse
        if (mouseRef.current.isActive) {
          const dx = mouseRef.current.x - p1.x;
          const dy = mouseRef.current.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = 200;
          const force = (maxDistance - distance) / maxDistance;

          // Repel slightly if close to mouse for "forcefield" effect
          if (distance < maxDistance) {
            p1.x -= forceDirectionX * force * 2;
            p1.y -= forceDirectionY * force * 2;
          }
        }

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) { // Connection threshold
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            // Opacity based on distance
            ctx.globalAlpha = (1 - dist / 150) * 0.15;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Draw Particles
      particles.forEach((p, i) => {
        // Natural movement
        p.x += p.vx;
        p.y += p.vy;

        // Return to base slightly (elasticity) to prevent bunching
        // p.x += (p.baseX - p.x) * 0.005;
        // p.y += (p.baseY - p.y) * 0.005;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? secondaryColor : primaryColor;
        ctx.globalAlpha = 0.6 + (Math.sin(Date.now() * 0.002 + i) * 0.2); // Twinkle
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Mouse interactive highlight
      if (mouseRef.current.isActive) {
          const grad = ctx.createRadialGradient(
              mouseRef.current.x, mouseRef.current.y, 0, 
              mouseRef.current.x, mouseRef.current.y, 250
          );
          grad.addColorStop(0, primaryColor.replace(')', ', 0.1)'));
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
        {/* Static Glows for depth */}
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-${theme.primary} rounded-full blur-[150px] animate-pulse opacity-20`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-${theme.secondary} rounded-full blur-[120px] opacity-20`}></div>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default ParticleBackground;