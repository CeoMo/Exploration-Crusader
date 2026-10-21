import Phaser from 'phaser';
import { Expedition, type Direction, WIDTH, HEIGHT } from './engine';
export interface Snapshot { state: Expedition['state']; score: number; elapsed: number }
export class SpaceScene extends Phaser.Scene {
  model = new Expedition();
  held = new Set<Direction>();
  private graphic!: Phaser.GameObjects.Graphics;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private stars = Array.from({length:100}, () => ({x:Math.random()*WIDTH,y:Math.random()*HEIGHT,r:Math.random()*1.5+.5}));
  private music?: Phaser.Sound.BaseSound;
  private muted = false;
  private volume = .35;
  onUpdate: (snapshot:Snapshot) => void;
  constructor(onUpdate:(snapshot:Snapshot)=>void) { super('Space'); this.onUpdate=onUpdate; }
  preload() { this.load.audio('music','/gamemusic.mp3'); this.load.audio('collision','/Collison.mp3'); }
  create() {
    this.graphic=this.add.graphics();
    this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    this.input.keyboard?.disableGlobalCapture();
    this.music=this.sound.add('music',{loop:true,volume:1});
    this.notify();
  }
  start() { this.held.clear(); this.input.keyboard?.resetKeys(); this.model.start(); if(this.music){ this.music.stop(); this.music.play(); } this.notify(); }
  togglePause() { this.held.clear(); this.input.keyboard?.resetKeys(); this.model.togglePause(); this.syncAudio(); this.notify(); }
  setAudio(muted:boolean,volume:number) { this.muted=muted; this.volume=volume; this.sound.mute=muted; this.sound.volume=volume; }
  private syncAudio() { if(this.model.state==='running')this.music?.resume(); else this.music?.pause(); }
  private notify() {this.onUpdate({state:this.model.state,score:this.model.score,elapsed:this.model.elapsed});}
  update(_time:number, delta:number) {
    if(!this.graphic)return;
    const inputs=new Set(this.held);
    const bindings: Record<string,Direction>={W:'up',UP:'up',S:'down',DOWN:'down',A:'left',LEFT:'left',D:'right',RIGHT:'right'};
    for(const [key,direction] of Object.entries(bindings))if(this.keys?.[key].isDown)inputs.add(direction);
    const before=this.model.state;
    this.model.update(delta/1000,inputs);
    if(before==='running' && this.model.state==='over'){this.syncAudio();this.sound.play('collision');}
    this.renderField(); this.notify();
  }
  private renderField() {
    const g=this.graphic,t=this.model.elapsed;
    g.clear(); g.fillStyle(0x080d20); g.fillRect(0,0,WIDTH,HEIGHT);
    for(let i=9;i>0;i--){g.fillStyle(0x5d4590,.015);g.fillCircle(690,240,i*45);}
    for(const s of this.stars){g.fillStyle(0xd5eaff,.35+s.r/4);g.fillCircle(((s.x-t*s.r*20)%WIDTH+WIDTH)%WIDTH,s.y,s.r);}
    g.fillStyle(0x131c36);g.fillCircle(800,105,76);g.lineStyle(1,0x3b4968);g.strokeCircle(800,105,76);
    for(const h of this.model.hazards){
      for(let i=5;i>0;i--){g.fillStyle(0x9e74ef,.08);g.fillCircle(h.x,h.y,h.radius+i*4);}
      g.lineStyle(2,0xbc9aff,.8);g.strokeEllipse(h.x,h.y,h.radius*3.2,h.radius*1.1);
      g.fillStyle(0x02040b);g.fillCircle(h.x,h.y,h.radius);
    }
    for(const s of this.model.samples){g.fillStyle(0x8aede4,.12);g.fillCircle(s.x,s.y,22);g.fillStyle(0x9ffff0);g.fillPoints([{x:s.x,y:s.y-12},{x:s.x+9,y:s.y},{x:s.x,y:s.y+12},{x:s.x-9,y:s.y}],true);}
    const {x,y}=this.model.ship;
    g.fillStyle(0x64dfe9);g.fillTriangle(x-16,y-7,x-38-Math.sin(t*25)*7,y,x-16,y+7);
    g.fillStyle(0xe0ecff);g.fillPoints([{x:x+25,y},{x:x-20,y:y-17},{x:x-12,y},{x:x-20,y:y+17}],true);
    g.fillStyle(0x68d4de);g.fillTriangle(x+10,y,x-9,y-5,x-6,y+5);
  }
}
export function mountGame(parent:HTMLElement,scene:SpaceScene) {
  return new Phaser.Game({type:Phaser.AUTO,parent,width:WIDTH,height:HEIGHT,backgroundColor:'#080d20',scene:[scene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{disableWebAudio:false}});
}
