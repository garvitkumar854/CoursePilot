import { useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";

export function GooeyInput({ placeholder = "Search...", value, onChange, className = "" }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative w-full max-w-xl mx-auto ${className} h-14`}>
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0 flex items-center w-full"
        style={{ filter: "url(#goo)" }}
      >
        <motion.div
          initial={{ paddingLeft: "0px" }}
          animate={{
            paddingLeft: isFocused ? "40px" : "0px",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full flex h-full"
        >
          <input
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "" : placeholder}
            className="w-full h-full bg-[#f1f5f9] text-[#0f172a] pl-[56px] pr-6 rounded-full outline-none font-medium placeholder:text-[#64748b] text-base"
          />
        </motion.div>

        {/* The Blob that pops out */}
        <motion.div
          initial={{ x: 16, scale: 0.5, opacity: 0 }}
          animate={{
            x: isFocused ? -16 : 16,
            scale: isFocused ? 1 : 0.5,
            opacity: isFocused ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="absolute left-0 z-0 flex items-center justify-center rounded-full pointer-events-none bg-black"
          style={{ width: "44px", height: "44px" }}
        />
      </div>
      
      {/* Search Icon */}
      <motion.div
        initial={{ x: 16, color: "#64748b" }}
        animate={{
          x: isFocused ? -16 : 16,
          color: isFocused ? "#fff" : "#64748b",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="absolute left-0 z-10 flex items-center justify-center rounded-full pointer-events-none"
        style={{ width: "44px", height: "100%" }}
      >
        <Search size={18} strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
