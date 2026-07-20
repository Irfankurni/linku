export interface Theme {
  id: string;
  name: string;
  preview: string;
  gradient: string;
  isPro: boolean;
}

export const THEMES: Theme[] = [
  // Free Themes
  { id: 'default',  name: 'Default',  preview: 'from-slate-900 to-slate-800',  gradient: 'from-slate-900 via-slate-800 to-slate-900', isPro: false },
  { id: 'ocean',    name: 'Ocean',    preview: 'from-blue-900 to-cyan-900',    gradient: 'from-blue-950 via-cyan-900 to-blue-950',    isPro: false },
  { id: 'forest',   name: 'Forest',   preview: 'from-green-900 to-emerald-900',gradient: 'from-green-950 via-emerald-900 to-green-950', isPro: false },
  { id: 'sunset',   name: 'Sunset',   preview: 'from-orange-900 to-red-900',   gradient: 'from-orange-950 via-red-900 to-orange-950',   isPro: false },
  
  // Pro Themes
  { id: 'violet',   name: 'Violet',   preview: 'from-violet-950 to-slate-900', gradient: 'from-violet-950 via-slate-900 to-slate-950',  isPro: true },
  { id: 'rose',     name: 'Rose',     preview: 'from-rose-950 to-slate-900',   gradient: 'from-rose-950 via-slate-900 to-slate-950',    isPro: true },
  { id: 'emerald',  name: 'Emerald',  preview: 'from-emerald-950 to-slate-900',gradient: 'from-emerald-950 via-slate-900 to-slate-950', isPro: true },
  { id: 'amber',    name: 'Amber',    preview: 'from-amber-950 to-slate-900',  gradient: 'from-amber-950 via-slate-900 to-slate-950',   isPro: true },
  { id: 'midnight', name: 'Midnight', preview: 'from-slate-950 to-black',      gradient: 'from-black via-slate-950 to-black',           isPro: true },
];
