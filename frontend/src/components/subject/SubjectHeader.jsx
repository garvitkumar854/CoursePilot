import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function SubjectHeader({ subject }) {
  return (
    <section className="relative overflow-hidden mb-6 rounded-[28px] sm:rounded-[40px] border border-black/5 bg-white px-4 py-8 sm:px-10 sm:py-16 shadow-xl sm:shadow-2xl">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-[0.15] blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 transition-colors hover:text-blue-600 uppercase tracking-widest bg-white/60 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-black/5 shadow-sm"
          >
            <ArrowLeft size={14} />
            Back to Subjects
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 capitalize leading-[1.15]"
          >
            {subject.name}
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 sm:gap-3"
        >
          <span className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold shadow-md border border-white/20 backdrop-blur-md">
            Total assignments: {subject.assignmentCount}
          </span>
          <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm backdrop-blur-md">
            Last updated:{" "}
            {new Date(subject.lastUpdated || subject.updatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </motion.div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-20 w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-white border border-white/50 shadow-xl opacity-50 hidden lg:block"
      />
    </section>
  );
}
