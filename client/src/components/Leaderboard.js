import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function Leaderboard(){
  const [leaders,setLeaders] = useState([]);
  useEffect(()=>{
    const q = query(collection(db, "leaderboard"), orderBy("totalCaloriesSpent","desc"));
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => d.data());
      setLeaders(arr);
    });
    return () => unsub();
  },[]);
  return (
    <div>
      <div className="section-title">Leaderboard</div>
      {leaders.length===0 ? <div className="small">No entries yet</div> :
        <ol className="list">
          {leaders.map((l,i)=> <li key={i} style={{display:'flex',justifyContent:'space-between'}}>{l.name}<div style={{fontWeight:700}}>{l.totalCaloriesSpent} kcal</div></li>)}
        </ol>}
    </div>
  );
}