import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { GiFarmTractor } from "react-icons/gi";
import { FaWarehouse, FaLeaf, FaCloudSun, FaUser, FaRobot } from "react-icons/fa";
import { BsFillBarChartFill } from "react-icons/bs";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add path transition effect with delay
  useEffect(() => {
    if (previousPath !== location.pathname) {
      // Start the transition
      setIsTransitioning(true);

      // First timer: delay before updating the previous path (creates the delay effect)
      const delayTimer = setTimeout(() => {
        setPreviousPath(location.pathname);
      }, 150); // Small delay before starting the transition

      // Second timer: end the transition state after animation completes
      const completionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 650); // Total time = delay (150ms) + animation duration (500ms)

      return () => {
        clearTimeout(delayTimer);
        clearTimeout(completionTimer);
      };
    }
  }, [location.pathname, previousPath]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  return (
    <nav
      aria-label="Main Navigation"
      className={`fixed w-full z-50 transition-all duration-300 font-sans 
        ${scrolled ? "bg-green-900 shadow-lg" : "bg-green-900"} 
        dark:bg-gray-950 dark:text-gray-100`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - professional with proper alignment */}
          <div className="flex items-center justify-between px-4 py-3 md:py-2">
            <div className="flex items-center">
              <GiFarmTractor className="text-2xl text-yellow-400 mr-2" />
              <span className="font-bold text-lg tracking-wide text-white dark:text-gray-100">FarmGenius</span>
            </div>
            {/* No theme selector here, just logo */}
            <div></div>

          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center h-16">
            <div className="flex h-full">
              <NavLink
                to="/"
                label="Home"
                icon={<FaCloudSun />}
                currentPath={location.pathname}
                previousPath={previousPath}
                isTransitioning={isTransitioning}
              />
              <NavLink
                to="/market"
                label="Market"
                icon={<FaWarehouse />}
                currentPath={location.pathname}
                previousPath={previousPath}
                isTransitioning={isTransitioning}
              />
              <NavLink
                to="/disease"
                label="Disease Detector"
                icon={<FaLeaf />}
                currentPath={location.pathname}
                previousPath={previousPath}
                isTransitioning={isTransitioning}
              />
              <NavLink
                to="/yield"
                label="Yield Predictor"
                icon={<BsFillBarChartFill />}
                currentPath={location.pathname}
                previousPath={previousPath}
                isTransitioning={isTransitioning}
              />
              <NavLink
                to="/chat"
                label="AI Chat"
                icon={<FaRobot />}
                currentPath={location.pathname}
                previousPath={previousPath}
                isTransitioning={isTransitioning}
              />
            </div>
            <div className="ml-8">
              <Link
                to="/login"
                className="text-green-900 bg-white hover:bg-green-50 px-5 py-2 rounded-lg font-bold shadow-md flex items-center space-x-2 transition-colors duration-300"
              >
                <FaUser />
                <span>Login</span>
              </Link>
            </div>
          </div>

          {/* Mobile Button with smoother animation */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none p-2 rounded-lg hover:bg-green-800"
            >
              <div className="w-6 flex flex-col items-end space-y-1.5">
                <span
                  className={`block h-0.5 bg-white transition-all duration-300 ease-in-out ${
                    isOpen ? "w-6 translate-y-2 rotate-45" : "w-6"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-opacity duration-300 ease-in-out ${
                    isOpen ? "opacity-0" : "w-4"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-all duration-300 ease-in-out ${
                    isOpen ? "w-6 -translate-y-2 -rotate-45" : "w-5"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 md:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      {/* Mobile Menu with slide-down and improved spacing */}
      <div
        className={`md:hidden fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{background: "#14532d"}} // bg-green-900 fallback for dark mode
        role="dialog"
        aria-modal="true"
      >
        <div className="relative px-4 pt-4 pb-8 min-h-screen flex flex-col space-y-5">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="absolute right-5 top-5 text-white bg-green-800 bg-opacity-80 rounded-full p-3 shadow-lg focus:outline-none hover:bg-green-700"
            tabIndex={isOpen ? 0 : -1}
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="mt-16 flex flex-col gap-3">
            <MobileNavLink
              to="/"
              label="Home"
              icon={<FaCloudSun className="text-xl mr-3" />}
              currentPath={location.pathname}
              previousPath={previousPath}
              isTransitioning={isTransitioning}
            />
            <MobileNavLink
              to="/market"
              label="Market"
              icon={<FaWarehouse className="text-xl mr-3" />}
              currentPath={location.pathname}
              previousPath={previousPath}
              isTransitioning={isTransitioning}
            />
            <MobileNavLink
              to="/disease"
              label="Disease Detector"
              icon={<FaLeaf className="text-xl mr-3" />}
              currentPath={location.pathname}
              previousPath={previousPath}
              isTransitioning={isTransitioning}
            />
            <MobileNavLink
              to="/yield"
              label="Yield Predictor"
              icon={<BsFillBarChartFill className="text-xl mr-3" />}
              currentPath={location.pathname}
              previousPath={previousPath}
              isTransitioning={isTransitioning}
            />
            <MobileNavLink
              to="/chat"
              label="AI Chat"
              icon={<FaRobot className="text-xl mr-3" />}
              currentPath={location.pathname}
              previousPath={previousPath}
              isTransitioning={isTransitioning}
            />
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 text-green-900 bg-white hover:bg-green-50 px-4 py-4 rounded-lg transition-colors duration-300 font-bold shadow-sm text-lg mt-3"
              tabIndex={isOpen ? 0 : -1}
            >
              <FaUser className="text-xl" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Reusable desktop navigation link component with smooth transitions between active states
const NavLink = ({
  to,
  label,
  icon,
  currentPath,
  previousPath,
  isTransitioning,
}) => {
  const isActive =
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);
  const wasActive =
    to === "/" ? previousPath === "/" : previousPath.startsWith(to);

  // Determine if this link is actively transitioning
  const isLinkTransitioning = isTransitioning && (isActive || wasActive);

  return (
    <Link
      to={to}
      className="px-4 mx-1 h-full flex items-center font-bold relative group"
    >
      <div className="flex items-center space-x-2">
        <span className="text-white text-lg">{icon}</span>
        <span
          className={`text-white transition-colors duration-500 ${
            isActive ? "text-green-50" : ""
          }`}
        >
          {label}
        </span>
      </div>

      {/* Smooth underline transition logic with delays */}
      {wasActive && !isActive && isTransitioning ? (
        /* Transitioning away - animate out with delay */
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-white animate-fade-out"></span>
      ) : isActive && !wasActive && isTransitioning ? (
        /* Transitioning in - animate in with delay */
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white animate-expand-underline"></span>
      ) : isActive ? (
        /* Stable active state */
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-white transition-all duration-500 ease-in-out"></span>
      ) : (
        /* Hover effect for inactive items */
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white transition-all duration-500 ease-in-out group-hover:w-4/5"></span>
      )}

      <style jsx>{`
        @keyframes expand-underline {
          0% {
            width: 0;
            opacity: 0;
          }
          30% {
            width: 0;
            opacity: 1;
          }
          100% {
            width: 80%;
            opacity: 1;
          }
        }
        .animate-expand-underline {
          animation: expand-underline 500ms ease-out forwards;
        }

        @keyframes fade-out {
          0% {
            width: 80%;
            opacity: 1;
          }
          70% {
            width: 80%;
            opacity: 1;
          }
          100% {
            width: 80%;
            opacity: 0;
          }
        }
        .animate-fade-out {
          animation: fade-out 500ms ease-in forwards;
        }
      `}</style>
    </Link>
  );
};

// Mobile navigation link component with smooth underline transitions
const MobileNavLink = ({
  to,
  label,
  icon,
  currentPath,
  previousPath,
  isTransitioning,
}) => {
  const isActive =
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);
  const wasActive =
    to === "/" ? previousPath === "/" : previousPath.startsWith(to);

  // Determine if this link is actively transitioning
  const isLinkTransitioning = isTransitioning && (isActive || wasActive);

  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-500 relative overflow-hidden
        ${isActive ? "text-white font-bold" : "text-white hover:bg-green-700"}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-bold">{label}</span>

      {/* Animated underline with delayed smooth transitions */}
      {wasActive && !isActive && isTransitioning ? (
        /* Transitioning away - slide out to right with delay */
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white animate-slide-out"></span>
      ) : isActive && !wasActive && isTransitioning ? (
        /* Transitioning in - slide in from left with delay */
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white animate-slide-in"></span>
      ) : isActive ? (
        /* Stable active state */
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
      ) : null}

      <style jsx>{`
        @keyframes slide-in {
          0% {
            width: 0;
          }
          30% {
            width: 0;
          } /* Delay the start of the animation */
          100% {
            width: 100%;
          }
        }
        .animate-slide-in {
          animation: slide-in 500ms ease-out forwards;
        }

        @keyframes slide-out {
          0% {
            width: 100%;
            left: 0;
          }
          50% {
            width: 100%;
            left: 0;
          } /* Hold in place briefly */
          100% {
            width: 100%;
            left: 100%;
          }
        }
        .animate-slide-out {
          animation: slide-out 500ms ease-in forwards;
        }
      `}</style>
    </Link>
  );
};

export default Navbar;
