import React from 'react';
import logo from '../assets/logo-192.png';

export default function Header() {
  return (
    <header style={{display:'flex',alignItems:'center',gap:12,padding:12}}>
      <img src={logo} alt="SmartZakat logo" style={{height:48}} />
      <div>
        <h1 style={{margin:0}}>SmartZakat DSS</h1>
        <div style={{fontSize:12,color:'#666'}}>Corporate Zakat Decision Support</div>
      </div>
    </header>
  );
}
