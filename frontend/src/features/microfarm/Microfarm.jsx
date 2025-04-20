import React, { useState } from 'react';

export default function Microfarm() {
  const [formData, setFormData] = useState({
    plot_size: 200,
    budget: 50000,
    state: 'Maharashtra',
    district: 'Kolhapur',
    soil_type: 'loam',
    soil_ph: 6.5,
    water_source: 'well',
    sunlight_hours: 6,
    preferred_crops: '',
    risk_appetite: 5,
    labor_availability: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState(
    "Fill out your farm profile and click 'Get Recommendations' to see which micro-farming systems are best for your plot."
  );

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations([]);

    const payload = {
      ...formData,
      preferred_crops: formData.preferred_crops
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    };

    try {
        const res = await fetch('http://localhost:8000/api/v1/microfarm/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);

      if (data.success && data.recommendations.length > 0) {
        setMessage(data.message || 'Here are your recommendations:');
        setRecommendations(data.recommendations);
      } else {
        setMessage(data.message || 'No suitable systems found for your inputs.');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Failed to fetch recommendations. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-green-700 text-center mb-8">
        Micro Farm Maximizer
      </h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="lg:w-1/3 bg-green-50 p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            Your Farm Profile
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Plot Size */}
            <div>
              <label htmlFor="plot_size" className="block mb-1 font-medium text-gray-700">
                Plot Size (sq ft)
              </label>
              <input
                type="number"
                id="plot_size"
                name="plot_size"
                value={formData.plot_size}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block mb-1 font-medium text-gray-700">
                Budget (₹)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            {/* State */}
            <div>
              <label htmlFor="state" className="block mb-1 font-medium text-gray-700">
                State
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            {/* District */}
            <div>
              <label htmlFor="district" className="block mb-1 font-medium text-gray-700">
                District
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="Kolhapur">Kolhapur</option>
                <option value="Pune">Pune</option>
                <option value="Satara">Satara</option>
                <option value="Sangli">Sangli</option>
              </select>
            </div>
            {/* Soil Type */}
            <div>
              <label htmlFor="soil_type" className="block mb-1 font-medium text-gray-700">
                Soil Type
              </label>
              <select
                id="soil_type"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="loam">Loam</option>
                <option value="sandy loam">Sandy Loam</option>
                <option value="clay loam">Clay Loam</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
              </select>
            </div>
            {/* Soil pH */}
            <div>
              <label htmlFor="soil_ph" className="block mb-1 font-medium text-gray-700">
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
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            {/* Water Source */}
            <div>
              <label htmlFor="water_source" className="block mb-1 font-medium text-gray-700">
                Water Source
              </label>
              <select
                id="water_source"
                name="water_source"
                value={formData.water_source}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="well">Well</option>
                <option value="canal">Canal</option>
                <option value="rainwater">Rainwater</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>
            {/* Sunlight Hours */}
            <div>
              <label htmlFor="sunlight_hours" className="block mb-1 font-medium text-gray-700">
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
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            {/* Preferred Crops */}
            <div>
              <label htmlFor="preferred_crops" className="block mb-1 font-medium text-gray-700">
                Preferred Crops
              </label>
              <input
                type="text"
                id="preferred_crops"
                name="preferred_crops"
                placeholder="Tomatoes, Lettuce, etc."
                value={formData.preferred_crops}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            {/* Risk Appetite */}
            <div>
              <label htmlFor="risk_appetite" className="block mb-1 font-medium text-gray-700">
                Risk Appetite (1-10)
              </label>
              <input
                type="range"
                id="risk_appetite"
                name="risk_appetite"
                min="1"
                max="10"
                value={formData.risk_appetite}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            {/* Labor Availability */}
            <div>
              <label htmlFor="labor_availability" className="block mb-1 font-medium text-gray-700">
                Labor Availability (1-10)
              </label>
              <input
                type="range"
                id="labor_availability"
                name="labor_availability"
                min="1"
                max="10"
                value={formData.labor_availability}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-mediumrounded-2xl py-3 hover:bg-green-700 transition"
            >
              Get Recommendations
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="lg:w-2/3">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            Farm System Recommendations
          </h2>
          {loading && <div className="w-8 h-8 border-4 border-green-200 border-t-green-600rounded-full animate-spin mx-auto my-4"></div>}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {!loading && (
            <div>
              <p className="mb-4">{message}</p>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semiboldtext-green-700">{rec.system}</h3>
                    <span className="px-3 py-1 rounded-full bg-green-100text-green-700 font-medium">
                      {rec.compatibility_score}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600font-medium">Setup Cost:</p>
                      <p>₹{rec.setup_cost_total?.toLocaleString() || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600font-medium">Monthly Cost:</p>
                      <p>₹{rec.monthly_cost?.toLocaleString() || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600font-medium">Expected ROI:</p>
                      <p>{rec.expected_roi_percent?.toLocaleString() || '-'}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600font-medium">Payback Period:</p>
                      <p>{rec.payback_period_months || '-'}months</p>
                    </div>
                    <div>
                      <p className="text-gray-600font-medium">Water Usage:</p>
                      <p>{rec.water_usage_per_day || '-'}L/day</p>
                    </div>
                    <div>
                      <p className="text-gray-600font-medium">Electricity Usage:</p>
                      <p>{rec.electricity_usage_per_day || '-'}kWh/day</p>
                    </div>
                    <div className="sm:col-span-2lg:col-span-1">
                      <p className="text-gray-600font-medium">Suitable Crops:</p>
                      <p>{rec.suitable_crops?.join(', ') || '-'}</p>
                    </div>
                    <div className="col-span-full">
                      <p className="text-gray-600font-medium">Market Prices (NearbyMandis):</p>
                      <ul className="list-disclist-inside">
                        {(rec.market_prices || []).length > 0
                          ? rec.market_prices.map((mp, i) => (
                              <li key={i}>
                                {mp.location}({mp.date}):₹{Number(mp.price_per_quintal).toLocaleString()}
                              </li>
                            ))
                          : <li>-</li>}
                      </ul>
                    </div>
                    <div className="col-span-full">
                      <p className="text-gray-600font-medium">Government Subsidies:</p>
                      <ul className="list-disclist-inside">
                        {(rec.subsidies || []).length > 0
                          ? rec.subsidies.map((s, i) => (
                              <li key={i}>
                                <strong>{s.name}</strong>{s.subsidy_pct ?`(${s.subsidy_pct}\%)` : ''}{s.max_cap ?`, Cap: ₹${Number(s.max_cap).toLocaleString()}` : ''}
                                {s.apply_url &&(
                                  <a href={s.apply_url}target="_blank"rel="noopener noreferrer"className="ml-2text-green-600underline">
                                    Apply
                                  </a>
                                )}
                                {s.eligibility && <p className="mt-1text-smtext-gray-500">{s.eligibility}</p>}
                              </li>
                            ))
                          : <li>-</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Microfarm };
