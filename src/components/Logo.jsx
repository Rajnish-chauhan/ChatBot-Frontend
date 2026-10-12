import React from "react";

export default function Logo({ size = 32 }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className="rounded-xl bg-[#3b66ff] flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 select-none"
    >
      <svg viewBox="0 0 100 100" className="w-[82%] h-[82%]" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna */}
        <path d="M42 35 L50 35 L50 42" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Head */}
        <rect x="34" y="42" width="32" height="25" rx="7" stroke="white" strokeWidth="6"/>

        {/* Ears */}
        <line x1="28" y1="54.5" x2="34" y2="54.5" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="66" y1="54.5" x2="72" y2="54.5" stroke="white" strokeWidth="6" strokeLinecap="round"/>

        {/* Eyes */}
        <line x1="44" y1="50.5" x2="44" y2="58.5" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="56" y1="50.5" x2="56" y2="58.5" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}