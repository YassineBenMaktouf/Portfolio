export const VIEW = { w: 1200, h: 760 };
export const SX = 1.35;
export const SY = 0.82;

export const ISLANDS = [
  { id: 'about', num: 'I', cx: 215, cy: 575, R: 66, k: 0.7 },
  { id: 'education', num: 'II', cx: 450, cy: 455, R: 76, k: 2.2 },
  { id: 'experience', num: 'III', cx: 680, cy: 320, R: 80, k: 4.1 },
  { id: 'projects', num: 'IV', cx: 905, cy: 200, R: 88, k: 5.3 },
  { id: 'skills', num: 'V', cx: 1095, cy: 375, R: 62, k: 1.4 }
];

// harbour, landing point of islands I–V, exit point beyond V
export const ROUTE_POINTS = [[70, 716], [262, 640], [508, 528], [744, 390], [985, 262], [1060, 318], [1150, 300]];

export const COMPASS = { x: 960, y: 590 };
export const HARBOUR = { x: 70, y: 712 };
