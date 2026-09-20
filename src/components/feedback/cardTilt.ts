export function cardTilt(x: number, y: number, width: number, height: number) {
  const nx = Math.max(0, Math.min(1, x / Math.max(1, width)));
  const ny = Math.max(0, Math.min(1, y / Math.max(1, height)));
  return { rx: (ny - .5) * -8, ry: (nx - .5) * 8, gx: nx * 100, gy: ny * 100 };
}
