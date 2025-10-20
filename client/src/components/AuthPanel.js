import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function AuthPanel(){
  const [mode,setMode] = useState("login");
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [msg,setMsg] = useState("");

  const doLogin = async ()=> {
    try {
      await signInWithEmailAndPassword(auth,email,pass);
    } catch(e){ setMsg(e.message); }
  };
  const doSignup = async ()=> {
    try {
      await createUserWithEmailAndPassword(auth,email,pass);
    } catch(e){ setMsg(e.message); }
  };

  return (
    <div style={{maxWidth:420,margin:"40px auto",padding:18,background:"white",borderRadius:8}}>
      <h2 style={{marginTop:0}}>{mode==="login"?"Login":"Create account"}</h2>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <div style={{height:8}} />
      <input className="input" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
      <div style={{height:12}} />
      {mode==="login" ? <button className="button" onClick={doLogin}>Login</button> : <button className="button" onClick={doSignup}>Create</button>}
      <div style={{marginTop:12}}>
        <button className="button" style={{background:"#666"}} onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Switch to Signup":"Back to Login"}</button>
      </div>
      <div style={{marginTop:8,color:"crimson"}}>{msg}</div>
      <div className="small" style={{marginTop:8}}>Use test accounts for judges.</div>
    </div>
  );
}