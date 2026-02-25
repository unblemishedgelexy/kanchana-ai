'use client';

import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const LAPTOP_CURSOR_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1024px)';

type CursorStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
  alpha: number;
  twinkle: number;
};

const LaptopCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const trailingRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const spawnAccumulatorRef = useRef(0);
  const starsRef = useRef<CursorStar[]>([]);
  const starsContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const viewportRef = useRef({ width: 0, height: 0 });
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname() || '';
  const isHomeTrail = pathname === '/app/home';

  useEffect(() => {
    const media = window.matchMedia(LAPTOP_CURSOR_QUERY);
    const sync = () => setEnabled(media.matches);

    sync();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
    } else if (typeof media.addListener === 'function') {
      media.addListener(sync);
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', sync);
      } else if (typeof media.removeListener === 'function') {
        media.removeListener(sync);
      }
    };
  }, []);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const starsCanvas = starsCanvasRef.current;

    if (!enabled || !dot || !ring || !starsCanvas) {
      document.body.classList.remove('cursor-laptop-active');
      return;
    }

    document.body.classList.add('cursor-laptop-active');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let visible = false;

    const resizeStarsCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      viewportRef.current.width = width;
      viewportRef.current.height = height;

      starsCanvas.width = Math.round(width * dpr);
      starsCanvas.height = Math.round(height * dpr);
      starsCanvas.style.width = `${width}px`;
      starsCanvas.style.height = `${height}px`;

      const ctx = starsCanvas.getContext('2d');
      starsContextRef.current = ctx;
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }
    };

    const clearStars = () => {
      starsRef.current = [];
      spawnAccumulatorRef.current = 0;
      const ctx = starsContextRef.current;
      if (ctx) {
        ctx.clearRect(0, 0, viewportRef.current.width, viewportRef.current.height);
      }
    };

    const setVisible = (nextVisible: boolean) => {
      if (visible === nextVisible) return;
      visible = nextVisible;
      dot.classList.toggle('cursor-visible', nextVisible);
      ring.classList.toggle('cursor-visible', nextVisible);
      starsCanvas.classList.toggle('stars-visible', nextVisible && isHomeTrail && !prefersReducedMotion);
    };

    const updateHoverState = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;

      const interactiveTarget = target.closest(
        'a,button,input,textarea,select,label,[role="button"],[data-cursor-hover]'
      );
      const isInteractive = Boolean(interactiveTarget);
      dot.classList.toggle('cursor-hovering', isInteractive);
      ring.classList.toggle('cursor-hovering', isInteractive);
    };

    const spawnStars = (x: number, y: number, velocityX: number, velocityY: number, speed: number) => {
      if (!isHomeTrail || prefersReducedMotion || !visible) return;

      spawnAccumulatorRef.current += Math.min(4.2, speed * 2.8 + 0.15);
      let spawnCount = Math.floor(spawnAccumulatorRef.current);
      if (spawnCount <= 0) return;

      spawnAccumulatorRef.current -= spawnCount;
      spawnCount = Math.min(spawnCount, 6);
      const stars = starsRef.current;

      const direction = Math.atan2(velocityY || 0.0001, velocityX || 1);
      for (let i = 0; i < spawnCount; i += 1) {
        const spread = (Math.random() - 0.5) * 0.95;
        const reverseAngle = direction + Math.PI + spread;
        const burstSpeed = 0.7 + Math.min(2.4, speed * 1.15) + Math.random() * 0.75;

        stars.push({
          x: x - Math.cos(direction) * (Math.random() * 8),
          y: y - Math.sin(direction) * (Math.random() * 8),
          vx: Math.cos(reverseAngle) * burstSpeed,
          vy: Math.sin(reverseAngle) * burstSpeed,
          size: 0.8 + Math.random() * 1.6 + Math.min(1.3, speed * 0.5),
          life: 0,
          ttl: 280 + Math.random() * 420,
          alpha: 0.45 + Math.random() * 0.45,
          twinkle: Math.random() * Math.PI * 2,
        });
      }

      if (stars.length > 190) {
        stars.splice(0, stars.length - 190);
      }
    };

    const drawStars = (deltaMs: number) => {
      const ctx = starsContextRef.current;
      const width = viewportRef.current.width;
      const height = viewportRef.current.height;
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      if (!isHomeTrail || prefersReducedMotion || !visible) return;

      const stars = starsRef.current;
      if (stars.length === 0) return;

      const step = deltaMs / 16.67;
      for (let index = stars.length - 1; index >= 0; index -= 1) {
        const star = stars[index];
        star.life += deltaMs;

        if (star.life >= star.ttl) {
          stars.splice(index, 1);
          continue;
        }

        const progress = star.life / star.ttl;
        const decay = 1 - progress;

        star.x += star.vx * step;
        star.y += star.vy * step;
        star.vx *= Math.pow(0.94, step);
        star.vy *= Math.pow(0.94, step);
        star.vy += 0.004 * step;

        const twinkle = 0.7 + Math.sin(star.twinkle + star.life * 0.024) * 0.3;
        const radius = star.size * (0.75 + twinkle * 0.45) * decay;

        if (
          radius <= 0.05 ||
          star.x < -30 ||
          star.y < -30 ||
          star.x > width + 30 ||
          star.y > height + 30
        ) {
          stars.splice(index, 1);
          continue;
        }

        const alpha = star.alpha * decay;

        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.strokeStyle = `rgba(196,181,253,${Math.max(0, alpha * 0.72)})`;
        ctx.lineWidth = Math.max(0.45, radius * 0.35);
        ctx.beginPath();
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, radius);
        ctx.stroke();

        ctx.fillStyle = `rgba(248,250,252,${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.25, radius * 0.36), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const onMove = (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      pointerRef.current.x = x;
      pointerRef.current.y = y;

      const now = performance.now();
      const previousMove = lastMoveRef.current;
      const deltaTime = previousMove.time > 0 ? Math.max(8, now - previousMove.time) : 16;
      const deltaX = x - previousMove.x;
      const deltaY = y - previousMove.y;
      const speed = Math.hypot(deltaX, deltaY) / deltaTime;
      lastMoveRef.current = { x, y, time: now };

      if (!visible) {
        trailingRef.current.x = x;
        trailingRef.current.y = y;
        gsap.set(dot, { x, y });
        gsap.set(ring, { x, y });
        setVisible(true);
      }

      gsap.set(dot, { x, y });
      updateHoverState(event.target);
      spawnStars(x, y, deltaX, deltaY, speed);
    };

    const onDown = () => {
      ring.classList.add('cursor-pressed');
    };

    const onUp = () => {
      ring.classList.remove('cursor-pressed');
    };

    const onLeave = () => {
      setVisible(false);
      ring.classList.remove('cursor-pressed');
      ring.classList.remove('cursor-hovering');
      dot.classList.remove('cursor-hovering');
      clearStars();
      lastMoveRef.current.time = 0;
    };

    const animate = (time: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = time;
      }
      const deltaMs = Math.min(34, time - lastFrameTimeRef.current || 16.67);
      lastFrameTimeRef.current = time;

      trailingRef.current.x += (pointerRef.current.x - trailingRef.current.x) * 0.22;
      trailingRef.current.y += (pointerRef.current.y - trailingRef.current.y) * 0.22;
      gsap.set(ring, {
        x: trailingRef.current.x,
        y: trailingRef.current.y,
      });
      drawStars(deltaMs);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    resizeStarsCanvas();
    setVisible(false);
    frameRef.current = window.requestAnimationFrame(animate);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
    window.addEventListener('resize', resizeStarsCanvas, { passive: true });
    document.addEventListener('visibilitychange', onLeave, { passive: true });

    return () => {
      document.body.classList.remove('cursor-laptop-active');
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastFrameTimeRef.current = 0;
      clearStars();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resizeStarsCanvas);
      document.removeEventListener('visibilitychange', onLeave);
    };
  }, [enabled, isHomeTrail]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={starsCanvasRef} className="laptop-cursor-stars" />
      <div ref={dotRef} className="laptop-cursor-dot" />
      <div ref={ringRef} className="laptop-cursor-ring" />
    </>
  );
};

export default LaptopCursor;
