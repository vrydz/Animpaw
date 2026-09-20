import { useEffect, useRef, type MouseEvent } from 'react';
import { cardTilt } from './cardTilt';

// Pointer movement writes CSS once per frame; it never rerenders the card tree.
export function useCardTilt(disabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef({ x: 0, y: 0 });
  const reset = () => {
    cancelAnimationFrame(frame.current); frame.current = 0;
    const node = ref.current;
    if (!node) return;
    node.removeAttribute('data-tilted');
    for (const name of ['--tilt-x','--tilt-y','--shine-x','--shine-y']) node.style.removeProperty(name);
  };
  useEffect(() => {
    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    const stop = () => { if (disabled || document.hidden || !hover.matches) reset(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) reset(); });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener('visibilitychange', stop); hover.addEventListener('change', stop); stop();
    return () => { reset(); observer.disconnect(); document.removeEventListener('visibilitychange', stop); hover.removeEventListener('change', stop); };
  }, [disabled]);
  const move = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || document.hidden || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    point.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const tilt = cardTilt(point.current.x - rect.left, point.current.y - rect.top, rect.width, rect.height);
      node.style.setProperty('--tilt-x', `${tilt.rx}deg`); node.style.setProperty('--tilt-y', `${tilt.ry}deg`);
      node.style.setProperty('--shine-x', `${tilt.gx}%`); node.style.setProperty('--shine-y', `${tilt.gy}%`);
      node.setAttribute('data-tilted', 'true');
    });
  };
  return { ref, move, reset };
}
