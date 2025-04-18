import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000"; // Adjust if your backend runs elsewhere

const MarketView = () => {
  const [marketData, setMarketData] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pricesRes = await fetch(`${API_BASE}/prices`);
        const pricesJson = await pricesRes.json();
        setMarketData(pricesJson.market_data || []);
        const summaryRes = await fetch(`${API_BASE}/summary`);
        const summaryJson = await summaryRes.json();
        setSummary(summaryJson.summary || "");
        setError("");
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError("Failed to load market data.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

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
