import React, { useEffect, useState } from "react";
import { SERVER_BASE } from "../config";

// NUS UUIDs
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export default function MicrobitConnector({ onEnergy }){
  const [connected,setConnected] = useState(false);
  const [log,setLog] = useState('');

  useEffect(()=>{
    // attempt to get previously granted devices (may work after first permission)
    if(navigator.bluetooth && navigator.bluetooth.getDevices){
      navigator.bluetooth.getDevices().then(list=>{
        const m = list.find(d => /micro|spin/i.test(d.name||''));
        if(m) connectToDevice(m);
      }).catch(err=>console.warn("getDevices:", err));
    }
  },[]);

  function append(s){ setLog(prev => (prev?prev + '\n':'') + s); }

  async function requestDevice(){
    try{
      append("Requesting device...");
      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ services: [NUS_SERVICE] }, { namePrefix: 'micro' }, { namePrefix: 'Spin' }],
        optionalServices: [NUS_SERVICE]
      });
      await connectToDevice(dev);
    }catch(e){
      append("Request failed: " + (e.message||e));
    }
  }

  async function connectToDevice(dev){
    try{
      append("Connecting to " + (dev.name || dev.id));
      const server = await dev.gatt.connect();
      const srv = await server.getPrimaryService(NUS_SERVICE);
      const tx = await srv.getCharacteristic(NUS_TX);
      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', (ev) => {
        const raw = new TextDecoder().decode(ev.target.value);
        append("RX: " + raw.trim());
        // parse ENERGY:xx
        const m = raw.match(/ENERGY:\s*([0-9]+(?:\.[0-9]+)?)/i);
        if(m){
          const v = parseFloat(m[1]);
          if(!isNaN(v)) onEnergy && onEnergy(v);
        }
      });
      setConnected(true);
      dev.addEventListener('gattserverdisconnected', ()=>{ append('Disconnected'); setConnected(false); });
      append("Connected.");
    }catch(e){
      append("Connect error: " + (e.message||e));
    }
  }

  async function simulateOnce(){
    try{
      const r = await fetch(SERVER_BASE + '/api/simulate');
      const j = await r.json();
      append("Simulated energy: " + j.energy);
      onEnergy && onEnergy(j.energy);
    }catch(e){
      append("Simulate error: " + e.message);
    }
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className="button" onClick={requestDevice}>Connect Micro:bit</button>
        <button className="button" onClick={simulateOnce} style={{background:'#666'}}>Simulate Energy</button>
        <div className="small">{connected? 'Connected' : 'Not connected'}</div>
      </div>
      <pre style={{whiteSpace:'pre-wrap', maxHeight:140, overflow:'auto', marginTop:8}}>{log}</pre>
    </div>
  );
}