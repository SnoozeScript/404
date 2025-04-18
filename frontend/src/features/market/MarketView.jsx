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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Market Prices</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <table className="min-w-full table-auto mb-6">
            <thead>
              <tr className="bg-green-100">
                <th className="px-4 py-2">Crop</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-2">{item.crop}</td>
                  <td className="px-4 py-2">
                    {item.price_per_quintal
                      ? `₹${item.price_per_quintal}/quintal`
                      : item.price_per_tonne
                      ? `₹${item.price_per_tonne}/tonne`
                      : "-"}
                  </td>
                  <td className="px-4 py-2">{item.location}</td>
                  <td className="px-4 py-2">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold mb-2">AI Market Summary</h3>
            <div className="text-gray-700 whitespace-pre-line">{summary}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketView;
