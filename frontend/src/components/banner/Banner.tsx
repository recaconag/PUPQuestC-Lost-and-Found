import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaLock } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import campusBg from "../../assets/pupqc-campus.png";
import { useUserVerification } from "../../auth/auth";

const slides = [
  {
    eyebrow: "PUPQC LOST & FOUND",
    title: "Lost Something?",
    titleAccent: "Something?",
    description:
      "Report missing items and check found belongings within the PUPQC campus.",
    primary: { text: "Report Lost Item", href: "/reportlostItem", requiresAuth: true },
    secondary: { text: "Browse Found Items", href: "/found-items", requiresAuth: false },
  },
  {
    eyebrow: "ITEM REPORT TRACKING",
    title: "Track Your Reports",
    titleAccent: "Your Reports",
    description:
      "Check updates on your submitted lost or found item reports anytime.",
    primary: { text: "View Lost Reports", href: "/dashboard/myLostItems", requiresAuth: true },
    secondary: { text: "View Found Reports", href: "/dashboard/myFoundItems", requiresAuth: true },
  },
  {
    eyebrow: "CAMPUS LOST & FOUND",
    title: "Helping Students Recover Items",
    titleAccent: "Recover Items",
    description:
      "A simple system for reporting, browsing, and claiming lost belongings in PUPQC.",
    primary: { text: "Get Started", href: "/lostItems", requiresAuth: false },
    secondary: { text: "Learn More", href: "/#aboutUs", requiresAuth: false },
  },
];

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentUser = useUserVerification();
  const isLoggedIn = !!currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  const renderTitle = (title: string, accent: string) => {
    if (!accent || !title.includes(accent)) {
      return <span>{title}</span>;
    }
    const [before, after] = title.split(accent);
    return (
      <>
        {before}
        <span className="bg-gradient-to-r from-orange-400 via-red-500 to-yellow-400 bg-clip-text text-transparent font-extrabold">
          {accent}
        </span>
        {after}
      </>
    );
  };

  return (
    <section className="relative flex items-center min-h-[85vh] bg-black overflow-hidden">

      {/* BACKGROUND IMAGE — PUPQC Campus */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${campusBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* LAYERED OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-red-950/50 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-16 mx-auto max-w-5xl text-center">

        {/* MAIN CARD */}
        <div className="rounded-2xl bg-black/20 backdrop-blur-[2px] border border-red-900/20 shadow-[0_0_80px_rgba(127,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] px-6 sm:px-10 py-10 mb-6">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {/* EYEBROW */}
              <div className="inline-flex items-center gap-2 mb-8">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-red-500/60" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-yellow-600/90">
                  {slide.eyebrow}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-red-500/60" />
              </div>

              {/* HEADLINE */}
              <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-white">
                {renderTitle(slide.title, slide.titleAccent)}
              </h1>

              {/* DESCRIPTION */}
              <p className="mb-10 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                {slide.description}
              </p>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Primary CTA */}
                <button
                  onClick={() => {
                    if (slide.primary.requiresAuth && !isLoggedIn) {
                      navigate("/login", { state: { from: slide.primary.href } });
                    } else {
                      navigate(slide.primary.href);
                    }
                  }}
                  title={slide.primary.requiresAuth && !isLoggedIn ? "Sign in to perform this action" : undefined}
                  className="group inline-flex items-center gap-2.5 bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-semibold text-sm py-3.5 px-7 rounded-xl shadow-[0_2px_12px_rgba(128,0,0,0.45)] hover:shadow-[0_4px_20px_rgba(128,0,0,0.65)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-black"
                >
                  {slide.primary.requiresAuth && !isLoggedIn && (
                    <FaLock className="w-3 h-3 opacity-70" />
                  )}
                  {slide.primary.text}
                  <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>

                {/* Secondary CTA */}
                <button
                  onClick={() => {
                    if (slide.secondary.requiresAuth && !isLoggedIn) {
                      navigate("/login", { state: { from: slide.secondary.href } });
                    } else {
                      navigate(slide.secondary.href);
                    }
                  }}
                  className="group inline-flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm py-3.5 px-7 rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-black"
                >
                  {slide.secondary.text}
                  <FaArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all duration-200" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>{/* end MAIN CARD */}

        {/* SLIDE DOTS */}
        <div className="flex justify-center items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${i === currentSlide
                ? "w-6 h-2 bg-yellow-500"
                : "w-2 h-2 bg-gray-600 hover:bg-gray-400"
                }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default Banner;