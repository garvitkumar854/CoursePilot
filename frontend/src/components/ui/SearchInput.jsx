import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search subjects or assignments...",
}) {
  return (
    <div className="relative mb-8">
      <Search
        size={18}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40"
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-[#e2e8f0] bg-white/80 py-4 pl-14 pr-5 text-sm text-[#0f172a] shadow-[0_12px_30px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-black/35 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
      />
    </div>
  );
}
