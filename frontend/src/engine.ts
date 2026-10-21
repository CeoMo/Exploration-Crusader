export type Direction = "up" | "down" | "left" | "right";
export type State = "ready" | "running" | "paused" | "over";
export interface Body { x: number; y: number; radius: number }
export const WIDTH = 960;
export const HEIGHT = 540;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const overlaps = (a: Body, b: Body) => Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;

export class Expedition {
  state: State = "ready"; elapsed = 0; score = 0; spawnIn = 0.8;
  ship: Body = {x:125,y:270,radius:16}; hazards: Body[] = []; samples: Body[] = [];
  random: () => number;
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.state = 'ready'; this.elapsed = 0; this.score = 0; this.spawnIn = 0.8;
    this.ship = { x: 125, y: HEIGHT / 2, radius: 16 };
    this.hazards = []; this.samples = [];
  }
  start() { this.reset(); this.state = 'running'; }
  togglePause() {
    if (this.state === 'running') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'running';
  }
  update(dt: number, input: Set<Direction>) {
    if (this.state !== 'running') return;
    dt = clamp(dt, 0, 0.05);
    this.elapsed += dt;
    const dx = Number(input.has('right')) - Number(input.has('left'));
    const dy = Number(input.has('down')) - Number(input.has('up'));
    const length = Math.hypot(dx, dy) || 1;
    this.ship.x = clamp(this.ship.x + dx / length * 285 * dt, 24, WIDTH - 24);
    this.ship.y = clamp(this.ship.y + dy / length * 285 * dt, 24, HEIGHT - 24);
    const speed = 130 + Math.min(this.elapsed * 2, 170);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const y = 64 + this.random() * (HEIGHT - 128);
      this.hazards.push({ x: WIDTH + 55, y, radius: 30 + this.random() * 12 });
      // Separate each sample from its paired hazard, keeping both on screen.
      const sampleY = y > HEIGHT / 2 ? y - 150 : y + 150;
      this.samples.push({ x: WIDTH + 55, y: sampleY, radius: 10 });
      this.spawnIn = Math.max(0.9, 2 - this.elapsed / 90);
    }
    for (const item of [...this.hazards, ...this.samples]) item.x -= speed * dt;
    if (this.hazards.some(item => overlaps(this.ship, item))) { this.state = 'over'; return; }
    this.samples = this.samples.filter(item => {
      if (overlaps(this.ship, item)) { this.score++; return false; }
      return item.x > -60;
    });
    this.hazards = this.hazards.filter(item => item.x > -60);
  }
}
