import React, { useState, useEffect, useRef } from "react";
import { GiFarmTractor, GiWheat, GiCottonFlower } from "react-icons/gi";
import {
  FaLeaf,
  FaChartLine,
  FaStore,
  FaMicrophone,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaRobot,
  FaCloudSun,
  FaSearchLocation,
  FaRupeeSign,
  FaUsersCog,
  FaProjectDiagram,
} from "react-icons/fa";
import { MdOutlineAgriculture } from "react-icons/md";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";

// Simplified animation component
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const { current } = domRef;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });

    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className="transition-all duration-1000 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Simple hover card
const FeatureCard = ({ icon, title, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 ${
        isHovered ? "transform -translate-y-2 shadow-xl" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="inline-block p-4 bg-green-100 rounded-xl text-green-900 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-green-900">{title}</h3>
      <p className="text-gray-600">{description}</p>

      {isHovered && (
        <div className="mt-4">
          <a href="#" className="text-green-700 font-medium flex items-center">
            Learn more
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/hero.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading animation:", error));

    // Add this to fix any default body/html margins
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";

    return () => {
      // Clean up when component unmounts
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.documentElement.style.margin = "";
      document.documentElement.style.padding = "";
    };
  }, []);

  return (
    <div className="font-sans text-gray-800">
      {/* Hero Section - Full height for mobile and properly centered for desktop */}
      <header className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 text-white relative min-h-screen pt-16 sm:pt-20 flex items-center">
        {/* Professional subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Subtle leaf accents - more professional positioning */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400"
              style={{
                left: `${65 + i * 12}%`,
                top: `${20 + i * 25}%`,
                opacity: 0.15,
                transform: `rotate(${i * 45}deg) scale(${1 + i * 0.5})`,
              }}
            >
              <FaLeaf className="text-4xl" />
            </div>
          ))}
        </div>

        {/* Main container with proper centering for desktop and no gaps for mobile */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-12">
              <FadeInSection>
                <div className="flex items-center mb-4">
                  <div className="h-1 w-12 bg-green-400 rounded mr-4"></div>
                  <span className="uppercase tracking-wider text-green-300 font-medium">
                    AI-Powered Agriculture
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
                  <span className="block">Intelligent Farming</span>
                  <span className="block text-green-300">
                    for Better Harvests
                  </span>
                </h1>
              </FadeInSection>

              <FadeInSection delay={200}>
                <p className="text-lg sm:text-xl mb-8 text-green-50 leading-relaxed">
                  Leverage advanced artificial intelligence to maximize crop
                  yields, detect diseases early, and connect with premium
                  markets—all in one comprehensive platform designed for modern
                  farmers.
                </p>
              </FadeInSection>

              <FadeInSection delay={400}>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="bg-white text-green-900 font-medium py-3 px-8 rounded-lg shadow-lg cursor-default select-none border border-green-200">
                    100% Free for Farmers
                  </div>
                  <button className="border border-white text-white hover:bg-black hover:bg-opacity-10 font-medium py-3 px-8 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50">
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      Watch Demo
                    </div>
                  </button>
                </div>
              </FadeInSection>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <FadeInSection delay={300}>
                <div className="relative">
                  {/* Background decorative elements */}
                  <div className="absolute -left-6 -top-6 w-64 h-64 bg-green-700 rounded-full opacity-20 blur-xl"></div>
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-green-500 rounded-full opacity-20 blur-xl"></div>

                  {/* Animation container */}
                  <div className="relative overflow-hidden h-96 sm:w-80 md:w-96">
                    {animationData ? (
                      <Lottie
                        animationData={animationData}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <GiFarmTractor className="text-8xl text-green-600" />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-green-100 opacity-50"></div>
                      </div>
                    )}
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </header>
      {/* Application Added Notice */}
      <FadeInSection delay={100}>
        <div className="flex justify-center my-8">
          <span className="inline-block bg-green-700 text-white text-lg font-semibold rounded-full px-6 py-2 shadow-md">
            🌱 New: FarmGenius Application Added — Now available for all Indian farmers!
          </span>
        </div>
      </FadeInSection>
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-green-900 mb-4">
                Powered by Advanced AI
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                FarmGenius combines multiple AI technologies to provide
                comprehensive farming assistance in your local language.
              </p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Market Analytics */}
            <FadeInSection delay={100}>
              <FeatureCard
                icon={<FaChartLine className="text-4xl text-green-700" />} 
                title="Market Intelligence"
                description="Get real-time and historical mandi prices for your crops, AI-powered price forecasts, and market trend analysis for every major Indian state. Make the smartest selling decisions using verified AgMarkNet data."
              />
            </FadeInSection>

            {/* Feature 2: AI Yield Prediction */}
            <FadeInSection delay={200}>
              <FeatureCard
                icon={<MdOutlineAgriculture className="text-4xl text-amber-700" />} 
                title="AI Yield Prediction"
                description="Predict your harvest with confidence! Our AI analyzes weather, soil, and satellite data for your exact farm location. Get actionable tips to boost yield and reduce risk."
              />
            </FadeInSection>

            {/* Feature 3: Disease & Pest Detection */}
            <FadeInSection delay={300}>
              <FeatureCard
                icon={<FaLeaf className="text-4xl text-green-800" />} 
                title="Disease & Pest Diagnosis"
                description="Snap a photo of your crop—instantly detect diseases and pests using advanced computer vision. Receive region-specific treatment and prevention advice, in your language."
              />
            </FadeInSection>

            {/* Feature 4: Multi-Agent Intelligence */}
            <FadeInSection delay={400}>
              <FeatureCard
                icon={<FaUsersCog className="text-4xl text-purple-700" />} 
                title="Multi-Agent AI System"
                description="Benefit from our unique multi-agent approach—specialized AI agents collaborate to provide the best advice, predictions, and support for every farming scenario."
              />
            </FadeInSection>

            {/* Feature 5: Model Context Protocol */}
            <FadeInSection delay={500}>
              <FeatureCard
                icon={<FaProjectDiagram className="text-4xl text-cyan-700" />} 
                title="Model Context Protocol"
                description="Enjoy seamless, context-aware assistance. Our Model Context Protocol ensures all AI modules share knowledge and context, delivering more accurate and personalized recommendations."
              />
            </FadeInSection>

            {/* Feature 6: Voice & Chat Assistant */}
            <FadeInSection delay={600}>
              <FeatureCard
                icon={<FaMicrophone className="text-4xl text-green-600" />} 
                title="Voice & Chat Assistant"
                description="Talk to FarmGenius in English, Hindi, or Marathi. Get expert answers, step-by-step guidance, and farming support hands-free—anytime, anywhere."
              />
            </FadeInSection>

            {/* Feature 7: Weather Insights */}
            <FadeInSection delay={700}>
              <FeatureCard
                icon={<FaCloudSun className="text-4xl text-blue-500" />} 
                title="Weather & Climate Alerts"
                description="Plan your farm work with hyper-local forecasts, rainfall predictions, and extreme weather alerts. Stay prepared and protect your crops from climate risks."
              />
            </FadeInSection>

            {/* Feature 8: Market Access & Finance */}
            <FadeInSection delay={800}>
              <FeatureCard
                icon={<FaRupeeSign className="text-4xl text-amber-600" />} 
                title="Market Access & Finance"
                description="Discover the best mandi or buyer for your produce, track government subsidies, and access loan calculators—all in one place."
              />
            </FadeInSection>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <FadeInSection>
          <div className="max-w-5xl mx-auto bg-green-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Start Growing Smarter Today
                </h2>
                <p className="text-green-100 mb-8">
                  Join thousands of farmers using AI to improve yields, reduce
                  costs, and farm more sustainably.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button className="bg-white text-green-900 hover:bg-green-50 font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:-translate-y-1">
                    Download App
                  </button>
                  <button className="border-2 border-white text-white hover:bg-white hover:text-green-900 font-bold py-3 px-6 rounded-lg transition transform hover:-translate-y-1">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 bg-green-800 flex items-center justify-center relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white animate-pulse"
                      style={{
                        width: "100px",
                        height: "100px",
                        left: `${i * 30}%`,
                        top: `${i * 25}%`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    ></div>
                  ))}
                </div>

                <div className="text-center p-8 relative">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 rounded-full p-4 transform transition hover:rotate-12">
                      <GiFarmTractor className="text-6xl text-green-900" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 text-center">
                    Download FarmGenius
                  </h3>
                  <p className="text-green-100 mb-4 text-center">
                    Available on iOS and Android
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center w-full">
                    <a href="#" className="bg-black text-white px-4 py-2 rounded flex items-center justify-center transform transition hover:scale-105 w-full sm:w-auto">
                      <span className="mr-2">App Store</span>
                    </a>
                    <a href="#" className="bg-black text-white px-4 py-2 rounded flex items-center justify-center transform transition hover:scale-105 w-full sm:w-auto">
                      <span className="mr-2">Google Play</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>
      {/* Footer */}
      <footer className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 text-green-900 font-extrabold text-xl mb-4">
                <div className="bg-green-900 p-2 rounded-full">
                  <GiFarmTractor className="text-2xl text-white" />
                </div>
                <span>FarmGenius</span>
              </div>
              <p className="text-gray-600 mb-4">
                AI-powered assistance for sustainable agriculture and improved
                livelihoods.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-green-900 hover:text-green-700">
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H6v-2.333C6 8.334 8.334 6 12 6c4.235 0 7.843 2.513 8.995 5.755V12h-7.995z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-green-900 hover:text-green-700">
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-green-900 hover:text-green-700">
                  <span className="sr-only">Instagram</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75-4.365-9.75-9.75-9.75zm0 18.75a8.25 8.25 0 01-8.25-8.25v-.5a8.25 8.25 0 0116.5 0v.5a8.25 8.25 0 01-8.25 8.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-green-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-green-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Tutorials
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-green-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Partners
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-green-900">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-center">
              2025 FarmGenius. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
