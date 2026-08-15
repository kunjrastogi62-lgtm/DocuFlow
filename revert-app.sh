sed -i 's/import { Background } from '\''.\/components\/Background'\'';//g' src/App.tsx
sed -i 's/<Background \/>//g' src/App.tsx
sed -i 's/className="min-h-screen bg-transparent/className="min-h-screen bg-slate-50 bg-\[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))\] from-blue-50\/30 via-slate-50 to-slate-100/g' src/App.tsx
sed -i 's/className="z-10 flex-1 flex flex-col overflow-hidden bg-white\/70 backdrop-blur-xl"/className="z-10 flex-1 flex flex-col overflow-hidden"/g' src/App.tsx
sed -i 's/className="flex-1 flex flex-col relative bg-white\/70 backdrop-blur-xl overflow-hidden"/className="flex-1 flex flex-col relative overflow-hidden"/g' src/App.tsx
sed -i 's/className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white\/70 backdrop-blur-xl border-t border-slate-200\/50 px-3 py-2 flex items-center justify-around shadow-lg"/className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white\/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg"/g' src/App.tsx
sed -i 's/className="hidden md:flex h-11 border-t border-slate-200\/50 bg-white\/70 backdrop-blur-xl items-center px-8 text-\[11px\] text-slate-500 justify-between shrink-0"/className="hidden md:flex h-11 border-t border-slate-200 bg-white items-center px-8 text-[11px] text-slate-400 justify-between shrink-0"/g' src/App.tsx
