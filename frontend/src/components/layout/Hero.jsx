export default function Hero() {
  return (
    <section className="rounded-[36px] border border-black/5 bg-white/70 px-6 py-14 shadow-[0_20px_60px_rgba(17,24,39,0.06)] backdrop-blur-xl md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h1
          className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl"
          style={{ color: "#0f172a" }}
        >
          Track assignments with a calm, polished workspace.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-black/60">
          CoursePilot keeps subjects and assignments organized in a minimal
          dashboard that feels fast, clear, and professional.
        </p>
      </div>
    </section>
  );
}
