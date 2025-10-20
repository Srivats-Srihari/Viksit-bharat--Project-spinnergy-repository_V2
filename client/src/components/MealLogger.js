import React, { useState } from "react";
import { SERVER_BASE } from "../config";

export default function MealLogger({ meals, setMeals }){
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if(!q) return alert('Type food name');
    setLoading(true);
    try{
      const res = await fetch(SERVER_BASE + '/api/nutrition', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if(data && data.foods && data.foods.length>0){
        const f = data.foods[0];
        const meal = { name: f.food_name, calories: Math.round(f.nf_calories||0), protein: Math.round(f.nf_protein||0), carbs: Math.round(f.nf_total_carbohydrate||0), fat: Math.round(f.nf_total_fat||0) };
        setMeals(prev => [meal, ...prev]);
        setQ('');
      } else {
        // fallback: ask calories
        const c = parseInt(prompt("Not found. Enter calories manually:"));
        if(!isNaN(c)) { setMeals(prev => [{name:q, calories:c, protein:0, carbs:0, fat:0}, ...prev]); setQ(''); }
      }
    }catch(e){
      alert("Error contacting server: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="section-title">Add Meal</div>
      <div style={{display:'flex',gap:8}}>
        <input className="input" placeholder="e.g., 2 idli" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="button" onClick={add} disabled={loading}>{loading?'...':'Add'}</button>
      </div>
      <div className="small" style={{marginTop:8}}>Uses Nutritionix (server-side) or you can enter manually.</div>
    </div>
  );
}