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
} from "react-icons/fa";
import { GiFarmTractor, GiPlantRoots, GiWheat } from "react-icons/gi";
import { WiHumidity } from "react-icons/wi";

// Fade in component for animation - reused from DiseaseDetector
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

    const currentRef = domRef.current; // Store ref value to avoid closure issues
    
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) { // Use stored ref value in cleanup
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

  // Map refs and state
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [showMap, setShowMap] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [analysisStage, setAnalysisStage] = useState(0); // 0: none, 1: processing, 2: analyzing, 3: complete
  const [progressPercent, setProgressPercent] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

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

  // State center coordinates (approximate) for initial map view - wrapped in useMemo to optimize performance
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
    // Load Google Maps API script
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

    // Initialize map once API is loaded
    const initializeMap = () => {
      if (!mapContainerRef.current) return;

      const defaultCenter = STATE_COORDINATES[formData.state] || { lat: 19.7515, lng: 75.7139 };
      
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 8,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Create marker for selected location
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        draggable: true,
        title: 'Farm Location',
      });

      // Update coordinates when marker is dragged
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        setFormData(prev => ({
          ...prev,
          latitude: position.lat(),
          longitude: position.lng(),
        }));
        setLocationSelected(true);
        
        // Get location name from coordinates
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

      // Allow clicking on map to set marker
      map.addListener('click', (event) => {
        marker.setPosition(event.latLng);
        setFormData(prev => ({
          ...prev,
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        }));
        setLocationSelected(true);
        
        // Get location name from coordinates
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

      // Add search box
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

        // Set map center and marker to selected place
        map.setCenter(place.geometry.location);
        map.setZoom(12);
        marker.setPosition(place.geometry.location);

        // Update form data
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

    // Animation stages
    setAnalysisStage(1); // Processing

    setTimeout(() => {
      setAnalysisStage(2); // Analyzing
    }, 1500);

    try {
      // Convert numeric fields
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

      // Add location data if available
      if (formData.latitude && formData.longitude) {
        numericData.latitude = parseFloat(formData.latitude);
        numericData.longitude = parseFloat(formData.longitude);
        numericData.location_name = formData.location_name;
      }

      const result = await predictYieldApi(numericData);
      
      // Set prediction result
      setPrediction(result);
      setAnalysisStage(3); // Complete
      setProgressPercent(100);

      // Set weather data if available in the response
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
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg mt-8">
      <div className="flex items-center mb-6">
        <GiWheat className="text-3xl text-amber-600 mr-3" />
        <h2 className="text-2xl md:text-3xl font-bold text-amber-700">Crop Yield Predictor</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-amber-50 p-4 md:p-6 rounded-lg shadow-md">
          <FadeInSection delay={100}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaSeedling className="mr-2 text-green-600" />
              Enter Crop Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Crop Selection */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaLeaf className="inline mr-2 text-green-500" />
                  Crop Type
                </label>
                <select
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCloudSun className="inline mr-2 text-blue-500" />
                  Growing Season
                </label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMapMarkerAlt className="inline mr-2 text-red-500" />
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                >
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Selection */}
              <div className="form-group mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMapMarkerAlt className="inline mr-2 text-red-500" />
                  Farm Location
                </label>
                
                <div className="flex items-center mb-2">
                  <button 
                    type="button" 
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div 
                      ref={mapContainerRef} 
                      className="w-full h-64 rounded-md border border-gray-300 bg-gray-100"
                    ></div>
                    {formData.location_name && (
                      <div className="text-sm text-gray-600">
                        Selected: {formData.location_name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Area Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaRuler className="inline mr-2 text-gray-600" />
                  Area (Hectares)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g., 2.5"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              {/* Rainfall Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <WiHumidity className="inline mr-2 text-blue-500" />
                  Annual Rainfall (mm)
                </label>
                <input
                  type="number"
                  name="annual_rainfall"
                  value={formData.annual_rainfall}
                  onChange={handleChange}
                  placeholder="e.g., 800"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="0"
                  required
                />
              </div>

              {/* Soil Health Parameters */}
              <FadeInSection delay={200}>
                <div className="bg-white p-3 rounded-md shadow-sm mb-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <GiPlantRoots className="mr-2 text-brown-600" />
                    Soil Health Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        pH Level
                      </label>
                      <input
                        type="number"
                        name="ph"
                        value={formData.ph}
                        onChange={handleChange}
                        placeholder="e.g., 6.5"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max="14"
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nitrogen (kg/ha)
                      </label>
                      <input
                        type="number"
                        name="n"
                        value={formData.n}
                        onChange={handleChange}
                        placeholder="e.g., 140"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phosphorus (kg/ha)
                      </label>
                      <input
                        type="number"
                        name="p"
                        value={formData.p}
                        onChange={handleChange}
                        placeholder="e.g., 50"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Potassium (kg/ha)
                      </label>
                      <input
                        type="number"
                        name="k"
                        value={formData.k}
                        onChange={handleChange}
                        placeholder="e.g., 200"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organic Carbon (%)
                    </label>
                    <input
                      type="number"
                      name="organic_carbon"
                      value={formData.organic_carbon}
                      onChange={handleChange}
                      placeholder="e.g., 0.5"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                      max="10"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </FadeInSection>

              {/* Fertilizer and Pesticide Inputs */}
              <FadeInSection delay={300}>
                <div className="bg-white p-3 rounded-md shadow-sm mb-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <GiFarmTractor className="mr-2 text-green-700" />
                    Farm Management
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </FadeInSection>

              {/* Submit and Reset Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center transition-colors duration-300"
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
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-300"
                >
                  Reset
                </button>
              </div>
            </form>
          </FadeInSection>
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-md">
          {isLoading && (
            <FadeInSection>
              <div className="text-center py-8">
                <div className="mb-4">
                  <FaSpinner className="animate-spin text-4xl text-amber-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {analysisStage === 1
                    ? "Processing Data..."
                    : "Analyzing Crop Conditions..."}
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-gray-600">
                  {analysisStage === 1
                    ? "Preparing your data for analysis..."
                    : "Calculating expected yield based on conditions..."}
                </p>
              </div>
            </FadeInSection>
          )}

          {error && !isLoading && (
            <FadeInSection>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaTimes className="text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          )}

          {!isLoading && !error && !prediction && !formSubmitted && (
            <FadeInSection>
              <div className="text-center py-12">
                <GiWheat className="text-6xl text-amber-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Yield Prediction</h3>
                <p className="text-gray-600 mb-6">
                  Fill out the form with your crop details to get an estimated yield
                  prediction and personalized recommendations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <FaLeaf className="text-2xl text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Crop-specific predictions</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <FaChartLine className="text-2xl text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Yield estimates</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <GiFarmTractor className="text-2xl text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Farming recommendations</p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          )}

          {!isLoading && prediction && (
            <FadeInSection delay={300}>
              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <FaRegCheckCircle className="text-2xl text-green-500 mr-3" />
                  <h3 className="text-xl font-semibold">Prediction Results</h3>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Predicted Yield</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {prediction.yield.toFixed(2)}
                        <span className="text-sm font-normal ml-1">tons/ha</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Estimated Production</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {prediction.estimated_production.toFixed(2)}
                        <span className="text-sm font-normal ml-1">tons</span>
                      </p>
                    </div>
                  </div>

                  {/* Weather data if available */}
                  {weatherData && (
                    <div className="mt-4 mb-4 bg-blue-50 p-3 rounded-md">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <FaCloudSun className="mr-2 text-blue-500" />
                        Current Weather Conditions
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Temperature:</span>
                          <span className="ml-2 font-medium">{weatherData.current_temp}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Humidity:</span>
                          <span className="ml-2 font-medium">{weatherData.current_humidity}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Conditions:</span>
                          <span className="ml-2 font-medium">{weatherData.current_conditions}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Est. Monthly Rainfall:</span>
                          <span className="ml-2 font-medium">{weatherData.monthly_rainfall_estimate.toFixed(1)} cm</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <FaSeedling className="mr-2 text-green-600" />
                      Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 bg-green-50 p-4 rounded-md">
                      {prediction.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-4">
                  <p>
                    <strong>Note:</strong> This prediction is based on the provided
                    inputs and historical data. Actual yields may vary based on
                    weather conditions and farm management practices.
                  </p>
                </div>
              </div>
            </FadeInSection>
          )}
        </div>
      </div>
    </div>
  );
}

export default YieldPredictor;
