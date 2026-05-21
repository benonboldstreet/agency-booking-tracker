import React from 'react';

interface OptionsLogoProps {
  className?: string;
}

export default function OptionsLogo({ className = '' }: OptionsLogoProps) {
  return (
    <div className={`flex flex-col items-start ${className}`} id="options-primary-logo">
      {/* Visual Logo container matching the corporate custom gears/badges */}
      <div className="flex items-center font-black select-none tracking-normal">
        {/* Letter O in wavy gear */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900 relative">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin" style={{ animationDuration: '40s' }}></div>
          O
        </div>
        {/* Letter P in octagonal seal */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900 transform rotate-6">
          P
        </div>
        {/* Letter T in star badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900 transform -rotate-3">
          T
        </div>
        {/* Letter I in flower scallop */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900">
          I
        </div>
        {/* Letter O in gear */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900 animate-pulse">
          O
        </div>
        {/* Letter N in squircled dynamic outline */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 text-white text-base mr-0.5 shadow-sm border border-slate-900 transform rotate-3">
          N
        </div>
        {/* Letter S in retro jagged container */}
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-950 text-white text-base shadow-sm border border-slate-900 transform -rotate-6">
          S
        </div>
      </div>
      
      {/* Slogan exactly as defined on the website image */}
      <span className="text-[10px] font-bold text-slate-700 tracking-tight mt-1.5 font-sans whitespace-nowrap leading-none block">
        Making a better world
      </span>
      <span className="text-[9px] font-medium text-slate-500 tracking-tight font-sans whitespace-nowrap block mt-0.5 leading-none">
        for people with disabilities
      </span>
    </div>
  );
}
