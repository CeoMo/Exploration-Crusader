import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition, WIDTH, HEIGHT } from '../frontend/src/engine.ts';
test('movement is bounded and diagonal speed matches straight movement', () => {
  const a = new Expedition(); const b = new Expedition(); a.start(); b.start();
  a.update(.05,new Set(['right'])); b.update(.05,new Set(['right','down']));
  assert.ok(Math.abs(a.ship.x-125-Math.hypot(b.ship.x-125,b.ship.y-270))<1e-8);
  a.ship.x=WIDTH; a.ship.y=HEIGHT; a.update(.05,new Set(['right','down']));
  assert.equal(a.ship.x,WIDTH-24); assert.equal(a.ship.y,HEIGHT-24);
});
test('pause freezes simulation and restart fully resets a paused flight', () => {
  const g = new Expedition(); g.start(); g.update(.05,new Set(['up'])); g.togglePause();
  const snapshot=JSON.stringify(g); g.update(.05,new Set(['right'])); assert.equal(JSON.stringify(g),snapshot);
  g.start(); assert.equal(g.state,'running'); assert.equal(g.elapsed,0); assert.equal(g.ship.y,270);
});
test('collects adjacent samples without skipping and ends on hazard contact', () => {
  const g = new Expedition(); g.start(); g.samples=[{...g.ship,radius:10},{...g.ship,radius:10}];
  g.update(0,new Set()); assert.equal(g.score,2); assert.equal(g.samples.length,0);
  g.hazards=[{...g.ship,radius:30}]; g.update(0,new Set()); assert.equal(g.state,'over');
});
test('despawns old hazards and keeps generated samples clear of hazards', () => {
  const g = new Expedition(() => .5); g.start(); g.hazards=[{x:-100,y:100,radius:30}]; g.spawnIn=0;
  g.update(.01,new Set()); assert.equal(g.hazards.length,1);
  assert.ok(Math.abs(g.hazards[0].y-g.samples[0].y)>g.hazards[0].radius+g.samples[0].radius);
});
test('equal elapsed time produces equivalent travel at different frame rates', () => {
  const a = new Expedition(); const b = new Expedition(); a.start(); b.start();
  for(let i=0;i<30;i++) a.update(1/30,new Set(['right']));
  for(let i=0;i<144;i++) b.update(1/144,new Set(['right']));
  assert.ok(Math.abs(a.ship.x-b.ship.x)<1e-8);
});
