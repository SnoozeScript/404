import React, { useEffect, useState } from "react";
import { getMarketPricesApi, getMarketSummaryApi, getMarketTrendsApi } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = "http://localhost:8000/api/v1"; 

const MarketView = () => {
  const [marketData, setMarketData] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("");
  const [isFetchingCrop, setIsFetchingCrop] = useState(false);
  const [trendData, setTrendData] = useState("");
  const [historicalPriceData, setHistoricalPriceData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pricesJson = await getMarketPricesApi();
        setMarketData(pricesJson.market_data || []);
        
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
  
  const fetchTrendData = async (crop) => {
    if (!crop) return;
    
    setIsFetchingCrop(true);
    setSelectedCrop(crop);
    setTrendData(""); // Clear previous trend text
    setHistoricalPriceData([]); // Clear previous historical data
    
    try {
      console.log(`[MarketView] Fetching trends for: ${crop}`); // <-- Log start
      const data = await getMarketTrendsApi(crop); 
      console.log('[MarketView] API Response Received:', data); // <-- Log raw response

      // Check if response structure is as expected
      if (data && typeof data === 'object') {
        setTrendData(data.message || "No trend summary available."); // Use 'message' for summary text
        setHistoricalPriceData(data.historical_data || []); // Store historical data
        console.log('[MarketView] State updated successfully.'); // <-- Log success
      } else {
        console.error('[MarketView] Unexpected API response format:', data);
        setTrendData('Error: Unexpected API response format.');
        setHistoricalPriceData([]);
      }

    } catch (err) {
      console.error('[MarketView] Error fetching or processing trend data:', err); // <-- Log error
      setTrendData(`Could not fetch trend data: ${err.message}`);
      setHistoricalPriceData([]);
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
                Market Overview
              </h2>
            </div>

            <div className="p-6 space-y-8"> 
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              ) : (
                <>
                  {/* AI Summary Card */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="font-semibold text-lg text-green-800 mb-2">Market Summary</h3>
                    <p className="text-gray-700 text-sm">
                      {summary || "Loading summary..."}
                    </p>
                  </div>
                  
                  {/* Price Visualization Card */}
                  {marketData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">Current Crop Prices (₹ per Quintal/Tonne)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={marketData}
                          margin={{
                            top: 5, right: 30, left: 20, bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="crop" angle={-15} textAnchor="end" height={60} interval={0} fontSize={10} />
                          <YAxis />
                          <Tooltip formatter={(value) => [`₹${value}`, "Price"]}/>
                          <Legend />
                          <Bar dataKey="price_per_quintal" fill="#10B981" name="Price per Quintal" />
                          <Bar dataKey="price_per_tonne" fill="#3B82F6" name="Price per Tonne" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Market Data Table Card */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Detailed Market Prices</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-green-200 border border-green-100 rounded-lg shadow-sm">
                        <thead className="bg-green-50">
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
                  </div>

                  {/* Trend Analysis Card */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Analyze Market Trends</h3>
                    <div className="flex flex-wrap gap-2 mb-4"> 
                      {
                        [...new Set(marketData.map(item => item.crop.split(' (')[0]))].map(cropName => (
                          <button 
                            key={cropName}
                            onClick={() => fetchTrendData(cropName)}
                            className={`mr-2 mb-2 px-3 py-1 rounded-full text-sm transition-colors ${selectedCrop === cropName ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                            disabled={isFetchingCrop && selectedCrop === cropName}
                          >
                            {cropName}
                          </button>
                        ))
                      }
                    </div>
                    {
                      selectedCrop && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fadeIn">
                          <h4 className="font-semibold text-blue-800 mb-2">{selectedCrop} Trend Summary</h4>
                          {isFetchingCrop ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-700"></div>
                            </div>
                          ) : (
                            <p className="text-gray-700">{trendData}</p>
                          )}
                          
                          {/* Historical Price Chart */}
                          {historicalPriceData.length > 0 && !isFetchingCrop && (
                            <div className="mt-4">
                              <h5 className="font-semibold text-blue-700 mb-2 text-sm">Simulated Price Trend (Last 30 Days)</h5> 
                              <div className="h-64"> 
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={historicalPriceData}
                                    margin={{
                                      top: 5, right: 30, left: 20, bottom: 5,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={10} tickFormatter={(tick) => tick.slice(5)} />{/* Show Month-Day */}
                                    <YAxis domain={['auto', 'auto']} fontSize={10} />
                                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, "Price"]}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} name="Simulated Price" />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
        /* Add animation class */
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MarketView;
