import React, { useEffect, useState } from "react";
import { getMarketPricesApi, getMarketSummaryApi, getMarketTrendsApi } from '../../services/api';

const API_BASE = "http://localhost:8000/api/v1"; // Updated to use the versioned API path

const MarketView = () => {
  const [marketData, setMarketData] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("");
  const [isFetchingCrop, setIsFetchingCrop] = useState(false);
  const [trendData, setTrendData] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch market prices from our enhanced API
        const pricesJson = await getMarketPricesApi();
        setMarketData(pricesJson.market_data || []);
        
        // Fetch AI-generated market summary
        const summaryJson = await getMarketSummaryApi();
        setSummary(summaryJson.summary || "");
        
        setError("");
      } catch (err) {
        console.error("Market data fetch error:", err);
        setError(`Failed to load market data: ${err.message}`);
      }
      setLoading(false);
    };
    fetchData();
  }, []);
  
  // Handler for fetching trends for a specific crop
  const fetchTrendData = async (crop) => {
    if (!crop) return;
    
    setIsFetchingCrop(true);
    setSelectedCrop(crop);
    
    try {
      const data = await getMarketTrendsApi(crop); // Use the imported getMarketTrendsApi function
      setTrendData(data.trend || "No trend data available");
    } catch (err) {
      setTrendData(`Could not fetch trend data: ${err.message}`);
    }
    
    setIsFetchingCrop(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-24 px-4 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="transform transition-all duration-500 hover:scale-[1.01]">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100">
            <div className="bg-green-800 px-6 py-4">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Market Prices
              </h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto mb-6">
                      <thead>
                        <tr className="bg-green-100 text-green-800">
                          <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">
                            Crop
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left font-semibold rounded-tr-lg">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketData.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b border-green-50 hover:bg-green-50 transition-colors duration-150 ${
                              index % 2 === 0 ? "bg-white" : "bg-green-25"
                            }`}
                            style={{
                              animation: `fadeIn 0.3s ease-in-out ${
                                index * 0.05
                              }s both`,
                            }}
                          >
                            <td className="px-4 py-3 font-medium">
                              {item.crop}
                            </td>
                            <td className="px-4 py-3">
                              {item.price_per_quintal
                                ? `₹${item.price_per_quintal}/quintal`
                                : item.price_per_tonne
                                ? `₹${item.price_per_tonne}/tonne`
                                : "-"}
                            </td>
                            <td className="px-4 py-3">{item.location}</td>
                            <td className="px-4 py-3">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className="bg-green-50 p-6 rounded-lg border border-green-100 transform transition-all duration-500"
                    style={{ animation: "slideUp 0.5s ease-out 0.3s both" }}
                  >
                    <h3 className="font-bold text-lg text-green-800 mb-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      AI Market Summary
                    </h3>
                    <div className="text-gray-700 whitespace-pre-line bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                      {summary}
                    </div>
                  </div>
                  
                  {/* Crop Selection for Trends */}
                  <div className="mt-8 p-6 bg-white rounded-lg border border-green-100 shadow">
                    <h3 className="font-bold text-lg text-green-800 mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      Market Trends Analysis
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['wheat', 'onion', 'soybean', 'sugarcane'].map(crop => (
                        <button
                          key={crop}
                          onClick={() => fetchTrendData(crop)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${selectedCrop === crop 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'}
                          `}
                        >
                          {crop.charAt(0).toUpperCase() + crop.slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    {selectedCrop && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="font-semibold text-green-800 mb-2">
                          {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} Trends
                        </h4>
                        
                        {isFetchingCrop ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-700"></div>
                          </div>
                        ) : (
                          <p className="text-gray-700">{trendData}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Listing Form */}
                    <div className="mt-6 pt-6 border-t border-green-100">
                      <h4 className="font-semibold text-green-800 mb-4">Create Listing for Your Crops</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        List your crops for potential buyers to see. Other farmers can contact you directly.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Wheat, Onion"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 10 quintals"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹)</label>
                          <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder="Price per quintal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <input
                            type="tel"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            placeholder="Your phone number"
                          />
                        </div>
                      </div>
                      
                      <button className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        Submit Listing
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MarketView;
