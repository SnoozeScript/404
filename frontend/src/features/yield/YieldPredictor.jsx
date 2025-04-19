"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
// Assuming predictYieldApi is correctly imported from your services
import { predictYieldApi } from "../../services/api";
import {
  FaLeaf, // Included for background
  FaSpinner,
  FaChartLine,
  FaMapMarkerAlt,
  FaRuler,
  FaCloudSun,
  FaSeedling,
  FaRegCheckCircle,
  FaTimes,
  FaSearchLocation,
  FaInfoCircle,
} from "react-icons/fa";
import { GiFarmTractor, GiWheat } from "react-icons/gi";
import { WiHumidity } from "react-icons/wi";
import { MdOutlineScience, MdOutlineWaterDrop } from "react-icons/md";

// Fade in animation component (remains the same)
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef(); // Use useRef directly

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        if (domRef.current) {
          observer.unobserve(domRef.current);
        }
      }
    });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) {
        // observer.unobserve(currentRef); // Optional
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5" // Adjusted transform
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Tooltip component (remains the same)
const Tooltip = ({ content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button" // Add type="button" to prevent form submission
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <FaInfoCircle className="text-sm" />
      </button>
      {showTooltip && (
        <div className="absolute z-10 w-48 p-2 mt-2 text-xs text-white bg-gray-800 rounded-md shadow-lg left-1/2 transform -translate-x-1/2">
          {content}
        </div>
      )}
    </div>
  );
};

function YieldPredictor() {
  // Form state (remains the same)
  const [formData, setFormData] = useState({
    crop: "",
    area: "",
    season: "",
    state: "Maharashtra",
    annual_rainfall: "",
    fertilizer: "",
    pesticide: "",
    ph: "6.5",
    n: "140",
    p: "50",
    k: "200",
    organic_carbon: "0.5",
    latitude: "",
    longitude: "",
    location_name: "",
  });

  // UI state (remains the same)
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [showMap, setShowMap] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [activeTab, setActiveTab] = useState("form");
  const isLoadingRef = useRef(isLoading); // Add ref for async checks

  // Available options (remains the same)
  const crops = [
    "Rice",
    "Jowar",
    "Bajra",
    "Maize",
    "Ragi",
    "Wheat",
    "Gram",
    "Tur",
    "Other Pulses",
    "Groundnut",
    "Sunflower",
    "Soyabean",
    "Safflower",
    "Nigerseed",
    "Other Oilseeds",
    "Cotton",
    "Sugarcane",
    "Tobacco",
    "Potato",
    "Onion",
    "Other Vegetables",
    "Fruits",
    "Total Foodgrains",
  ];
  const seasons = ["Kharif", "Rabi", "Summer"];
  const states = [
    "Maharashtra",
    "Karnataka",
    "Gujarat",
    "Madhya Pradesh",
    "Punjab",
    "Haryana",
    "Uttar Pradesh",
    "Bihar",
    "West Bengal",
    "Tamil Nadu",
    "Andhra Pradesh",
    "Telangana",
  ];

  // State center coordinates (remains the same)
  const STATE_COORDINATES = useMemo(
    () => ({
      Maharashtra: { lat: 19.7515, lng: 75.7139 },
      Karnataka: { lat: 15.3173, lng: 75.7139 },
      Gujarat: { lat: 22.2587, lng: 71.1924 },
      "Madhya Pradesh": { lat: 23.4733, lng: 77.9473 },
      Punjab: { lat: 31.1471, lng: 75.3412 },
      Haryana: { lat: 29.0588, lng: 76.0856 },
      "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
      Bihar: { lat: 25.0961, lng: 85.3131 },
      "West Bengal": { lat: 22.9868, lng: 87.855 },
      "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
      "Andhra Pradesh": { lat: 15.9129, lng: 79.74 },
      Telangana: { lat: 18.1124, lng: 79.0193 },
    }),
    []
  );

  // Initialize Google Maps (remains the same)
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      /* ... unchanged ... */
    };
    const initializeMap = () => {
      if (!mapContainerRef.current || !window.google || !window.google.maps)
        return;

      const defaultCenter = STATE_COORDINATES[formData.state] || {
        lat: 19.7515,
        lng: 75.7139,
      };
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 8 /* ... other options */,
      });
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map,
        draggable: true /* ... other options */,
      });

      // --- Event Listeners for map interaction ---
      marker.addListener("dragend", () => {
        /* ... unchanged ... */
        const position = marker.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          setLocationSelected(true);
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              setFormData((prev) => ({
                ...prev,
                location_name: results[0].formatted_address,
              }));
            }
          });
        }
      });

      map.addListener("click", (event) => {
        /* ... unchanged ... */
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          marker.setPosition(event.latLng);
          setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          setLocationSelected(true);
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: event.latLng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              setFormData((prev) => ({
                ...prev,
                location_name: results[0].formatted_address,
              }));
            }
          });
        }
      });

      // --- Search Box ---
      const inputElement = document.getElementById("location-search");
      if (inputElement) {
        const searchBox = new window.google.maps.places.SearchBox(inputElement);
        map.addListener("bounds_changed", () => {
          const bounds = map.getBounds();
          if (bounds) searchBox.setBounds(bounds);
        });

        searchBox.addListener("places_changed", () => {
          /* ... unchanged ... */
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;
          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;

          map.setCenter(place.geometry.location);
          map.setZoom(12);
          marker.setPosition(place.geometry.location);

          setFormData((prev) => ({
            ...prev,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            location_name: place.formatted_address || place.name || "",
          }));
          setLocationSelected(true);
        });
      }

      mapRef.current = { map, marker };
    };

    const loadScript = () => {
      if (!window.google || !window.google.maps) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
        }&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () =>
          console.error("Google Maps script failed to load."); // Add error handling
        document.head.appendChild(script);
        // Cleanup script tag on component unmount
        return () => {
          const scriptTag = document.querySelector(
            `script[src*="maps.googleapis.com"]`
          );
          if (scriptTag) {
            // document.head.removeChild(scriptTag); // Be cautious removing scripts added by others
          }
        };
      } else {
        initializeMap(); // Already loaded
      }
    };

    if (showMap) {
      loadScript();
    }
    // Cleanup function for the effect
    // return () => { /* Optional: Any additional cleanup needed */ };
  }, [showMap, formData.state, STATE_COORDINATES]); // Dependencies remain the same

  // Update map center when state changes (remains the same)
  useEffect(() => {
    if (
      mapRef.current &&
      mapRef.current.map &&
      mapRef.current.marker &&
      STATE_COORDINATES[formData.state]
    ) {
      const newCenter = STATE_COORDINATES[formData.state];
      mapRef.current.map.setCenter(newCenter);
      mapRef.current.marker.setPosition(newCenter);
      // Update formData lat/lng if state changes, but keep existing location_name if user selected one
      if (!locationSelected) {
        setFormData((prev) => ({
          ...prev,
          latitude: newCenter.lat,
          longitude: newCenter.lng,
          location_name: `${formData.state}, India`, // Default location name based on state
        }));
      } else {
        // If location was already selected, just update map center, don't overwrite lat/lng/name
        mapRef.current.map.setCenter(newCenter);
        mapRef.current.marker.setPosition(newCenter);
      }
    }
  }, [formData.state, STATE_COORDINATES, locationSelected]); // Added locationSelected

  // Progress animation effect (remains the same)
  useEffect(() => {
    let interval;
    if (isLoading) {
      if (analysisStage === 1) {
        setProgressPercent(0);
        interval = setInterval(
          () => setProgressPercent((prev) => Math.min(prev + 1, 45)),
          30
        );
      } else if (analysisStage === 2) {
        interval = setInterval(
          () => setProgressPercent((prev) => Math.min(prev + 1, 90)),
          40
        );
      }
    } else {
      setProgressPercent(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, analysisStage]);

  // isLoading ref sync (remains the same)
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Handle form input changes (remains the same)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission (remains the same)
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setPrediction(null);
      setError("");
      setFormSubmitted(true);
      setActiveTab("results"); // Switch to results tab on submit
      setAnalysisStage(1);
      setProgressPercent(0); // Reset progress

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isLoadingRef.current) return; // Check if still loading

      setAnalysisStage(2); // Move to analyzing stage

      try {
        // Convert relevant fields to numbers
        const numericData = {
          ...formData,
          area: Number.parseFloat(formData.area) || 0,
          annual_rainfall: Number.parseFloat(formData.annual_rainfall) || 0,
          fertilizer: Number.parseFloat(formData.fertilizer) || 0,
          pesticide: Number.parseFloat(formData.pesticide) || 0,
          ph: Number.parseFloat(formData.ph) || 0,
          n: Number.parseFloat(formData.n) || 0,
          p: Number.parseFloat(formData.p) || 0,
          k: Number.parseFloat(formData.k) || 0,
          organic_carbon: Number.parseFloat(formData.organic_carbon) || 0,
        };
        // Include location data if available
        if (formData.latitude && formData.longitude) {
          numericData.latitude = Number.parseFloat(formData.latitude);
          numericData.longitude = Number.parseFloat(formData.longitude);
          numericData.location_name = formData.location_name; // Keep string name
        }

        // ---- API Call ----
        const result = await predictYieldApi(numericData);
        // ---- End API Call ----

        if (!isLoadingRef.current) return; // Check if still loading

        // Simulate final analysis time
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!isLoadingRef.current) return;

        setPrediction(result); // Set prediction state
        setAnalysisStage(3); // Set stage to complete
        setProgressPercent(100); // Set progress to 100%

        if (result.weather_data) {
          setWeatherData(result.weather_data); // Store weather data if returned
        }
      } catch (err) {
        console.error("Yield Prediction Error:", err); // Log the error
        const errorMsg =
          err.response?.data?.error ||
          err.message ||
          "Failed to predict yield. Please check inputs and try again.";
        setError(errorMsg);
        setAnalysisStage(0); // Reset stage on error
        setProgressPercent(0); // Reset progress
      } finally {
        // Short delay before setting loading false to show 100% complete
        setTimeout(() => {
          if (isLoadingRef.current) {
            // Check ref again before setting state
            setIsLoading(false);
          }
        }, 500);
      }
    },
    [formData]
  ); // Dependency: formData

  // Reset form (remains the same)
  const handleReset = useCallback(() => {
    setFormData({
      crop: "",
      area: "",
      season: "",
      state: "Maharashtra",
      annual_rainfall: "",
      fertilizer: "",
      pesticide: "",
      ph: "6.5",
      n: "140",
      p: "50",
      k: "200",
      organic_carbon: "0.5",
      latitude: "",
      longitude: "",
      location_name: "",
    });
    setPrediction(null);
    setError("");
    setIsLoading(false);
    setAnalysisStage(0);
    setProgressPercent(0);
    setFormSubmitted(false);
    setShowMap(false);
    setLocationSelected(false);
    setActiveTab("form");
    // Reset map marker to default state center if map exists
    if (mapRef.current && mapRef.current.map && mapRef.current.marker) {
      const defaultCenter = STATE_COORDINATES["Maharashtra"];
      mapRef.current.map.setCenter(defaultCenter);
      mapRef.current.map.setZoom(8);
      mapRef.current.marker.setPosition(defaultCenter);
      // Also clear the search input
      const inputElement = document.getElementById("location-search");
      if (inputElement) inputElement.value = "";
    }
  }, [STATE_COORDINATES]); // Added STATE_COORDINATES dependency

  // Calculate yield potential (remains the same, purely illustrative)
  const calculateYieldPotential = useMemo(() => {
    /* ... unchanged ... */
  }, [formData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 pt-24 pb-12 flex flex-col items-center justify-center px-4">
      {" "}
      {/* Added px-4 for padding */}
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Subtle wheat accents (Existing) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "10%",
              top: "15%",
              opacity: 0.15,
              transform: "rotate(45deg) scale(2.5)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              left: "8%",
              bottom: "20%",
              opacity: 0.12,
              transform: "rotate(-65deg) scale(2)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "15%",
              top: "50%",
              opacity: 0.1,
              transform: "rotate(120deg) scale(3)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              left: "20%",
              top: "10%",
              opacity: 0.08,
              transform: "rotate(20deg) scale(1.5)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "25%",
              bottom: "12%",
              opacity: 0.07,
              transform: "rotate(-20deg) scale(1.7)",
            }}
          />
        </div>

        {/* ADJUSTED Subtle leaf accents - positioned to avoid direct overlap */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Leaf - Top Left Corner */}
          <FaLeaf
            className="absolute text-green-400 text-4xl" // Green color for leaves
            style={{
              left: "5%", // Moved further left
              top: "8%", // Moved slightly up
              opacity: 0.1, // Slightly less opaque
              transform: "rotate(-30deg) scale(2.0)", // Adjusted rotation/scale
            }}
          />

          {/* Leaf - Middle Left */}
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              left: "15%", // Shifted position
              bottom: "45%", // Mid-bottom area
              opacity: 0.09,
              transform: "rotate(75deg) scale(1.8)",
            }}
          />

          {/* Leaf - Bottom Center-Right */}
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "35%", // Towards center bottom right
              bottom: "5%",
              opacity: 0.08,
              transform: "rotate(-15deg) scale(2.2)",
            }}
          />

          {/* Leaf - Top Center-Right */}
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "20%", // Shifted
              top: "8%", // Near top but different spot
              opacity: 0.07,
              transform: "rotate(55deg) scale(1.6)",
            }}
          />

          {/* Leaf - Far Bottom Right Corner */}
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "5%", // Far corner
              bottom: "8%", // Far corner
              opacity: 0.11,
              transform: "rotate(25deg) scale(2.1)",
            }}
          />
        </div>
      </div>
      {/* Page Header (remains the same) */}
      <div className="text-center mb-10 w-full relative z-10">
        <FadeInSection>
          {" "}
          {/* Wrap header */}
          <div className="inline-flex p-4 bg-gradient-to-r from-amber-100 to-green-100 rounded-full text-amber-800 mb-5 shadow-md">
            <GiWheat className="text-4xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-amber-900 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-green-700">
            Crop Yield Predictor
          </h1>
          <p className="text-gray-600 max-w-xl md:max-w-2xl mx-auto text-sm md:text-base">
            Optimize your harvest with AI-powered yield predictions and
            personalized farming recommendations.
          </p>
        </FadeInSection>
      </div>
      {/* Main Content */}
      <div className="w-full max-w-7xl relative z-10 transition-all duration-500">
        {/* Main container */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-amber-100 transform transition-all duration-300 hover:shadow-xl relative overflow-hidden">
          {/* Subtle background pattern (remains) */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            {/* SVG pattern */}
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern
                id="pattern-yield"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="#fcd34d" />
              </pattern>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#pattern-yield)"
              />
            </svg>
          </div>
          {/* Grid Layout for Form and Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Form Section (Left/Main Column) */}
            <div
              className={`lg:col-span-2 transition-opacity duration-500 ${
                activeTab !== "form"
                  ? "opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto"
                  : "opacity-100"
              }`}
            >
              <FadeInSection delay={100}>
                {" "}
                {/* Fade in form section */}
                {/* Form Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100 transition-all duration-300 hover:shadow-md">
                  {/* Form Header */}
                  <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FaSeedling className="mr-2 text-green-500" />
                      Enter Crop Details
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1 text-xs md:text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors transform hover:-translate-y-0.5 hover:shadow-sm duration-300"
                      >
                        Reset Form
                      </button>
                      {/* Conditionally render View Results button */}
                      {prediction && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("results")}
                          disabled={!prediction}
                          className="px-3 py-1 text-xs md:text-sm rounded-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-sm bg-amber-500 text-white hover:bg-amber-600"
                        >
                          View Results
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: Crop, Season */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaLeaf className="mr-1.5 text-green-500 text-base" />{" "}
                          Crop Type <span className="text-red-500 ml-1">*</span>
                          <Tooltip content="Select the primary crop" />
                        </label>
                        <select
                          name="crop"
                          value={formData.crop}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-300 hover:border-amber-300 text-sm"
                          required
                        >
                          <option value="">Select a crop</option>
                          {crops.map((crop) => (
                            <option key={crop} value={crop}>
                              {crop}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaCloudSun className="mr-1.5 text-blue-500 text-base" />{" "}
                          Growing Season{" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="season"
                          value={formData.season}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-300 hover:border-amber-300 text-sm"
                          required
                        >
                          <option value="">Select a season</option>
                          {seasons.map((season) => (
                            <option key={season} value={season}>
                              {season}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: State, Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaMapMarkerAlt className="mr-1.5 text-red-500 text-base" />{" "}
                          State <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-300 hover:border-amber-300 text-sm"
                          required
                        >
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaRuler className="mr-1.5 text-gray-600 text-base" />{" "}
                          Area (Hectares){" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          placeholder="e.g., 2.5"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 hover:border-amber-300 text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Location Selection (Map) */}
                    <div className="form-group border-t pt-4 mt-4 border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-1.5 text-red-500 text-base" />{" "}
                        Farm Location (Optional)
                        <Tooltip content="Precise location improves weather accuracy" />
                      </label>
                      <div className="flex items-center space-x-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
                        >
                          <FaSearchLocation className="mr-2" />{" "}
                          {showMap ? "Hide Map" : "Select on Map"}
                        </button>
                        {locationSelected && (
                          <span className="text-xs text-green-600 flex items-center">
                            <FaRegCheckCircle className="mr-1" /> Location Set
                          </span>
                        )}
                      </div>
                      {showMap && (
                        <FadeInSection>
                          {" "}
                          {/* Animate map appearance */}
                          <div className="mt-2 space-y-3 p-4 bg-gray-50 rounded-lg border">
                            <input
                              id="location-search"
                              type="text"
                              placeholder="Search address or place name..."
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 text-sm"
                            />
                            <div
                              ref={mapContainerRef}
                              className="w-full h-60 rounded-lg border border-gray-300 bg-gray-100 shadow-inner transition-all duration-300 hover:shadow-md"
                            ></div>
                            {formData.location_name && (
                              <div className="text-xs text-gray-600 p-2 bg-white rounded border">
                                Selected: {formData.location_name}
                              </div>
                            )}
                          </div>
                        </FadeInSection>
                      )}
                    </div>

                    {/* Rainfall */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <MdOutlineWaterDrop className="mr-1.5 text-blue-500 text-lg" />{" "}
                        Annual Rainfall (mm){" "}
                        <span className="text-red-500 ml-1">*</span>
                        <Tooltip content="Average annual rainfall for your region" />
                      </label>
                      <input
                        type="number"
                        name="annual_rainfall"
                        value={formData.annual_rainfall}
                        onChange={handleChange}
                        placeholder="e.g., 800"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 hover:border-amber-300 text-sm"
                        min="0"
                        required
                      />
                    </div>

                    {/* Soil Health Section */}
                    <div className="bg-gradient-to-r from-amber-50 to-green-50/30 p-5 rounded-lg border border-amber-200/50 transition-all duration-300 hover:shadow-md">
                      <h4 className="text-md font-medium mb-4 flex items-center text-gray-800">
                        <MdOutlineScience className="mr-2 text-amber-600" />{" "}
                        Soil Health Parameters{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* pH */}
                        <div className="form-group">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            pH
                          </label>
                          <input
                            type="number"
                            name="ph"
                            value={formData.ph}
                            onChange={handleChange}
                            placeholder="e.g., 6.5"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            max="14"
                            step="0.1"
                            required
                          />
                        </div>
                        {/* N */}
                        <div className="form-group">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            N (kg/ha)
                          </label>
                          <input
                            type="number"
                            name="n"
                            value={formData.n}
                            onChange={handleChange}
                            placeholder="e.g., 140"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            required
                          />
                        </div>
                        {/* P */}
                        <div className="form-group">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            P (kg/ha)
                          </label>
                          <input
                            type="number"
                            name="p"
                            value={formData.p}
                            onChange={handleChange}
                            placeholder="e.g., 50"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            required
                          />
                        </div>
                        {/* K */}
                        <div className="form-group">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            K (kg/ha)
                          </label>
                          <input
                            type="number"
                            name="k"
                            value={formData.k}
                            onChange={handleChange}
                            placeholder="e.g., 200"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            required
                          />
                        </div>
                        {/* Organic Carbon */}
                        <div className="form-group md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Organic Carbon (%)
                          </label>
                          <input
                            type="number"
                            name="organic_carbon"
                            value={formData.organic_carbon}
                            onChange={handleChange}
                            placeholder="e.g., 0.5"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            max="10"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Farm Management Section */}
                    <div className="bg-gradient-to-r from-green-50/30 to-amber-50 p-5 rounded-lg border border-green-100/50 transition-all duration-300 hover:shadow-md">
                      <h4 className="text-md font-medium mb-4 flex items-center text-gray-800">
                        <GiFarmTractor className="mr-2 text-green-600" /> Farm
                        Management <span className="text-red-500 ml-1">*</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fertilizer (kg/ha)
                          </label>
                          <input
                            type="number"
                            name="fertilizer"
                            value={formData.fertilizer}
                            onChange={handleChange}
                            placeholder="e.g., 100"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pesticide (kg/ha)
                          </label>
                          <input
                            type="number"
                            name="pesticide"
                            value={formData.pesticide}
                            onChange={handleChange}
                            placeholder="e.g., 2"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-6 rounded-lg font-semibold text-base flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />{" "}
                            Predicting Yield...
                          </>
                        ) : (
                          <>
                            <FaChartLine className="mr-2" /> Predict Yield
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </FadeInSection>
            </div>
            {/* Results Section (Right Column) */}
            <div
              className={`lg:col-span-1 transition-opacity duration-500 ${
                activeTab !== "results"
                  ? "opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto"
                  : "opacity-100"
              }`}
            >
              <div className="sticky top-6">
                {" "}
                {/* Make results sticky */}
                {/* Loading State */}
                {isLoading && (
                  <FadeInSection>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse"></div>
                        <FaSpinner className="animate-spin text-3xl text-amber-500 absolute inset-0 m-auto" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        {analysisStage === 1
                          ? "Processing Data..."
                          : "Analyzing Conditions..."}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {analysisStage === 1
                          ? "Preparing inputs..."
                          : "Calculating prediction..."}
                      </p>
                    </div>
                  </FadeInSection>
                )}
                {/* Error State */}
                {error && !isLoading && (
                  <FadeInSection>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-md">
                      <div className="flex items-center">
                        <FaTimes className="text-red-500 mr-3 text-xl" />
                        <div>
                          <h3 className="text-sm font-medium text-red-800">
                            Prediction Error
                          </h3>
                          <p className="mt-1 text-sm text-red-700">{error}</p>
                          <button
                            onClick={() => {
                              setError("");
                              setActiveTab("form");
                            }}
                            className="mt-2 text-sm text-red-600 hover:underline"
                          >
                            Edit Inputs & Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                )}
                {/* Initial Placeholder State */}
                {!isLoading && !error && !prediction && !formSubmitted && (
                  <FadeInSection delay={200}>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                      <div className="bg-amber-100 p-4 rounded-full inline-block mb-4">
                        <GiWheat className="text-3xl text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        Yield Prediction Awaits
                      </h3>
                      <p className="text-sm text-gray-500 mb-5">
                        Fill the form to get AI-powered yield estimates and
                        insights.
                      </p>
                      {/* You can add illustrative icons/text here */}
                    </div>
                  </FadeInSection>
                )}
                {/* Success/Results State */}
                {!isLoading && prediction && (
                  <FadeInSection delay={100}>
                    <div className="bg-white rounded-lg shadow-md border border-amber-100 overflow-hidden">
                      {/* Results Header */}
                      <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 text-white">
                        <div className="flex items-center">
                          <FaRegCheckCircle className="text-xl mr-2.5" />
                          <h3 className="text-lg font-semibold">
                            Prediction Results
                          </h3>
                        </div>
                        <p className="text-green-100 text-xs mt-1">
                          Analysis for {formData.crop} in {formData.state}
                        </p>
                      </div>

                      {/* Results Content */}
                      <div className="p-5 space-y-5">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100/50 text-center">
                            <p className="text-xs text-green-700 font-medium mb-1 uppercase tracking-wider">
                              Predicted Yield
                            </p>
                            <p className="text-2xl font-bold text-green-800">
                              {prediction.yield.toFixed(2)}{" "}
                              <span className="text-sm font-normal">t/ha</span>
                            </p>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100/50 text-center">
                            <p className="text-xs text-amber-700 font-medium mb-1 uppercase tracking-wider">
                              Est. Production
                            </p>
                            <p className="text-2xl font-bold text-amber-800">
                              {prediction.estimated_production.toFixed(2)}{" "}
                              <span className="text-sm font-normal">tons</span>
                            </p>
                          </div>
                        </div>

                        {/* Weather Data */}
                        {weatherData && (
                          <div className="border-t pt-4 mt-4 border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                              <FaCloudSun className="mr-2 text-blue-500" />{" "}
                              Current Conditions
                            </h4>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100/50">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {/* Weather details */}
                                <div className="flex items-center">
                                  <span className="font-medium mr-1">
                                    Temp:
                                  </span>{" "}
                                  {weatherData.current_temp}°C
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium mr-1">
                                    Humidity:
                                  </span>{" "}
                                  {weatherData.current_humidity}%
                                </div>
                                <div className="col-span-2 flex items-center">
                                  <span className="font-medium mr-1">
                                    Condition:
                                  </span>{" "}
                                  <span className="capitalize">
                                    {weatherData.current_conditions?.toLowerCase()}
                                  </span>
                                </div>
                                <div className="col-span-2 flex items-center">
                                  <span className="font-medium mr-1">
                                    Est. Rainfall (Month):
                                  </span>{" "}
                                  {weatherData.monthly_rainfall_estimate?.toFixed(
                                    1
                                  )}{" "}
                                  cm
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        <div className="border-t pt-4 mt-4 border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <FaSeedling className="mr-2 text-green-600" />{" "}
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {prediction.recommendations?.map((rec, index) => (
                              <li
                                key={index}
                                className="flex items-start text-xs text-gray-700"
                              >
                                <FaRegCheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Buttons and Disclaimer */}
                        <div className="border-t pt-4 mt-4 border-gray-100 space-y-3">
                          <button
                            onClick={() => setActiveTab("form")}
                            className="w-full text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          >
                            Adjust Parameters & Predict Again
                          </button>
                          <p className="text-xs text-gray-400 text-center italic">
                            Note: Predictions are estimates based on provided
                            data. Actual results may vary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                )}
              </div>{" "}
              {/* End Sticky container */}
            </div>{" "}
            {/* End Results Column */}
          </div>{" "}
          {/* End Grid */}
        </div>{" "}
        {/* End Main Card */}
      </div>{" "}
      {/* End Max Width Container */}
      {/* Removed style jsx block */}
    </div> // End Root Container
  );
}

export default YieldPredictor;
