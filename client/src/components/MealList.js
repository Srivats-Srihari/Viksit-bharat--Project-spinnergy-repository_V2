import React from "react";

export default function MealList(){
  // For demo we show nothing from firestore; adding firestore storage is future work
  return (
    <div>
      <div className="section-title">Recent Meals (local)</div>
      <div className="small">Meals are shown locally in this prototype. Full Firestore saving is supported in extended version.</div>
    </div>
  );
}