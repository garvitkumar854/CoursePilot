import { Scale, FileText, CheckCircle2, ShieldAlert, Zap, Globe, ArrowLeft, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function TermsOfService() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const termsCards = [
    {
      icon: Scale,
      title: "Fair Usage Policy",
      desc: "CoursePilot is created for academic and educational tracking. Automated scrapers or high-concurrency stress scripts are strictly prohibited.",
      color: "from-teal-500 to-emerald-400 text-teal-600",
    },
    {
      icon: ShieldAlert,
      title: "Account Integrity",
      desc: "Admins are solely responsible for ensuring the confidentiality of login credentials and supervising state modification permissions.",
      color: "from-blue-500 to-indigo-400 text-blue-600",
    },
    {
      icon: Zap,
      title: "Service Availability",
      desc: "We aim for 99.9% uptime. Scheduled container upgrades and minor package hot-rebuild cycles will be executed during off-peak windows.",
      color: "from-purple-500 to-pink-400 text-purple-600",
    },
    {
      icon: Globe,
      title: "Intellectual Property",
      desc: "All code modules, interface designs, custom transitions, and theme branding are protected under relevant copyright clauses.",
      color: "from-amber-500 to-orange-400 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[--cp-accent] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3 rounded-2xl bg-[--cp-accent]/10 text-[--cp-accent] mb-4 shadow-inner"
        >
          <Scale size={32} className="animate-pulse" />
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
        >
          Terms of Service
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed"
        >
          Please review the following rules, covenants, and responsibilities governing your use of the CoursePilot tracking environment.
        </motion.p>
      </div>

      {/* Feature Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-16"
      >
        {termsCards.map((t, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.color} bg-opacity-10 text-white shadow-md`}>
                <t.icon size={22} className={t.color.split(" ").pop()} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="prose prose-slate max-w-none bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle2 size={20} className="text-[--cp-accent]" />
          1. Operational Agreement
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          By accessing CoursePilot, you agree to comply with all guidelines detailed here. Our services allow scheduling and re-ordering tasks using custom Drag & Drop interfaces. Any intentional exploits or code tampering with database endpoints is grounds for temporary or permanent account de-authorization.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle2 size={20} className="text-[--cp-accent]" />
          2. Administration Privileges
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          Write operations, including creating subjects, deleting records, and dragging assignments across groups, require verified Admin login tokens. These operations are validated server-side to guarantee system-wide consistency across all client views.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle2 size={20} className="text-[--cp-accent]" />
          3. Disclaimer & Warranties
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          Our service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without express or implied warranties of any kind. While we perform persistent backups on MongoDB, we are not liable for accidental data modifications triggered by browser configuration overrides or cached offline requests.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle2 size={20} className="text-[--cp-accent]" />
          4. Revisions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
          CoursePilot reserves the right to adjust, fine-tune, or supplement these terms as new layout frameworks or features are added. Your continued usage after amendments constitute full assent to the current terms.
        </p>
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-slate-400">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span>Last revised: July 11, 2026</span>
        </div>
      </motion.div>
    </div>
  );
}
