import React from "react";

export default function EnergyPanel({ energy, setEnergy }){
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:14,fontWeight:700}}>Energy Points</div>
          <div style={{fontSize:28,fontWeight:800}}>{energy || 0} pts</div>
          <div className="small">Generate points by walking with Spinergy Junior</div>
        </div>
        <div>
          <button className="button" onClick={()=>{ const n = parseInt(prompt("Add points:")); if(!isNaN(n)) setEnergy((e)=> (e||0)+n); }}>Add Points</button>
        </div>
      </div>
    </div>
  );
}