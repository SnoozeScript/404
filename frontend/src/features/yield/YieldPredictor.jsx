import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { predictYieldApi } from "../../services/api";
import {
  FaLeaf,
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
import { GiFarmTractor, GiPlantRoots, GiWheat } from "react-icons/gi";
import { WiHumidity } from "react-icons/wi";
import { MdOutlineScience, MdOutlineWaterDrop } from "react-icons/md";

// Fade in animation component
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = React.useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible(true);
        observer.unobserve(domRef.current);
      }
    });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      className="transition-all duration-700 ease-out"
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

// Tooltip component for form fields
const Tooltip = ({ content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button 
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
  // Form state
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

  // UI state
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

  // Available options
  const crops = [
    "Rice", "Jowar", "Bajra", "Maize", "Ragi", "Wheat", 
    "Gram", "Tur", "Other Pulses", "Groundnut", "Sunflower", 
    "Soyabean", "Safflower", "Nigerseed", "Other Oilseeds", 
    "Cotton", "Sugarcane", "Tobacco", "Potato", "Onion", 
    "Other Vegetables", "Fruits", "Total Foodgrains"
  ];

  const seasons = ["Kharif", "Rabi", "Summer"];
  const states = ["Maharashtra", "Karnataka", "Gujarat", "Madhya Pradesh", "Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal", "Tamil Nadu", "Andhra Pradesh", "Telangana"];

  // State center coordinates
  const STATE_COORDINATES = useMemo(() => ({
    "Maharashtra": {lat: 19.7515, lng: 75.7139},
    "Karnataka": {lat: 15.3173, lng: 75.7139},
    "Gujarat": {lat: 22.2587, lng: 71.1924},
    "Madhya Pradesh": {lat: 23.4733, lng: 77.9473},
    "Punjab": {lat: 31.1471, lng: 75.3412},
    "Haryana": {lat: 29.0588, lng: 76.0856},
    "Uttar Pradesh": {lat: 26.8467, lng: 80.9462},
    "Bihar": {lat: 25.0961, lng: 85.3131},
    "West Bengal": {lat: 22.9868, lng: 87.8550},
    "Tamil Nadu": {lat: 11.1271, lng: 78.6569},
    "Andhra Pradesh": {lat: 15.9129, lng: 79.7400},
    "Telangana": {lat: 18.1124, lng: 79.0193},
  }), []);

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current) return;

      const defaultCenter = STATE_COORDINATES[formData.state] || { lat: 19.7515, lng: 75.7139 };
      
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 8,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        draggable: true,
        title: 'Farm Location',
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
        }
      });

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        setFormData(prev => ({
          ...prev,
          latitude: position.lat(),
          longitude: position.lng(),
        }));
        setLocationSelected(true);
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setFormData(prev => ({
              ...prev,
              location_name: results[0].formatted_address,
            }));
          }
        });
      });

      map.addListener('click', (event) => {
        marker.setPosition(event.latLng);
        setFormData(prev => ({
          ...prev,
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        }));
        setLocationSelected(true);
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: event.latLng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setFormData(prev => ({
              ...prev,
              location_name: results[0].formatted_address,
            }));
          }
        });
      });

      const input = document.getElementById('location-search');
      const searchBox = new window.google.maps.places.SearchBox(input);
      
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
      });

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        map.setCenter(place.geometry.location);
        map.setZoom(12);
        marker.setPosition(place.geometry.location);

        setFormData(prev => ({
          ...prev,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          location_name: place.formatted_address || place.name,
        }));
        setLocationSelected(true);
      });

      mapRef.current = { map, marker };
    };

    if (showMap) {
      loadGoogleMapsAPI();
    }
  }, [showMap, formData.state, STATE_COORDINATES]);

  // Update map center when state changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.map && STATE_COORDINATES[formData.state]) {
      const newCenter = STATE_COORDINATES[formData.state];
      mapRef.current.map.setCenter(newCenter);
      mapRef.current.marker.setPosition(newCenter);
      
      setFormData(prev => ({
        ...prev,
        latitude: newCenter.lat,
        longitude: newCenter.lng,
        location_name: `${formData.state}, India`,
      }));
    }
  }, [formData.state, STATE_COORDINATES]);

  // Progress animation effect
  useEffect(() => {
    let interval;
    if (isLoading) {
      if (analysisStage === 1) {
        setProgressPercent(0);
        interval = setInterval(() => {
          setProgressPercent((prev) => {
            if (prev < 45) return prev + 1;
            return prev;
          });
        }, 30);
      } else if (analysisStage === 2) {
        interval = setInterval(() => {
          setProgressPercent((prev) => {
            if (prev < 90) return prev + 1;
            return prev;
          });
        }, 40);
      }
    } else {
      setProgressPercent(0);
    }

    return () => clearInterval(interval);
  }, [isLoading, analysisStage]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);
    setError("");
    setFormSubmitted(true);
    setActiveTab("results");

    setAnalysisStage(1);

    setTimeout(() => {
      setAnalysisStage(2);
    }, 1500);

    try {
      const numericData = {
        ...formData,
        area: parseFloat(formData.area),
        annual_rainfall: parseFloat(formData.annual_rainfall),
        fertilizer: parseFloat(formData.fertilizer),
        pesticide: parseFloat(formData.pesticide),
        ph: parseFloat(formData.ph),
        n: parseFloat(formData.n),
        p: parseFloat(formData.p),
        k: parseFloat(formData.k),
        organic_carbon: parseFloat(formData.organic_carbon),
      };

      if (formData.latitude && formData.longitude) {
        numericData.latitude = parseFloat(formData.latitude);
        numericData.longitude = parseFloat(formData.longitude);
        numericData.location_name = formData.location_name;
      }

      const result = await predictYieldApi(numericData);
      
      setPrediction(result);
      setAnalysisStage(3);
      setProgressPercent(100);

      if (result.weather_data) {
        setWeatherData(result.weather_data);
      }
    } catch (err) {
      setError(err.message || "Failed to predict yield. Please try again.");
      setAnalysisStage(0);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Reset form
  const handleReset = () => {
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
    setAnalysisStage(0);
    setFormSubmitted(false);
    setActiveTab("form");
  };

  // Calculate yield potential based on inputs (simplified example)
  const calculateYieldPotential = useMemo(() => {
    if (!formData.crop || !formData.area || !formData.annual_rainfall) return null;
    
    // This is a very simplified calculation for UI purposes only
    // In a real app, this would be replaced with actual predictive logic
    const baseYield = {
      "Rice": 3.5, "Wheat": 2.8, "Maize": 3.0, "Cotton": 1.2, "Sugarcane": 70
    }[formData.crop] || 2.5;
    
    const rainfallFactor = Math.min(1, formData.annual_rainfall / 1000);
    const soilFactor = (parseFloat(formData.ph) > 5.5 && parseFloat(formData.ph) < 7.5) ? 1.1 : 0.9;
    
    return (baseYield * rainfallFactor * soilFactor).toFixed(1);
  }, [formData]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-100">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-amber-100 p-3 rounded-full mr-4">
            <GiWheat className="text-3xl text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Crop Yield Predictor</h1>
            <p className="text-gray-600">Optimize your harvest with AI-powered yield predictions</p>
          </div>
        </div>
        
        {calculateYieldPotential && (
          <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-gray-600">Estimated yield potential</p>
            <p className="text-2xl font-bold text-green-700">
              {calculateYieldPotential} <span className="text-base font-normal">tons/ha</span>
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className={`lg:col-span-2 ${activeTab !== "form" ? "hidden lg:block" : ""}`}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaSeedling className="mr-2 text-green-500" />
                Crop Details
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  disabled={!prediction}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${prediction ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  View Results
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Crop Selection */}
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaLeaf className="mr-2 text-green-500" />
                    Crop Type
                    <Tooltip content="Select the primary crop you're growing this season" />
                  </label>
                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
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

                {/* Season Selection */}
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaCloudSun className="mr-2 text-blue-500" />
                    Growing Season
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
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

                {/* State Selection */}
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    required
                  >
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Input */}
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaRuler className="mr-2 text-gray-600" />
                    Area (Hectares)
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g., 2.5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              {/* Location Selection */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  Farm Location
                  <Tooltip content="Precise location helps us provide weather-specific recommendations" />
                </label>
                
                <div className="flex items-center mb-3">
                  <button 
                    type="button" 
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    <FaSearchLocation className="mr-2" />
                    {showMap ? "Hide Map" : "Select on Map"}
                  </button>
                  {locationSelected && (
                    <span className="ml-3 text-sm text-green-600 flex items-center">
                      <FaRegCheckCircle className="mr-1" /> Location selected
                    </span>
                  )}
                </div>

                {showMap && (
                  <div className="mt-2 space-y-3">
                    <input
                      id="location-search"
                      type="text"
                      placeholder="Search for a location"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div 
                      ref={mapContainerRef} 
                      className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100 shadow-inner"
                    ></div>
                    {formData.location_name && (
                      <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        Selected: {formData.location_name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rainfall Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MdOutlineWaterDrop className="mr-2 text-blue-500 text-lg" />
                  Annual Rainfall (mm)
                  <Tooltip content="Average annual rainfall for your region in millimeters" />
                </label>
                <input
                  type="number"
                  name="annual_rainfall"
                  value={formData.annual_rainfall}
                  onChange={handleChange}
                  placeholder="e.g., 800"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="0"
                  required
                />
              </div>

              {/* Soil Health Section */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium mb-4 flex items-center text-gray-800">
                  <MdOutlineScience className="mr-2 text-amber-600" />
                  Soil Health Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      pH Level
                      <Tooltip content="Soil pH affects nutrient availability (ideal range: 6.0-7.0 for most crops)" />
                    </label>
                    <input
                      type="number"
                      name="ph"
                      value={formData.ph}
                      onChange={handleChange}
                      placeholder="e.g., 6.5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      max="14"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nitrogen (kg/ha)
                      <Tooltip content="Essential for leaf growth and green color" />
                    </label>
                    <input
                      type="number"
                      name="n"
                      value={formData.n}
                      onChange={handleChange}
                      placeholder="e.g., 140"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phosphorus (kg/ha)
                      <Tooltip content="Important for root development and energy transfer" />
                    </label>
                    <input
                      type="number"
                      name="p"
                      value={formData.p}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Potassium (kg/ha)
                      <Tooltip content="Enhances disease resistance and fruit quality" />
                    </label>
                    <input
                      type="number"
                      name="k"
                      value={formData.k}
                      onChange={handleChange}
                      placeholder="e.g., 200"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organic Carbon (%)
                      <Tooltip content="Indicates soil organic matter content and fertility" />
                    </label>
                    <input
                      type="number"
                      name="organic_carbon"
                      value={formData.organic_carbon}
                      onChange={handleChange}
                      placeholder="e.g., 0.5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      max="10"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Farm Management Section */}
              <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                <h4 className="text-md font-medium mb-4 flex items-center text-gray-800">
                  <GiFarmTractor className="mr-2 text-green-600" />
                  Farm Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fertilizer (kg/ha)
                      <Tooltip content="Total fertilizer applied per hectare this season" />
                    </label>
                    <input
                      type="number"
                      name="fertilizer"
                      value={formData.fertilizer}
                      onChange={handleChange}
                      placeholder="e.g., 100"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pesticide (kg/ha)
                      <Tooltip content="Total pesticide applied per hectare this season" />
                    </label>
                    <input
                      type="number"
                      name="pesticide"
                      value={formData.pesticide}
                      onChange={handleChange}
                      placeholder="e.g., 2"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
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
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <FaChartLine className="mr-2" />
                      Predict Yield
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        <div className={`${activeTab !== "results" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-6">
            {isLoading && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-center py-4">
                  <div className="mb-6">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
                      <FaSpinner className="animate-spin text-4xl text-amber-600 absolute inset-0 m-auto" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {analysisStage === 1
                        ? "Processing Data..."
                        : "Analyzing Conditions..."}
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600">
                      {analysisStage === 1
                        ? "Preparing your farm data for analysis..."
                        : "Calculating expected yield based on soil, weather and management factors..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <FaTimes className="text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Prediction Error</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                    <div className="mt-3">
                      <button
                        onClick={() => setError("")}
                        className="text-sm text-red-600 hover:text-red-500 font-medium"
                      >
                        Try again →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && !prediction && !formSubmitted && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-center py-6">
                  <div className="bg-amber-100 p-4 rounded-full inline-block mb-4">
                    <GiWheat className="text-4xl text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Yield Prediction</h3>
                  <p className="text-gray-600 mb-6">
                    Fill out the form with your crop details to get an AI-powered yield
                    prediction and personalized farming recommendations.
                  </p>
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <FaLeaf className="text-green-500" />
                        </div>
                        <h4 className="font-medium">Crop-specific predictions</h4>
                      </div>
                      <p className="text-sm text-gray-600">Accurate forecasts tailored to your selected crop variety</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <FaChartLine className="text-blue-500" />
                        </div>
                        <h4 className="font-medium">Precision estimates</h4>
                      </div>
                      <p className="text-sm text-gray-600">Data-driven yield projections for your exact conditions</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <GiFarmTractor className="text-amber-500" />
                        </div>
                        <h4 className="font-medium">Actionable insights</h4>
                      </div>
                      <p className="text-sm text-gray-600">Practical recommendations to optimize your harvest</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && prediction && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Results Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 text-white">
                  <div className="flex items-center">
                    <FaRegCheckCircle className="text-2xl mr-3" />
                    <h3 className="text-xl font-semibold">Prediction Results</h3>
                  </div>
                  <p className="text-green-100 text-sm mt-1">
                    Analysis completed for {formData.crop} in {formData.state}
                  </p>
                </div>

                {/* Results Content */}
                <div className="p-5">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <p className="text-sm text-green-700 font-medium mb-1">Predicted Yield</p>
                      <p className="text-3xl font-bold text-green-800">
                        {prediction.yield.toFixed(2)}
                        <span className="text-base font-normal ml-1">tons/ha</span>
                      </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <p className="text-sm text-amber-700 font-medium mb-1">Estimated Production</p>
                      <p className="text-3xl font-bold text-amber-800">
                        {prediction.estimated_production.toFixed(2)}
                        <span className="text-base font-normal ml-1">tons</span>
                      </p>
                    </div>
                  </div>

                  {/* Weather data if available */}
                  {weatherData && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <FaCloudSun className="mr-2 text-blue-500" />
                        Current Weather Conditions
                      </h4>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <FaCloudSun className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-gray-600">Temperature</p>
                              <p className="font-medium">{weatherData.current_temp}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <WiHumidity className="text-blue-500 text-xl" />
                            </div>
                            <div>
                              <p className="text-gray-600">Humidity</p>
                              <p className="font-medium">{weatherData.current_humidity}%</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <MdOutlineWaterDrop className="text-blue-500 text-xl" />
                            </div>
                            <div>
                              <p className="text-gray-600">Conditions</p>
                              <p className="font-medium capitalize">{weatherData.current_conditions.toLowerCase()}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <FaCloudSun className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-gray-600">Est. Rainfall</p>
                              <p className="font-medium">{weatherData.monthly_rainfall_estimate.toFixed(1)} cm</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <FaSeedling className="mr-2 text-green-600" />
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {prediction.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start bg-green-50 p-3 rounded-lg">
                          <div className="bg-green-100 p-1 rounded-full mt-0.5 mr-3">
                            <FaRegCheckCircle className="text-green-500 text-xs" />
                          </div>
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="text-xs text-gray-500 mt-6 p-3 bg-gray-50 rounded-lg">
                    <p>
                      <strong>Note:</strong> This prediction is based on the provided
                      inputs and historical data. Actual yields may vary based on
                      weather conditions and farm management practices.
                    </p>
                  </div>

                  {/* Back to Form Button */}
                  <button
                    onClick={() => setActiveTab("form")}
                    className="w-full mt-4 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Adjust Parameters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default YieldPredictor;