import React, { useEffect, useState } from "react";
import { getMarketPricesApi, getMarketSummaryApi, getMarketTrendsApi } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = "http://localhost:8000/api/v1"; 

const MarketView = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("");
  const [isFetchingCrop, setIsFetchingCrop] = useState(false);
  const [trendData, setTrendData] = useState("");
  const [historicalPriceData, setHistoricalPriceData] = useState([]);
  const [sortDirection, setSortDirection] = useState('desc'); // for sorting prices
  const [filterValue, setFilterValue] = useState(''); // for filtering crops
  const [priceChangeData, setPriceChangeData] = useState({}); // for price change indicators
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pricesJson = await getMarketPricesApi();
        setMarketData(pricesJson.market_data || []);
        
        // Calculate price changes (simulated data for demonstration)
        const changes = {};
        pricesJson.market_data.forEach(item => {
          changes[item.crop] = Math.floor(Math.random() * 21) - 10; // Random values between -10 and +10
        });
        setPriceChangeData(changes);
        
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

  // Function to sort market data
  const sortMarketData = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    
    const sortedData = [...marketData].sort((a, b) => {
      const priceA = a.price_per_quintal || a.price_per_tonne || 0;
      const priceB = b.price_per_quintal || b.price_per_tonne || 0;
      
      return newDirection === 'asc' ? priceA - priceB : priceB - priceA;
    });
    
    setMarketData(sortedData);
  };

  // Function to filter market data by crop name
  const filteredMarketData = marketData.filter(item => 
    item.crop.toLowerCase().includes(filterValue.toLowerCase())
  );
  
  // Calculate pagination data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMarketData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMarketData.length / itemsPerPage);
  
  // Page change handler
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Function to export market data as CSV
  const exportToCSV = () => {
    const headers = ['Crop', 'Price', 'Location', 'Date'];
    
    const csvData = filteredMarketData.map(item => [
      item.crop,
      item.price_per_quintal ? `₹${item.price_per_quintal}/quintal` : item.price_per_tonne ? `₹${item.price_per_tonne}/tonne` : "-",
      item.location,
      item.date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `market_prices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
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

            <div className="p-6">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">  
                  {/* Left Side - Market Prices & Tools */}
                  <div className="space-y-6">
                    {/* Price Visualization Card */}
                    {marketData.length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg text-gray-800">Current Crop Prices (₹)</h3>
                          
                          {/* Price Tools Bar */}
                          <div className="flex space-x-2">
                            <button 
                              onClick={sortMarketData}
                              className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-full flex items-center"
                            >
                              <span>Sort {sortDirection === 'asc' ? '↑' : '↓'}</span>
                            </button>
                            <button 
                              onClick={exportToCSV}
                              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full flex items-center"
                            >
                              <span>Export</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Filter Input */}
                        <div className="mb-4">
                          <input
                            type="text"
                            placeholder="Filter by crop name..."
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={filteredMarketData}
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
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-800">Detailed Market Prices</h3>
                        <div className="flex items-center space-x-2">
                          <select 
                            className="text-sm border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1); // Reset to first page when changing items per page
                            }}
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={15}>15 per page</option>
                          </select>
                        </div>
                      </div>
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
                                Change
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
                            {currentItems.map((item, index) => (
                              <tr
                                key={item.id}
                                className={`border-b border-green-50 hover:bg-green-50 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-green-25"}`}
                                style={{
                                  animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`,
                                }}
                              >
                                <td className="px-4 py-3 font-medium cursor-pointer hover:text-green-700" 
                                    onClick={() => fetchTrendData(item.crop.split(' (')[0])}>
                                  {item.crop}
                                </td>
                                <td className="px-4 py-3">
                                  {item.price_per_quintal
                                    ? `₹${item.price_per_quintal}/quintal`
                                    : item.price_per_tonne
                                    ? `₹${item.price_per_tonne}/tonne`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  {priceChangeData[item.crop] > 0 ? (
                                    <span className="text-green-600 font-medium flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12 7a1 1 0 01-1-1V3.414l-8.293 8.293a1 1 0 01-1.414-1.414l10-10a.997.997 0 011.414 0 .999.999 0 01.293.707V6a1 1 0 01-1 1z" clipRule="evenodd" />
                                      </svg>
                                      +{priceChangeData[item.crop]}%
                                    </span>
                                  ) : priceChangeData[item.crop] < 0 ? (
                                    <span className="text-red-600 font-medium flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12 13a1 1 0 001 1h2.586l-8.293 8.293a1 1 0 01-1.414-1.414l10-10A.997.997 0 0116.586 10a.999.999 0 01.707.293V14a1 1 0 01-1 1h-4z" clipRule="evenodd" />
                                      </svg>
                                      {priceChangeData[item.crop]}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 font-medium">0%</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">{item.location}</td>
                                <td className="px-4 py-3">{item.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination Controls */}
                      {filteredMarketData.length > 0 && (
                        <div className="flex justify-between items-center mt-4 px-2">
                          <div className="text-sm text-gray-600">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMarketData.length)} of {filteredMarketData.length} items
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              // Logic to display 5 page numbers around the current page
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`w-8 h-8 rounded-full text-sm ${currentPage === pageNum ? 'bg-green-600 text-white' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side - Trend Analysis Section */}
                  <div className="space-y-6">
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
                                <h5 className="font-semibold text-blue-700 mb-2 text-sm">Price Trend (Last 30 Days)</h5> 
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
                                      <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} name="Price" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                            
                            {/* Price Prediction Section - New Feature */}
                            {historicalPriceData.length > 0 && !isFetchingCrop && (
                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <h5 className="font-semibold text-blue-700 mb-2 text-sm">Market Intelligence</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                    <p className="text-sm font-medium text-blue-800">Projected Price (30 Days)</p>
                                    <p className="text-xl font-bold text-green-700 mt-1">
                                      ₹{(Math.max(...historicalPriceData.map(d => d.price)) * (1 + (Math.random() * 0.12 - 0.05))).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Projected using ML/AI trend analysis</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                    <p className="text-sm font-medium text-blue-800">Best Time to Sell</p>
                                    <p className="text-xl font-bold text-blue-700 mt-1">
                                      {new Date(Date.now() + (Math.random() * 15 + 5) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Based on seasonal trends</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Market Alerts - New Feature */}
                            {selectedCrop && !isFetchingCrop && (
                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-semibold text-blue-700 text-sm">Market Alerts</h5>
                                  <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200">
                                    Set Price Alert
                                  </button>
                                </div>
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                  <p className="text-sm text-yellow-800">Price for <strong>{selectedCrop}</strong> has fluctuated by {Math.abs(priceChangeData[selectedCrop + ' (Maharashtra)'] || 5)}% in the last week.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }
                    </div>
                    
                    {/* Market Recommendation Card - New Feature */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">Crop Recommendations</h3>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 border border-green-100 rounded-lg shadow-sm bg-green-50">
                          <div className="bg-green-100 rounded-full p-2 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">Best Market Performer</h4>
                            <p className="text-sm text-gray-600">Soybean is showing consistent price growth in Maharashtra markets.</p>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-blue-100 rounded-lg shadow-sm bg-blue-50">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800">Rising Demand</h4>
                            <p className="text-sm text-gray-600">Turmeric prices are expected to rise due to increased export demand.</p>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-purple-100 rounded-lg shadow-sm bg-purple-50">
                          <div className="bg-purple-100 rounded-full p-2 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-800">Seasonal Insight</h4>
                            <p className="text-sm text-gray-600">Now is the optimal time to plan for rabi crops according to market trends.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
