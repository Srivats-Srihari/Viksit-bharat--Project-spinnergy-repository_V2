import React, { useEffect, useState } from "react";
import EnergyPanel from "./EnergyPanel";
import MealLogger from "./MealLogger";
import MealList from "./MealList";
import Leaderboard from "./Leaderboard";
import Recommendations from "./Recommendations";
import MicrobitConnector from "./MicrobitConnector";

export default function Dashboard(){
  const [energy, setEnergy] = useState(0);
  const [meals, setMeals] = useState([]);
  useEffect(()=>{},[]);
  return (
    <div className="grid">
      <div>
        <div className="card"><EnergyPanel energy={energy} setEnergy={setEnergy} /></div>
        <div className="card"><MealLogger meals={meals} setMeals={setMeals} /></div>
        <div className="card"><MealList /></div>
      </div>
      <div>
        <div className="card"><MicrobitConnector onEnergy={(e)=>{ setEnergy(prev=>Math.round((prev||0)+e)); }} /></div>
        <div className="card"><Recommendations meals={meals} /></div>
        <div className="card"><Leaderboard /></div>
      </div>
    </div>
  );
}