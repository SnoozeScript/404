import React, { useState, useEffect, useRef } from "react";
import { GiFarmTractor } from "react-icons/gi";
import {
  FaLeaf,
  FaChartLine,
  FaStore,
  FaMicrophone,
  FaMapMarkerAlt,
  FaMobileAlt,
} from "react-icons/fa";
import Lottie from "lottie-react";

// Simplified animation component
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible(true);
        observer.unobserve(domRef.current);
      }
    });

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) {
        observer.disconnect();
      }
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
                  <button className="bg-white text-green-900 hover:bg-green-50 font-medium py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                    Start Free Trial
                  </button>
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
            {/* Feature 1 */}
            <FadeInSection delay={100}>
              <FeatureCard
                icon={<FaLeaf className="text-3xl" />}
                title="Crop Disease Detection"
                description="Instantly identify plant diseases by taking a photo. Our Vision API analyzes symptoms and provides treatment recommendations."
              />
            </FadeInSection>

            {/* Feature 2 */}
            <FadeInSection delay={200}>
              <FeatureCard
                icon={<FaChartLine className="text-3xl" />}
                title="Yield Predictions"
                description="Advanced Earth Engine analytics forecast your crop yields based on soil conditions, weather patterns, and historical data."
              />
            </FadeInSection>

            {/* Feature 3 */}
            <FadeInSection delay={300}>
              <FeatureCard
                icon={<FaStore className="text-3xl" />}
                title="Local Market Access"
                description="Connect directly with buyers in your region, compare prices, and sell your produce at the best possible rates."
              />
            </FadeInSection>

            {/* Feature 4 */}
            <FadeInSection delay={400}>
              <FeatureCard
                icon={<FaMicrophone className="text-3xl" />}
                title="Voice Support"
                description="Interact with FarmGenius using voice commands in your local language, making technology accessible to all farmers."
              />
            </FadeInSection>

            {/* Feature 5 */}
            <FadeInSection delay={500}>
              <FeatureCard
                icon={<FaMapMarkerAlt className="text-3xl" />}
                title="Location-Specific Advice"
                description="Receive customized recommendations based on your specific location, local climate conditions, and soil type."
              />
            </FadeInSection>

            {/* Feature 6 */}
            <FadeInSection delay={600}>
              <FeatureCard
                icon={<FaMobileAlt className="text-3xl" />}
                title="Offline Capability"
                description="Access essential features even without internet connectivity, ensuring help is always available in remote areas."
              />
            </FadeInSection>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-100">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-green-900 mb-4">
                How FarmGenius Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Simple, intuitive, and designed for farmers of all technical
                backgrounds.
              </p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <FadeInSection delay={100}>
              <div className="text-center relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900 text-white text-xl font-bold mb-6 transform transition hover:scale-110">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3 text-green-900">
                  Scan Your Crops
                </h3>
                <p className="text-gray-600">
                  Take a photo of your crops or speak to FarmGenius about what
                  you're observing in your fields.
                </p>

                {/* Animated illustration */}
                <div className="mt-6 bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <FaMobileAlt className="text-2xl text-green-800" />
                      </div>
                      <div className="absolute -right-2 -top-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                        <FaLeaf className="text-xs text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* Step 2 - Updated without the rotating circle */}
            <FadeInSection delay={200}>
              <div className="text-center relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900 text-white text-xl font-bold mb-6 transform transition hover:scale-110">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3 text-green-900">
                  Get AI Analysis
                </h3>
                <p className="text-gray-600">
                  Our AI processes your input and combines it with location
                  data, weather forecasts, and agricultural databases.
                </p>

                {/* Updated illustration - replaced spinning circle with AI brain icon */}
                <div className="mt-6 bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* Step 3 - Removed horizontal connector line */}
            <FadeInSection delay={300}>
              <div className="text-center relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900 text-white text-xl font-bold mb-6 transform transition hover:scale-110">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-green-900">
                  Receive Recommendations
                </h3>
                <p className="text-gray-600">
                  Get actionable advice, treatment options, yield predictions,
                  or market connections right on your device.
                </p>

                {/* Animated illustration */}
                <div className="mt-6 bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    <div className="bg-white rounded-full p-4 transform transition hover:rotate-12">
                      <GiFarmTractor className="text-6xl text-green-900" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">
                    Download FarmGenius
                  </h3>
                  <p className="text-green-100 mb-4">
                    Available on iOS and Android
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center justify-center transform transition hover:scale-105">
                      <span className="mr-2">App Store</span>
                    </div>
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center justify-center transform transition hover:scale-105">
                      <span className="mr-2">Google Play</span>
                    </div>
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
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-green-900 hover:text-green-700">
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
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
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
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
              © 2025 FarmGenius. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
