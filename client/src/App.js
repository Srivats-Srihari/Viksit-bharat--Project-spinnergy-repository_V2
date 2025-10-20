import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import AuthPanel from "./components/AuthPanel";
import Dashboard from "./components/Dashboard";
import { onAuthStateChanged } from "firebase/auth";

export default function App(){
  const [user, setUser] = useState(null);
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  },[]);
  if(!user) return <AuthPanel />;
  return <div className="container">
    <div className="header"><div style={{fontWeight:700}}>Spinnergy • PlateWise Connect</div><div style={{fontSize:13}}>{user.email}</div></div>
    <Dashboard />
  </div>;
}