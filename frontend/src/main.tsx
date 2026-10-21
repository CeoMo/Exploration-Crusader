import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SpaceScene,mountGame,type Snapshot} from './Game';
import {getLeaderboard,startRun,saveScore,type Entry} from './api';
import type {Direction} from './engine';
import './styles.css';
const initial:Snapshot={state:'ready',score:0,elapsed:0};
function App(){
 const host=useRef<HTMLDivElement>(null),scene=useRef<SpaceScene|null>(null);
 const [snapshot,setSnapshot]=useState(initial),[ready,setReady]=useState(false),[launching,setLaunching]=useState(false);
 const [run,setRun]=useState<string|null>(null),[notice,setNotice]=useState(''),[entries,setEntries]=useState<Entry[]>([]),[boardStatus,setBoardStatus]=useState('Loading leaderboard…');
 const [name,setName]=useState(''),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[muted,setMuted]=useState(false),[volume,setVolume]=useState(.35);
 const [best,setBest]=useState(()=>{try{return Number(localStorage.getItem('ec-best'))||0}catch{return 0}});
 const launchingRef=useRef(false);
 function refreshBoard(){setBoardStatus('Loading leaderboard…');getLeaderboard().then(rows=>{setEntries(rows);setBoardStatus(rows.length?'':'No flights logged yet. Set the first record.');}).catch(()=>setBoardStatus('Leaderboard unavailable. You can still fly.'));}
 useEffect(()=>{
   const instance=new SpaceScene(next=>{setReady(true);setSnapshot(previous=>previous.state===next.state&&previous.score===next.score&&Math.floor(previous.elapsed)===Math.floor(next.elapsed)?previous:next);});
   scene.current=instance;
   const game=mountGame(host.current!,instance);
   const pauseAway=()=>{if(instance.model.state==='running')instance.togglePause();};
   const visibility=()=>{if(document.hidden)pauseAway();};
   const keyboard=(event:KeyboardEvent)=>{
     if((event.target as HTMLElement).closest('input,button,a,textarea'))return;
     if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)&&instance.model.state==='running')event.preventDefault();
     if(['p','P','Escape'].includes(event.key)&&!event.repeat&&['running','paused'].includes(instance.model.state)){event.preventDefault();instance.togglePause();}
   };
   window.addEventListener('blur',pauseAway);document.addEventListener('visibilitychange',visibility);window.addEventListener('keydown',keyboard);
   refreshBoard();
   return()=>{window.removeEventListener('blur',pauseAway);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',keyboard);game.destroy(true);scene.current=null;};
 },[]);
 useEffect(()=>{scene.current?.setAudio(muted,volume)},[muted,volume,ready]);
 useEffect(()=>{if(snapshot.score>best){setBest(snapshot.score);try{localStorage.setItem('ec-best',String(snapshot.score))}catch{}}},[snapshot.score,best]);
 async function launch(){
   if(launchingRef.current||!ready||saving)return;
   launchingRef.current=true;setLaunching(true);setNotice('');setSaved(false);
   if(scene.current?.model.state==='running')scene.current.togglePause();
   try{setRun((await startRun()).id);}catch{setRun(null);setNotice('Practice mode: the score service is unavailable.');}
   scene.current?.start();host.current?.focus({preventScroll:true});
   launchingRef.current=false;setLaunching(false);
 }
 function resume(){scene.current?.togglePause();host.current?.focus({preventScroll:true});}
 async function submit(event:React.FormEvent){
   event.preventDefault();if(!run||saving||saved)return;setSaving(true);setNotice('');
   try{await saveScore(run,name,snapshot.score,snapshot.elapsed);setSaved(true);setNotice('Flight saved to the leaderboard.');refreshBoard();}catch(error){setNotice(error instanceof Error?error.message:'Unable to save score.');}finally{setSaving(false);}
 }
 const state=snapshot.state;
 const title=state==='ready'?'The unknown awaits.':state==='paused'?'Take a breath.':'One more frontier?';
 const directionButton=(direction:Direction,label:string)=><button key={direction} aria-label={`Fly ${direction}`} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);scene.current?.held.add(direction)}} onPointerUp={()=>scene.current?.held.delete(direction)} onPointerCancel={()=>scene.current?.held.delete(direction)} onLostPointerCapture={()=>scene.current?.held.delete(direction)}>{label}</button>;
 return <main className="mission">
 <header className="masthead"><a className="brand" href="/">✦ EC <span className="brand-sub">EXPLORATION DIVISION</span></a><span className="signal">DEEP SPACE NETWORK</span></header>
 <section className="intro"><div><p className="eyebrow">YOUR NEXT FRONTIER</p><h1>Exploration <span>Crusader.</span></h1><p className="subtitle">A little courage. A lot of cosmos. How far will you go?</p></div><span className="edition">DEEP SPACE<br/>EXPEDITION / 02</span></section>
 <section className="cockpit" aria-label="Space exploration game"><div className="telemetry"><div><span>SAMPLES</span><strong>{String(snapshot.score).padStart(2,'0')}</strong></div><div><span>FLIGHT TIME</span><strong>{String(Math.floor(snapshot.elapsed/60)).padStart(2,'0')}:{String(Math.floor(snapshot.elapsed%60)).padStart(2,'0')}</strong></div><div><span>PERSONAL BEST</span><strong>{String(best).padStart(2,'0')}</strong></div><span className="status">{state==='running'?'IN FLIGHT':state.toUpperCase()}</span></div>
 <div className="viewport"><div ref={host} className="game-host" tabIndex={0} role="application" aria-label="Space game. Use arrow keys or WASD to move; P to pause."/>
 {state!=='running'&&<div className="overlay"><div className="overlay-card"><p className="eyebrow">{state==='ready'?'MISSION BRIEFING':state==='paused'?'FLIGHT ON HOLD':'EXPEDITION COMPLETE'}</p><h2>{title}</h2><p>{state==='over'?`${snapshot.score} samples collected in ${Math.floor(snapshot.elapsed)} seconds.`:'Collect glowing meteor samples. Steer clear of black holes. Make every flight count.'}</p><button className="primary" disabled={!ready||launching||saving} onClick={state==='paused'?resume:launch}>{!ready?'Preparing ship…':launching?'Connecting…':state==='paused'?'Resume expedition ↗':state==='over'?'Fly again ↗':'Launch expedition ↗'}</button><p className="hint">ARROW KEYS / WASD TO PILOT</p></div></div>}
 <span className="sector">SECTOR 07 / UNCHARTED SPACE</span></div>
 <div className="toolbar"><div className="actions"><button disabled={!['running','paused'].includes(state)||launching} onClick={resume}>{state==='paused'?'Resume':'Pause'} <kbd>P</kbd></button><button disabled={state==='ready'||launching||saving} onClick={launch}>Restart ↺</button></div><div className="audio"><button aria-pressed={muted} onClick={()=>setMuted(!muted)}>Sound {muted?'off':'on'}</button><input aria-label="Audio volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={event=>setVolume(Number(event.target.value))}/></div></div></section>
 <div className="touch-controls" aria-label="Directional controls">{directionButton('up','↑')}<div>{directionButton('left','←')}{directionButton('down','↓')}{directionButton('right','→')}</div></div>
 <p className="notice" role="status">{notice}</p><p className="sr-only" aria-live="polite">{state==='over'?`Expedition ended with ${snapshot.score} samples.`:state}</p>
 {state==='over'&&run&&<form className="score-form" onSubmit={submit}><div><h3>Log your expedition</h3><p>Your pilot name and score will appear publicly.</p></div><label>Pilot name<input maxLength={20} pattern="[A-Za-z0-9 _\-]+" required value={name} disabled={saving||saved} onChange={event=>setName(event.target.value)} placeholder="Choose a callsign"/></label><button className="primary" disabled={saving||saved||!name.trim()}>{saved?'Saved ✓':saving?'Saving…':'Submit score ↗'}</button></form>}
 <section className="guide"><article><span className="guide-icon cyan">✧</span><div><h3>Collect the extraordinary</h3><p>Each meteor sample adds to your score.</p></div></article><article><span className="guide-icon violet">◉</span><div><h3>Respect the unknown</h3><p>Avoid the dark center of each black hole.</p></div></article><article><span className="guide-icon orange">↗</span><div><h3>Go a little further</h3><p>The longer you survive, the faster space moves.</p></div></article></section>
 <section className="leaderboard"><div className="board-heading"><div><p className="eyebrow">FLIGHT RECORDS</p><h2>Across the frontier.</h2></div><button onClick={refreshBoard}>Refresh ↻</button></div><p role="status">{boardStatus}</p>{entries.length>0&&<table><thead><tr><th>Rank</th><th>Pilot</th><th>Samples</th><th>Time</th></tr></thead><tbody>{entries.map((entry,index)=><tr key={index}><td>{String(index+1).padStart(2,'0')}</td><td>{entry.nickname}</td><td>{entry.score}</td><td>{Math.floor(entry.duration)}s</td></tr>)}</tbody></table>}</section>
 <footer><span>BUILT BY MOHAMED DIALLO</span><a href="https://github.com/CeoMo/Exploration-Crusader">View source ↗</a></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
