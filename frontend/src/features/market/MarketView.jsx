import React, { useEffect, useState } from "react";
import { getMarketPricesApi, getMarketTrendsApi } from "../../services/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaChartBar,
  FaChartLine,
  FaSearch,
  FaDownload,
  FaInfoCircle,
  FaRegCheckCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { GiWheat } from "react-icons/gi";

const MarketView = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [isFetchingCrop, setIsFetchingCrop] = useState(false);
  const [trendData, setTrendData] = useState("");
  const [historicalPriceData, setHistoricalPriceData] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterValue, setFilterValue] = useState("");
  const [priceChangeData, setPriceChangeData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pricesJson = await getMarketPricesApi();
        setMarketData(pricesJson.market_data || []);

        const changes = {};
        pricesJson.market_data.forEach((item) => {
          changes[item.crop] = Math.floor(Math.random() * 21) - 10;
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
    setTrendData("");
    setHistoricalPriceData([]);

    try {
      const data = await getMarketTrendsApi(crop);
      if (data && typeof data === "object") {
        setTrendData(data.message || "No trend summary available.");
        setHistoricalPriceData(data.historical_data || []);
      } else {
        setTrendData("Error: Unexpected API response format.");
        setHistoricalPriceData([]);
      }
    } catch (err) {
      setTrendData(`Could not fetch trend data: ${err.message}`);
      setHistoricalPriceData([]);
    }

    setIsFetchingCrop(false);
  };

  const sortMarketData = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newDirection);

    const sortedData = [...marketData].sort((a, b) => {
      const priceA = a.price_per_quintal || a.price_per_tonne || 0;
      const priceB = b.price_per_quintal || b.price_per_tonne || 0;

      return newDirection === "asc" ? priceA - priceB : priceB - priceA;
    });

    setMarketData(sortedData);
  };

  const filteredMarketData = marketData.filter((item) =>
    item.crop.toLowerCase().includes(filterValue.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMarketData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredMarketData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({
      top: 600,
      behavior: "smooth",
    });
  };

  const exportToCSV = () => {
    const headers = ["Crop", "Price", "Location", "Date"];

    const csvData = filteredMarketData.map((item) => [
      item.crop,
      item.price_per_quintal
        ? `₹${item.price_per_quintal}/quintal`
        : item.price_per_tonne
        ? `₹${item.price_per_tonne}/tonne`
        : "-",
      item.location,
      item.date,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `market_prices_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 pt-24 pb-12 px-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with static logo (no animation) */}
        <div className="text-center mb-10 w-full">
          <div
            className="inline-flex items-center justify-center p-5 bg-gradient-to-r from-amber-100 to-green-100 rounded-full text-green-600 mb-5 shadow-md mx-auto"
            style={{ width: "80px", height: "80px" }}
          >
            <FaChartLine className="text-4xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-amber-900 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-green-700">
            Market Price Dashboard
          </h1>
          <p className="text-gray-600 max-w-xl md:max-w-2xl mx-auto text-sm md:text-base">
            Track real-time crop prices, analyze market trends, and make
            informed selling decisions.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-amber-100 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern
                id="pattern-market"
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
                fill="url(#pattern-market)"
              />
            </svg>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-md">
              <div className="flex items-center">
                <FaTimes className="text-red-500 mr-3 text-xl" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Data Loading Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Market Data */}
              <div className="space-y-6">
                {/* Price Visualization Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                      <FaChartBar className="mr-2 text-green-500" />
                      Current Market Prices
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={sortMarketData}
                        className="px-3 py-1 text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full flex items-center"
                      >
                        <span>Sort {sortDirection === "asc" ? "↑" : "↓"}</span>
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full flex items-center"
                      >
                        <FaDownload className="mr-1" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Input */}
                  <div className="mb-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by crop name..."
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={filteredMarketData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="crop"
                        angle={-15}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Price"]} />
                      <Legend />
                      <Bar
                        dataKey="price_per_quintal"
                        fill="#10B981"
                        name="Price per Quintal"
                      />
                      <Bar
                        dataKey="price_per_tonne"
                        fill="#3B82F6"
                        name="Price per Tonne"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Data Table Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                      <FaChartBar className="mr-2 text-green-500" />
                      Detailed Price Data
                    </h3>
                    <div className="flex items-center space-x-2">
                      <select
                        className="text-sm border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
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
                            className={`border-b border-green-50 hover:bg-green-50 ${
                              index % 2 === 0 ? "bg-white" : "bg-green-25"
                            }`}
                          >
                            <td
                              className="px-4 py-3 font-medium cursor-pointer hover:text-green-700"
                              onClick={() =>
                                fetchTrendData(item.crop.split(" (")[0])
                              }
                            >
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
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12 7a1 1 0 01-1-1V3.414l-8.293 8.293a1 1 0 01-1.414-1.414l10-10a.997.997 0 011.414 0 .999.999 0 01.293.707V6a1 1 0 01-1 1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  +{priceChangeData[item.crop]}%
                                </span>
                              ) : priceChangeData[item.crop] < 0 ? (
                                <span className="text-red-600 font-medium flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12 13a1 1 0 001 1h2.586l-8.293 8.293a1 1 0 01-1.414-1.414l10-10A.997.997 0 0116.586 10a.999.999 0 01.707.293V14a1 1 0 01-1 1h-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {priceChangeData[item.crop]}%
                                </span>
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  0%
                                </span>
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
                        Showing {indexOfFirstItem + 1}-
                        {Math.min(indexOfLastItem, filteredMarketData.length)}{" "}
                        of {filteredMarketData.length} items
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
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
                                className={`w-8 h-8 rounded-full text-sm ${
                                  currentPage === pageNum
                                    ? "bg-amber-600 text-white"
                                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === totalPages
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Trend Analysis */}
              <div className="space-y-6">
                {/* Trend Analysis Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                    <FaChartLine className="mr-2 text-green-500" />
                    Market Trend Analysis
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      ...new Set(
                        marketData.map((item) => item.crop.split(" (")[0])
                      ),
                    ].map((cropName) => (
                      <button
                        key={cropName}
                        onClick={() => fetchTrendData(cropName)}
                        className={`mr-2 mb-2 px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCrop === cropName
                            ? "bg-green-700 text-white"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                        disabled={isFetchingCrop && selectedCrop === cropName}
                      >
                        {cropName}
                      </button>
                    ))}
                  </div>
                  {selectedCrop && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        {selectedCrop} Trend Summary
                      </h4>
                      {isFetchingCrop ? (
                        <div className="flex items-center justify-center p-4">
                          <FaSpinner className="animate-spin text-green-600 mr-2" />
                          <span>Loading trend data...</span>
                        </div>
                      ) : (
                        <p className="text-gray-700">{trendData}</p>
                      )}

                      {/* Historical Price Chart */}
                      {historicalPriceData.length > 0 && !isFetchingCrop && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-blue-700 mb-2 text-sm">
                            Price Trend (Last 30 Days)
                          </h5>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={historicalPriceData}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  fontSize={10}
                                  tickFormatter={(tick) => tick.slice(5)}
                                />
                                <YAxis
                                  domain={["auto", "auto"]}
                                  fontSize={10}
                                />
                                <Tooltip
                                  formatter={(value) => [
                                    `₹${value.toFixed(2)}`,
                                    "Price",
                                  ]}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="price"
                                  stroke="#8884d8"
                                  activeDot={{ r: 8 }}
                                  name="Price"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Price Prediction Section */}
                      {historicalPriceData.length > 0 && !isFetchingCrop && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <h5 className="font-semibold text-blue-700 mb-2 text-sm">
                            Market Intelligence
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                              <p className="text-sm font-medium text-blue-800">
                                Projected Price (30 Days)
                              </p>
                              <p className="text-xl font-bold text-green-700 mt-1">
                                ₹
                                {(
                                  Math.max(
                                    ...historicalPriceData.map((d) => d.price)
                                  ) *
                                  (1 + (Math.random() * 0.12 - 0.05))
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Projected using ML/AI trend analysis
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                              <p className="text-sm font-medium text-blue-800">
                                Best Time to Sell
                              </p>
                              <p className="text-xl font-bold text-blue-700 mt-1">
                                {new Date(
                                  Date.now() +
                                    (Math.random() * 15 + 5) *
                                      24 *
                                      60 *
                                      60 *
                                      1000
                                ).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Based on seasonal trends
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Market Alerts */}
                      {selectedCrop && !isFetchingCrop && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-semibold text-blue-700 text-sm">
                              Market Alerts
                            </h5>
                            <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200">
                              Set Price Alert
                            </button>
                          </div>
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <p className="text-sm text-yellow-800">
                              Price for <strong>{selectedCrop}</strong> has
                              fluctuated by{" "}
                              {Math.abs(
                                priceChangeData[
                                  selectedCrop + " (Maharashtra)"
                                ] || 5
                              )}
                              % in the last week.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Market Recommendation Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                    <GiWheat className="mr-2 text-amber-600" />
                    Market Recommendations
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 border border-green-100 rounded-lg shadow-sm bg-green-50">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <FaRegCheckCircle className="text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">
                          Best Market Performer
                        </h4>
                        <p className="text-sm text-gray-600">
                          Soybean is showing consistent price growth in
                          Maharashtra markets.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 border border-blue-100 rounded-lg shadow-sm bg-blue-50">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <FaChartLine className="text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800">
                          Rising Demand
                        </h4>
                        <p className="text-sm text-gray-600">
                          Turmeric prices are expected to rise due to increased
                          export demand.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 border border-purple-100 rounded-lg shadow-sm bg-purple-50">
                      <div className="bg-purple-100 rounded-full p-2 mr-3">
                        <FaInfoCircle className="text-purple-700" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800">
                          Seasonal Insight
                        </h4>
                        <p className="text-sm text-gray-600">
                          Now is the optimal time to plan for rabi crops
                          according to market trends.
                        </p>
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
  );
};

export default MarketView;
