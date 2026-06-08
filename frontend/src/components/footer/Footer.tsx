import { FaFacebook, FaEnvelope, FaPhone } from "react-icons/fa";
import { Link } from "react-router-dom";

const OFFICIAL_FB = "https://www.facebook.com/ThePUPQCCampusOfficial";
const OFFICIAL_EMAIL = "quezoncity@pup.edu.ph";
const OFFICIAL_PHONE = "282878204";

const Footers = () => {
  return (
    <footer className="relative pt-16 pb-10 bg-gray-950 border-t border-yellow-700/20 overflow-hidden">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* TOP */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* BRAND */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold gold-text">
                PUPQuestC
              </span>
            </Link>

            <p className="mt-4 text-gray-300 leading-relaxed text-sm">
              A web-based Lost and Found Management System for the Polytechnic University of the Philippines Quezon City Campus.
              Powered by AI to help the PUPQC community recover what matters most.
            </p>
          </div>

          {/* OFFICIAL CONTACT */}
          <div>
            <h2 className="mb-5 text-sm font-semibold text-white uppercase tracking-wide">
              Official Contact
            </h2>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a
                  href={`mailto:${OFFICIAL_EMAIL}`}
                  className="flex items-center gap-2 hover:text-yellow-500 transition-all duration-200"
                >
                  <FaEnvelope className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{OFFICIAL_EMAIL}</span>
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_FB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-yellow-500 transition-all duration-200"
                >
                  <FaFacebook className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>PUPQC Official Page</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${OFFICIAL_PHONE}`}
                  className="flex items-center gap-2 hover:text-yellow-500 transition-all duration-200"
                >
                  <FaPhone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{OFFICIAL_PHONE}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h2 className="mb-5 text-sm font-semibold text-white uppercase tracking-wide">
              Quick Links
            </h2>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link
                  to="/found-items"
                  className="hover:text-yellow-500 transition-colors duration-200"
                >
                  Browse Found Items
                </Link>
              </li>
              <li>
                <Link
                  to="/reportlostItem"
                  className="hover:text-yellow-500 transition-colors duration-200"
                >
                  Report Lost Item
                </Link>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h2 className="mb-5 text-sm font-semibold text-white uppercase tracking-wide">
              Legal
            </h2>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-yellow-500 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-yellow-500 transition-colors duration-200"
                >
                  Terms and Conditions
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-yellow-700/30 to-transparent"></div>

        {/* BOTTOM */}
        <div className="flex flex-col items-center gap-4 text-center">

          {/* CENTERED OFFICIAL CONTACTS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 text-sm transition-all duration-200"
            >
              <FaEnvelope className="w-3.5 h-3.5" />
              {OFFICIAL_EMAIL}
            </a>

            <span className="hidden sm:block w-px h-4 bg-gray-700" />

            <a
              href={`tel:${OFFICIAL_PHONE}`}
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 text-sm transition-all duration-200"
            >
              <FaPhone className="w-3.5 h-3.5" />
              {OFFICIAL_PHONE}
            </a>

            <span className="hidden sm:block w-px h-4 bg-gray-700" />

            <a
              href={OFFICIAL_FB}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 text-sm transition-all duration-200"
            >
              <FaFacebook className="w-3.5 h-3.5" />
              PUPQC Official Page
            </a>
          </div>

          <span className="text-xs text-gray-500">
            2026 PUPQuestC — PUPQC Lost and Found System.
          </span>

        </div>

      </div>
    </footer>
  );
};

export default Footers;