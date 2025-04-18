import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { GiFarmTractor } from "react-icons/gi";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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
      className={`fixed w-full z-50 transition-all duration-300 font-sans ${
        scrolled ? "bg-green-900 shadow-lg" : "bg-green-800 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-white font-extrabold text-xl"
          >
            <div className="bg-white p-1.5 rounded-full">
              <GiFarmTractor className="text-2xl text-green-900" />
            </div>
            <span className="tracking-tight">FarmGenius</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center">
            <div className="flex space-x-1">
              <NavLink to="/" label="Home" currentPath={location.pathname} />
              <NavLink
                to="/market"
                label="Market"
                currentPath={location.pathname}
              />
              <NavLink
                to="/disease"
                label="Disease Detector"
                currentPath={location.pathname}
              />
              <NavLink
                to="/voice"
                label="Voice Control"
                currentPath={location.pathname}
              />
              <NavLink
                to="/yield"
                label="Yield Predictor"
                currentPath={location.pathname}
              />
            </div>
            <div className="ml-8">
              <Link
                to="/login"
                className="text-green-900 bg-white hover:bg-green-50 px-5 py-2 rounded-lg transition-all duration-300 font-extrabold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none"
            >
              <div className="w-6 flex flex-col items-end space-y-1.5">
                <span
                  className={`block h-0.5 bg-white transition-all duration-300 ease-out ${
                    isOpen ? "w-6 translate-y-2 rotate-45" : "w-6"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-all duration-300 ease-out ${
                    isOpen ? "opacity-0" : "w-4"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-all duration-300 ease-out ${
                    isOpen ? "w-6 -translate-y-2 -rotate-45" : "w-5"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-3 bg-green-800 shadow-inner">
          <MobileNavLink to="/" label="Home" currentPath={location.pathname} />
          <MobileNavLink
            to="/market"
            label="Market"
            currentPath={location.pathname}
          />
          <MobileNavLink
            to="/disease"
            label="Disease Detector"
            currentPath={location.pathname}
          />
          <MobileNavLink
            to="/voice"
            label="Voice Control"
            currentPath={location.pathname}
          />
          <MobileNavLink
            to="/yield"
            label="Yield Predictor"
            currentPath={location.pathname}
          />
          <div className="pt-2">
            <Link
              to="/login"
              className="block w-full text-center text-green-900 bg-white hover:bg-green-50 px-4 py-3 rounded-lg transition-all duration-300 font-extrabold shadow-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Reusable desktop navigation link component
const NavLink = ({ to, label, currentPath }) => {
  const isActive =
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);

  return (
    <Link
      to={to}
      className={`relative px-3 py-2 font-medium transition-colors duration-300 rounded-md group
        ${
          isActive
            ? "text-green-50 font-semibold"
            : "text-white hover:text-green-50"
        }`}
    >
      {label}
      <span
        className={`absolute bottom-0 left-0 w-full h-0.5 bg-white transform origin-left transition-transform duration-300
        ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
      ></span>
    </Link>
  );
};

// Reusable mobile navigation link component
const MobileNavLink = ({ to, label, currentPath }) => {
  const isActive =
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);

  return (
    <Link
      to={to}
      className={`block px-4 py-2.5 rounded-lg transition-all duration-200
        ${
          isActive
            ? "bg-green-700 text-white font-semibold"
            : "text-white hover:text-green-50 hover:bg-green-700"
        }`}
    >
      {label}
    </Link>
  );
};

export default Navbar;
