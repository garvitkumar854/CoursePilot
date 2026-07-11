import { Shield, Lock, Eye, Key, RefreshCw, CheckCircle, ArrowLeft, Database, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function PrivacyPolicy() {
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

  const principles = [
    {
      icon: Shield,
      title: "Data Protection",
      desc: "We deploy industry-standard SSL encryption and secure database controls to lock down your tracking details.",
      color: "from-teal-500 to-emerald-400 text-teal-600",
    },
    {
      icon: Lock,
      title: "Zero Data Sharing",
      desc: "We never sell, rent, or distribute your subject guides or learning metrics to third-party ad networks.",
      color: "from-blue-500 to-indigo-400 text-blue-600",
    },
    {
      icon: Eye,
      title: "Absolute Transparency",
      desc: "You always have complete visibility over your saved credentials and assignment deadlines with clear access controls.",
      color: "from-purple-500 to-pink-400 text-purple-600",
    },
    {
      icon: Database,
      title: "Secure Persistence",
      desc: "Our systems utilize MongoDB with robust validation to ensure high availability and isolated tenancy profiles.",
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
          <Shield size={32} className="animate-pulse" />
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
        >
          Privacy Policy
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed"
        >
          Your privacy matters to us. Learn how CoursePilot manages, structures, and protects your educational guides, deadlines, and dashboard analytics.
        </motion.p>
      </div>

      {/* Feature / Principles Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-16"
      >
        {principles.map((p, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${p.color} bg-opacity-10 text-white shadow-md`}>
                <p.icon size={22} className={p.color.split(" ").pop()} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {p.desc}
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
          <CheckCircle size={20} className="text-[--cp-accent]" />
          1. Information We Collect
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          To provide high-fidelity tracking features, CoursePilot stores information you directly upload. This includes course subjects (names, codes, color accents, descriptions, weekly frequencies) and individual assignments (titles, description notes, priority status, deadline dates). Password hashes are securely computed and stored using cryptographic salt mechanisms.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle size={20} className="text-[--cp-accent]" />
          2. Cookies & Local Analytics
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          We use cookies and local storage tokens strictly to maintain secure active authorization sessions. These credentials remain stored on your host device and are cleared immediately whenever you manually trigger a logout event.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle size={20} className="text-[--cp-accent]" />
          3. Security & Hosting
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          Our application database runs on isolated instances protected by firewall layers. No client-side process is permitted to bypass the controllers to direct database connections, ensuring that validation and authentication constraints are strictly evaluated on our secure backend routes.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle size={20} className="text-[--cp-accent]" />
          4. Contact Support
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
          Should you have any inquiries regarding data persistence, tenancies, or if you request a full data deletion audit, feel free to contact us via the GitHub development platform.
        </p>
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-slate-400">
          <RefreshCw size={14} className="animate-spin" />
          <span>Last revised: July 11, 2026</span>
        </div>
      </motion.div>
    </div>
  );
}
