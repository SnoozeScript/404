import React, { useState, useEffect, useCallback } from "react";
import { detectDiseaseApi } from "../../services/api";
import {
  FaUpload,
  FaCamera,
  FaLeaf,
  FaSpinner,
  FaTimes,
  FaRegCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { GiWheat } from "react-icons/gi";
import { motion } from "framer-motion";

// Fade in component for animation
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

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) {
        observer.disconnect();
      }
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

function DiseaseDetector() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Clean up preview URL
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl("");
  }, [file]);

  // Progress animation effect
  useEffect(() => {
    let interval;
    if (isLoading) {
      if (analysisStage === 1) {
        setProgressPercent(0);
        interval = setInterval(() => {
          setProgressPercent((prev) => Math.min(prev + 1, 45));
        }, 30);
      } else if (analysisStage === 2) {
        interval = setInterval(() => {
          setProgressPercent((prev) => Math.min(prev + 1, 90));
        }, 40);
      }
    } else {
      setProgressPercent(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, analysisStage]);

  // Handle file input changes
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Invalid file type. Please upload an image.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }
      setFile(selectedFile);
      setAnalysisResult("");
      setError("");
      setAnalysisStage(0);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange({ target: { files: [droppedFile] } });
  };

  // Handle analysis
  const handleAnalyzeClick = useCallback(async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setAnalysisResult("");
    setError("");
    setAnalysisStage(1);

    try {
      const result = await detectDiseaseApi(file);
      setTimeout(() => setAnalysisStage(2), 1500);

      setTimeout(() => {
        setProgressPercent(100);
        setAnalysisResult(result.analysis.replaceAll("*", ""));
        setAnalysisStage(3);
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred during analysis.");
      setIsLoading(false);
      setAnalysisStage(0);
    }
  }, [file]);

  // Handle clear
  const handleClear = () => {
    setFile(null);
    setPreviewUrl("");
    setAnalysisResult("");
    setError("");
    setAnalysisStage(0);
    const fileInput = document.getElementById("disease-image-upload");
    if (fileInput) fileInput.value = "";
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
        {/* Header with symmetric icon */}
        <FadeInSection delay={100}>
          <div className="text-center mb-10 w-full">
            <motion.div
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
              className="inline-flex items-center justify-center p-5 bg-gradient-to-r from-amber-100 to-green-100 rounded-full text-green-600 mb-5 shadow-md mx-auto"
              style={{ width: "80px", height: "80px" }}
            >
              <MdOutlineHealthAndSafety className="text-4xl" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-amber-900 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-green-700">
              Crop Disease Detector
            </h1>
            <p className="text-gray-600 max-w-xl md:max-w-2xl mx-auto text-sm md:text-base">
              Upload an image of your plant to detect diseases and get treatment
              recommendations.
            </p>
          </div>
        </FadeInSection>

        {/* Main Content */}
        <FadeInSection delay={200}>
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-amber-100 transition-all duration-300 hover:shadow-xl relative overflow-hidden"
          >
            {/* Subtle background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <pattern
                  id="pattern-disease"
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
                  fill="url(#pattern-disease)"
                />
              </svg>
            </div>

            {!analysisResult ? (
              <div className="space-y-6">
                {/* Upload Section */}
                <div
                  className={`p-8 border-2 border-dashed rounded-lg text-center transition-all duration-300 ${
                    isDragging
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="disease-image-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />

                  {!previewUrl ? (
                    <label
                      htmlFor="disease-image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-8"
                    >
                      <div className="w-24 h-24 bg-gradient-to-r from-amber-100 to-green-100 rounded-full flex items-center justify-center mb-6 shadow-md">
                        <FaUpload className="text-3xl text-amber-600" />
                      </div>
                      <span className="text-lg font-medium text-gray-700 mb-3">
                        Upload your plant image
                      </span>
                      <div className="flex items-center justify-center gap-3 text-sm">
                        <div className="flex items-center bg-amber-50 px-3 py-2 rounded-lg shadow-sm">
                          <FaUpload className="mr-2 text-amber-500" />
                          <span className="text-gray-600">Drag & drop</span>
                        </div>
                        <span className="text-gray-400">or</span>
                        <div className="flex items-center bg-green-100 px-3 py-2 rounded-lg shadow-sm">
                          <FaCamera className="mr-2 text-green-600" />
                          <span className="text-green-700 font-medium">
                            Browse files
                          </span>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="relative py-4">
                      <div className="relative group mb-6">
                        <img
                          src={previewUrl}
                          alt="Selected plant preview"
                          className="max-h-56 object-contain mx-auto rounded-lg border border-gray-200 shadow-sm"
                        />
                      </div>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={handleClear}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-300 flex items-center shadow-sm"
                        >
                          <FaTimes className="mr-2" />
                          Clear
                        </button>
                        <button
                          onClick={handleAnalyzeClick}
                          disabled={isLoading || !file}
                          className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center shadow-sm"
                        >
                          {isLoading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              {analysisStage === 1 && "Processing..."}
                              {analysisStage === 2 && "Analyzing..."}
                            </>
                          ) : (
                            <>
                              <MdOutlineHealthAndSafety className="mr-2" />
                              Analyze Image
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                      <div className="text-green-500 text-center transform scale-110">
                        <div className="bg-green-100 rounded-full p-4 inline-block mb-3">
                          <FaRegCheckCircle className="text-5xl" />
                        </div>
                        <p className="font-medium text-green-800">
                          Image uploaded successfully!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {isLoading && (
                  <div className="my-5">
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-green-100">
                        <div
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 ease-in-out rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-medium text-amber-600">
                          {analysisStage === 1 && "Preprocessing image..."}
                          {analysisStage === 2 && "Analyzing plant health..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Image Preview */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaCamera className="mr-2 text-amber-500" />
                      Plant Image
                    </h3>
                    <img
                      src={previewUrl}
                      alt="Analyzed plant"
                      className="w-full rounded-lg border border-amber-100"
                    />
                    <button
                      onClick={handleClear}
                      className="w-full mt-4 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                    >
                      Analyze Another
                    </button>
                  </div>
                </div>

                {/* Right Column - Results */}
                <div className="lg:col-span-2">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <MdOutlineHealthAndSafety className="mr-2 text-green-500" />
                      Analysis Results
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {analysisResult}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-md">
                  <div className="flex items-center">
                    <FaTimes className="text-red-500 mr-3 text-xl" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </FadeInSection>
      </div>
    </div>
  );
}

export default DiseaseDetector;
