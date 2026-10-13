export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (v, amount) => ({ x: v.x * amount, y: v.y * amount });
export const length = (v) => Math.hypot(v.x, v.y);
export const normalize = (v) => { const size = length(v); return size === 0 ? { x: 1, y: 0 } : scale(v, 1 / size); };
export const fromAngle = (angle) => ({ x: Math.cos(angle), y: Math.sin(angle) });
export const rotate = (v, angle) => ({ x: v.x * Math.cos(angle) - v.y * Math.sin(angle), y: v.x * Math.sin(angle) + v.y * Math.cos(angle) });
