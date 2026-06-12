/**
 * App.tsx — Root Layout Component
 *
 * This is the main wrapper that every page in the app shares.
 * It renders the Navbar at the top, the Footer at the bottom,
 * and displays the current page in between via <Outlet />.
 *
 * It also handles:
 * - Smooth page transition animations (Framer Motion)
 * - Scroll-to-top whenever the user navigates to a new page
 */
import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./contexts/ThemeContext";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = { duration: 0.22, ease: "easeInOut" as const };

function App() {
  const location = useLocation();

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-red-500/30 selection:text-red-200">
        <Navbars />
        <main className="flex-grow">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footers />
      </div>
    </ThemeProvider>
  );
}

export default App;