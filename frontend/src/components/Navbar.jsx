import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { GiFarmTractor } from "react-icons/gi";
import {
  FaWarehouse,
  FaLeaf,
  FaCloudSun,
  FaUser,
  FaRobot,
} from "react-icons/fa";
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

  return (
    <nav
      aria-label="Main Navigation"
      className={`fixed w-full z-50 transition-all duration-300 font-sans 
        ${scrolled ? "bg-green-800 shadow-lg" : "bg-green-800"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - professional with proper alignment */}
          <div className="flex items-center justify-between px-4 py-3 md:py-2">
            <div className="flex items-center">
              <GiFarmTractor className="text-2xl text-yellow-400 mr-2" />
              <span className="font-bold text-lg tracking-wide text-white dark:text-gray-100">
                FarmGenius
              </span>
            </div>
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
          </div>

          {/* Mobile Button with smoother animation */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none p-2 rounded-lg hover:bg-green-700"
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

      {/* Mobile Menu with clean dropdown transition */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-3 bg-green-700 shadow-inner">
          <MobileNavLink
            to="/"
            label="Home"
            icon={<FaCloudSun />}
            currentPath={location.pathname}
            previousPath={previousPath}
            isTransitioning={isTransitioning}
          />
          <MobileNavLink
            to="/market"
            label="Market"
            icon={<FaWarehouse />}
            currentPath={location.pathname}
            previousPath={previousPath}
            isTransitioning={isTransitioning}
          />
          <MobileNavLink
            to="/disease"
            label="Disease Detector"
            icon={<FaLeaf />}
            currentPath={location.pathname}
            previousPath={previousPath}
            isTransitioning={isTransitioning}
          />
          <MobileNavLink
            to="/yield"
            label="Yield Predictor"
            icon={<BsFillBarChartFill />}
            currentPath={location.pathname}
            previousPath={previousPath}
            isTransitioning={isTransitioning}
          />
          <MobileNavLink
            to="/chat"
            label="AI Chat"
            icon={<FaRobot />}
            currentPath={location.pathname}
            previousPath={previousPath}
            isTransitioning={isTransitioning}
          />
          <div className="pt-2">
            <Link
              to="/login"
              className="block w-full text-center text-green-900 bg-white hover:bg-green-50 px-4 py-3 rounded-lg transition-colors duration-300 font-bold shadow-sm flex items-center justify-center space-x-2"
            >
              <FaUser />
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
        ${isActive ? "text-white font-bold" : "text-white hover:bg-green-600"}`}
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
