import { Link } from "react-router-dom";
import { FaArrowRight, FaSearch } from "react-icons/fa";

const NotFound = () => {
  return (
    <div className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4 overflow-hidden">

      {/* GHOST 404 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[22vw] font-black text-white/[0.03] leading-none tracking-tighter">
          404
        </span>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-lg">

        {/* ICON */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            <FaSearch className="w-9 h-9 text-red-500/70" />
          </div>
        </div>

        {/* EYEBROW */}
        <div className="inline-flex items-center gap-2 mb-5">
          <div className="h-px w-6 bg-gradient-to-r from-transparent to-red-500/60" />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-400/70">
            Page Not Found
          </span>
          <div className="h-px w-6 bg-gradient-to-l from-transparent to-red-500/60" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gold-text mb-4 leading-tight">
          Lost in{" "}
          <span className="bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            Space?
          </span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm mx-auto font-light">
          The page you're looking for doesn't exist or has been moved. Let's get you back to the PUPQC campus.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 bg-red-800 hover:bg-red-700 text-white font-semibold text-sm py-3.5 px-7 rounded-xl shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Back to Home
            <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-200" />
          </Link>

          <Link
            to="/found-items"
            className="group inline-flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm py-3.5 px-7 rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Browse Found Items
            <FaArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all duration-200" />
          </Link>
        </div>

        {/* FOOTER HINT */}
        <p className="mt-12 text-gray-600 text-xs">
          Error 404 · PUPQuestC Lost &amp; Found · PUPQC Campus
        </p>

      </div>
    </div>
  );
};

export default NotFound;
