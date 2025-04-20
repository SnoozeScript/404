"use client"

import { useState } from "react"
import { Leaf, Droplet, Sun, Map, EarthIcon as Soil, Thermometer, Tractor, Coins, BarChart3, Users } from "lucide-react"

export default function Microfarm() {
  const [formData, setFormData] = useState({
    plot_size: 200,
    budget: 50000,
    state: "Maharashtra",
    district: "Kolhapur",
    soil_type: "loam",
    soil_ph: 6.5,
    water_source: "well",
    sunlight_hours: 6,
    preferred_crops: "",
    risk_appetite: 5,
    labor_availability: 5,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [message, setMessage] = useState(
    "Fill out your farm profile and click 'Get Recommendations' to see which micro-farming systems are best for your plot.",
  )

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" || type === "range" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRecommendations([])

    const payload = {
      ...formData,
      preferred_crops: formData.preferred_crops
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/microfarm/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setLoading(false)

      if (data.success && data.recommendations.length > 0) {
        setMessage(data.message || "Here are your recommendations:")
        setRecommendations(data.recommendations)
      } else {
        setMessage(data.message || "No suitable systems found for your inputs.")
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
      setError("Failed to fetch recommendations. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      plot_size: 200,
      budget: 50000,
      state: "Maharashtra",
      district: "Kolhapur",
      soil_type: "loam",
      soil_ph: 6.5,
      water_source: "well",
      sunlight_hours: 6,
      preferred_crops: "",
      risk_appetite: 5,
      labor_availability: 5,
    })
    setRecommendations([])
    setMessage(
      "Fill out your farm profile and click 'Get Recommendations' to see which micro-farming systems are best for your plot.",
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbeb]">
      {/* Navigation Bar */}
      <nav className="bg-green-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tractor className="h-6 w-6" />
            <span className="text-xl font-bold">FarmGenius</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#" className="flex items-center space-x-1 hover:text-green-200">
              <span>Home</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-200">
              <span>Market</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-200">
              <span>Disease Detector</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-200">
              <span>Yield Predictor</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-200">
              <span>AI Chat</span>
            </a>
            <a href="#" className="flex items-center space-x-1 font-medium bg-green-700 px-3 py-1 rounded-md">
              <span>Micro Farm</span>
            </a>
          </div>
          <button className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto pt-12 pb-8 px-4">
        <div className="text-center mb-12">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-amber-800 mb-3">Micro Farm Maximizer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Optimize your small plot with AI-powered farming recommendations and personalized system suggestions.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Soil className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Enter Farm Details</h2>
            </div>
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5"
            >
              Reset Form
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Plot Size */}
            <div className="space-y-2">
              <label htmlFor="plot_size" className="flex items-center text-gray-700 font-medium">
                <Map className="h-4 w-4 mr-2 text-green-600" />
                Plot Size (sq ft)
              </label>
              <input
                type="number"
                id="plot_size"
                name="plot_size"
                value={formData.plot_size}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label htmlFor="budget" className="flex items-center text-gray-700 font-medium">
                <Coins className="h-4 w-4 mr-2 text-green-600" />
                Budget (₹)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <label htmlFor="state" className="flex items-center text-gray-700 font-medium">
                <Map className="h-4 w-4 mr-2 text-green-600" />
                State
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            {/* District */}
            <div className="space-y-2">
              <label htmlFor="district" className="flex items-center text-gray-700 font-medium">
                <Map className="h-4 w-4 mr-2 text-green-600" />
                District
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Kolhapur">Kolhapur</option>
                <option value="Pune">Pune</option>
                <option value="Satara">Satara</option>
                <option value="Sangli">Sangli</option>
              </select>
            </div>

            {/* Soil Type */}
            <div className="space-y-2">
              <label htmlFor="soil_type" className="flex items-center text-gray-700 font-medium">
                <Soil className="h-4 w-4 mr-2 text-green-600" />
                Soil Type
              </label>
              <select
                id="soil_type"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="loam">Loam</option>
                <option value="sandy loam">Sandy Loam</option>
                <option value="clay loam">Clay Loam</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
              </select>
            </div>

            {/* Soil pH */}
            <div className="space-y-2">
              <label htmlFor="soil_ph" className="flex items-center text-gray-700 font-medium">
                <Thermometer className="h-4 w-4 mr-2 text-green-600" />
                Soil pH (if known)
              </label>
              <input
                type="number"
                id="soil_ph"
                name="soil_ph"
                step="0.1"
                min="4"
                max="9"
                value={formData.soil_ph}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Water Source */}
            <div className="space-y-2">
              <label htmlFor="water_source" className="flex items-center text-gray-700 font-medium">
                <Droplet className="h-4 w-4 mr-2 text-green-600" />
                Water Source
              </label>
              <select
                id="water_source"
                name="water_source"
                value={formData.water_source}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="well">Well</option>
                <option value="canal">Canal</option>
                <option value="rainwater">Rainwater</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>

            {/* Sunlight Hours */}
            <div className="space-y-2">
              <label htmlFor="sunlight_hours" className="flex items-center text-gray-700 font-medium">
                <Sun className="h-4 w-4 mr-2 text-green-600" />
                Sunlight Hours (per day)
              </label>
              <input
                type="number"
                id="sunlight_hours"
                name="sunlight_hours"
                min="0"
                max="12"
                value={formData.sunlight_hours}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Preferred Crops */}
            <div className="space-y-2">
              <label htmlFor="preferred_crops" className="flex items-center text-gray-700 font-medium">
                <Leaf className="h-4 w-4 mr-2 text-green-600" />
                Preferred Crops
              </label>
              <input
                type="text"
                id="preferred_crops"
                name="preferred_crops"
                placeholder="Tomatoes, Lettuce, etc."
                value={formData.preferred_crops}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Risk Appetite */}
            <div className="space-y-2">
              <label htmlFor="risk_appetite" className="flex items-center text-gray-700 font-medium">
                <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                Risk Appetite (1-10)
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Low</span>
                <input
                  type="range"
                  id="risk_appetite"
                  name="risk_appetite"
                  min="1"
                  max="10"
                  value={formData.risk_appetite}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <span className="text-sm text-gray-500">High</span>
              </div>
              <div className="text-center text-sm font-medium text-green-600">{formData.risk_appetite}</div>
            </div>

            {/* Labor Availability */}
            <div className="space-y-2">
              <label htmlFor="labor_availability" className="flex items-center text-gray-700 font-medium">
                <Users className="h-4 w-4 mr-2 text-green-600" />
                Labor Availability (1-10)
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Low</span>
                <input
                  type="range"
                  id="labor_availability"
                  name="labor_availability"
                  min="1"
                  max="10"
                  value={formData.labor_availability}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <span className="text-sm text-gray-500">High</span>
              </div>
              <div className="text-center text-sm font-medium text-green-600">{formData.labor_availability}</div>
            </div>

            {/* Submit Button - Full Width on Last Row */}
            <div className="md:col-span-2 lg:col-span-3 mt-4">
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-medium rounded-xl py-3.5 hover:bg-green-700 transition flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Get Recommendations"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Leaf className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Farm System Recommendations</h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && recommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Recommendations Await</h3>
              <p className="text-gray-500 max-w-md mx-auto">{message}</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <p className="mb-6 text-gray-600">{message}</p>
              <div className="grid grid-cols-1 gap-6">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition"
                  >
                    <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-green-800">{rec.system}</h3>
                        <div className="flex items-center">
                          <span className="px-3 py-1 rounded-full bg-green-600 text-white font-medium text-sm">
                            {rec.compatibility_score}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Setup Cost:</p>
                          <p className="text-xl font-semibold text-gray-800">
                            ₹{rec.setup_cost_total?.toLocaleString() || "-"}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Monthly Cost:</p>
                          <p className="text-xl font-semibold text-gray-800">
                            ₹{rec.monthly_cost?.toLocaleString() || "-"}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Expected ROI:</p>
                          <p className="text-xl font-semibold text-gray-800">
                            {rec.expected_roi_percent?.toLocaleString() || "-"}%
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Payback Period:</p>
                          <p className="text-xl font-semibold text-gray-800">
                            {rec.payback_period_months || "-"} months
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Water Usage:</p>
                          <p className="text-xl font-semibold text-gray-800">{rec.water_usage_per_day || "-"} L/day</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-gray-600 font-medium text-sm mb-1">Electricity Usage:</p>
                          <p className="text-xl font-semibold text-gray-800">
                            {rec.electricity_usage_per_day || "-"} kWh/day
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-gray-600 font-medium mb-2">Suitable Crops:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.suitable_crops?.map((crop, i) => (
                            <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {crop}
                            </span>
                          )) || "-"}
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-gray-600 font-medium mb-2">Market Prices (Nearby Mandis):</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {(rec.market_prices || []).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {rec.market_prices.map((mp, i) => (
                                <div key={i} className="flex justify-between border-b border-gray-200 pb-2">
                                  <div>
                                    <span className="font-medium">{mp.location}</span>
                                    <span className="text-gray-500 text-sm ml-2">({mp.date})</span>
                                  </div>
                                  <span className="font-semibold">
                                    ₹{Number(mp.price_per_quintal).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No market price data available</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-gray-600 font-medium mb-2">Government Subsidies:</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {(rec.subsidies || []).length > 0 ? (
                            <div className="space-y-4">
                              {rec.subsidies.map((s, i) => (
                                <div key={i} className="border-l-4 border-green-500 pl-4">
                                  <div className="flex justify-between">
                                    <h4 className="font-semibold">{s.name}</h4>
                                    <div className="flex items-center space-x-2">
                                      {s.subsidy_pct && (
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm">
                                          {s.subsidy_pct}%
                                        </span>
                                      )}
                                      {s.max_cap && (
                                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-sm">
                                          Cap: ₹{Number(s.max_cap).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {s.eligibility && <p className="text-sm text-gray-600 mt-1">{s.eligibility}</p>}
                                  {s.apply_url && (
                                    <a
                                      href={s.apply_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      Apply Online →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No subsidy information available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { Microfarm }
