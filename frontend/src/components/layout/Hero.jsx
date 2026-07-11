import { motion } from "motion/react";
import { GooeyInput } from "../ui/gooey-input";

export default function Hero({ search, setSearch }) {
  const words = "Master your coursework with elegant precision.".split(" ");

  return (
    <section className="relative rounded-[28px] sm:rounded-[40px] border border-black/5 bg-white px-4 py-12 sm:px-10 sm:py-24 md:py-32 shadow-xl md:shadow-2xl">
      {/* Absolute overflow-hidden layer to contain all background grids and shapes without clipping search dropdown */}
      <div className="absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[40px] pointer-events-none z-0">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-[0.15] blur-[100px]"></div>
        </div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-white border border-white/50 shadow-xl opacity-60 hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-tl from-indigo-100 to-white border border-white/50 shadow-xl opacity-60 hidden lg:block"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 sm:mb-8 rounded-full border border-black/10 bg-white/60 backdrop-blur-md shadow-sm text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Welcome to CoursePilot
          </div>
        </motion.div>

        <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
              className="inline-block mr-2 sm:mr-3 lg:mr-4"
            >
              {word === "elegant" || word === "precision." ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                  {word}
                </span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 sm:mt-8 mx-auto max-w-2xl text-sm sm:text-lg md:text-xl leading-relaxed text-slate-600 font-medium px-2"
        >
          A minimalist dashboard designed to keep your subjects and assignments perfectly organized, so you can focus on what matters.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 120, damping: 20 }}
          className="mt-8 sm:mt-14 w-full max-w-2xl mx-auto"
        >
          <GooeyInput 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search for subjects or assignments..." 
            mode="local"
          />
        </motion.div>
      </div>
    </section>
  );
}
