import React, { useState, useEffect, useCallback } from "react";
import { detectDiseaseApi } from "../../services/api";
import {
  FaUpload,
  FaCamera,
  FaLeaf,
  FaSpinner,
  FaTimes,
  FaSearchPlus,
  FaRegCheckCircle,
} from "react-icons/fa";
import { MdOutlineHealthAndSafety } from "react-icons/md";

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

function DiseaseDetector() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0); // 0: none, 1: processing, 2: analyzing, 3: complete
  const [progressPercent, setProgressPercent] = useState(0);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Show upload success message
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

  // Handle file input changes
  const handleFileChange = (event) => {
    setAnalysisResult("");
    setError("");
    setFile(null);
    setAnalysisStage(0);

    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError(
          "Invalid file type. Please upload an image (JPEG, PNG, GIF, etc.)."
        );
        event.target.value = "";
        return;
      }

      const maxSizeMB = 5;
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        event.target.value = "";
        return;
      }

      setFile(selectedFile);
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

    setAnalysisResult("");
    setError("");
    setFile(null);
    setAnalysisStage(0);

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        setError(
          "Invalid file type. Please upload an image (JPEG, PNG, GIF, etc.)."
        );
        return;
      }

      const maxSizeMB = 5;
      if (droppedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      setFile(droppedFile);

      // Reset file input
      const fileInput = document.getElementById("disease-image-upload");
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  // Handle the "Analyze" button click with animation stages
  const handleAnalyzeClick = useCallback(async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setAnalysisResult("");
    setError("");

    // Animation stages
    setAnalysisStage(1); // Processing

    setTimeout(() => {
      setAnalysisStage(2); // Analyzing
    }, 1500);

    try {
      const result = await detectDiseaseApi(file);
      const cleanedAnalysis = result.analysis.replaceAll("*", "");

      // Delay for animation effect
      setTimeout(() => {
        setProgressPercent(100);
        setTimeout(() => {
          setAnalysisResult(cleanedAnalysis);
          setAnalysisStage(3); // Complete
          setIsLoading(false);
        }, 500);
      }, 1500);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message || "An unknown error occurred during analysis.");
      setAnalysisResult("");
      setIsLoading(false);
      setAnalysisStage(0);
    }
  }, [file]);

  // Handle clearing the selection
  const handleClear = () => {
    setFile(null);
    setPreviewUrl("");
    setAnalysisResult("");
    setError("");
    setAnalysisStage(0);

    // Reset the file input
    const fileInput = document.getElementById("disease-image-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-24 pb-12 flex flex-col items-center justify-center">
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full opacity-10 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-300 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/3 right-10 w-24 h-24 bg-teal-200 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Subtle leaf accents - professionally positioned */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top right leaf */}
          <div
            className="absolute text-green-400"
            style={{
              right: "10%",
              top: "15%",
              opacity: 0.15,
              transform: "rotate(45deg) scale(2.5)",
            }}
          >
            <FaLeaf className="text-4xl" />
          </div>

          {/* Bottom left leaf */}
          <div
            className="absolute text-green-400"
            style={{
              left: "8%",
              bottom: "20%",
              opacity: 0.12,
              transform: "rotate(-65deg) scale(2)",
            }}
          >
            <FaLeaf className="text-4xl" />
          </div>

          {/* Middle right leaf */}
          <div
            className="absolute text-green-400"
            style={{
              right: "15%",
              top: "50%",
              opacity: 0.1,
              transform: "rotate(120deg) scale(3)",
            }}
          >
            <FaLeaf className="text-4xl" />
          </div>

          {/* Top left small leaf */}
          <div
            className="absolute text-green-400"
            style={{
              left: "20%",
              top: "10%",
              opacity: 0.08,
              transform: "rotate(20deg) scale(1.5)",
            }}
          >
            <FaLeaf className="text-4xl" />
          </div>

          {/* Bottom right small leaf */}
          <div
            className="absolute text-green-400"
            style={{
              right: "25%",
              bottom: "12%",
              opacity: 0.07,
              transform: "rotate(-20deg) scale(1.7)",
            }}
          >
            <FaLeaf className="text-4xl" />
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center mb-10 w-full relative z-10">
        <div className="inline-flex p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full text-green-800 mb-5 shadow-md">
          <MdOutlineHealthAndSafety className="text-4xl" />
        </div>
        <h2 className="text-3xl font-extrabold mb-3 text-green-900 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-700">
          Crop Disease Detector
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload an image of your plant, and our AI will analyze it for diseases
          and provide treatment recommendations.
        </p>
      </div>

      {/* Main Content Area */}
      {!analysisResult || isLoading ? (
        // Initial State - Centered Upload Box
        <div className="w-full max-w-xl relative z-10 transition-all duration-500">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100 transform transition-all duration-300 hover:shadow-xl relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <pattern
                  id="pattern"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="10" cy="10" r="2" fill="#22c55e" />
                </pattern>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#pattern)"
                />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-center mb-6 text-green-800 flex items-center justify-center">
              <FaCamera className="mr-2" />
              Upload Plant Image
            </h3>

            {/* Upload Area with dashed border */}
            <div
              className={`relative mb-6 p-8 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out
${
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
                  <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 transform transition-all duration-300 hover:scale-110 shadow-md">
                    <FaUpload className="text-3xl text-green-600" />
                  </div>
                  <span className="text-lg font-medium text-gray-700 mb-3">
                    Upload your plant image
                  </span>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg shadow-sm">
                      <FaUpload className="mr-2 text-green-500" />
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
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleClear}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-300 flex items-center shadow-sm hover:shadow transform hover:-translate-y-0.5"
                    >
                      <FaTimes className="mr-2" />
                      Clear
                    </button>
                    <button
                      onClick={handleAnalyzeClick}
                      disabled={isLoading || !file}
                      className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center shadow-sm hover:shadow transform hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          {analysisStage === 1 && "Processing..."}
                          {analysisStage === 2 && "Analyzing..."}
                        </>
                      ) : (
                        <>
                          <FaLeaf className="mr-2" />
                          Analyze Image
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Success Animation */}
              {uploadSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 animate-fade-in">
                  <div className="text-green-500 text-center transform scale-110 animate-pulse">
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

            {/* Enhanced Analysis Progress Indicator */}
            {isLoading && (
              <FadeInSection delay={100}>
                <div className="my-5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          analysisStage >= 1 ? "bg-green-500" : "bg-gray-300"
                        } ${analysisStage === 1 ? "animate-pulse" : ""}`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          analysisStage === 1
                            ? "text-green-700"
                            : analysisStage > 1
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Processing
                      </span>
                    </div>
                    <div className="h-0.5 flex-grow mx-2 bg-gray-100">
                      <div
                        className={`h-full ${
                          analysisStage >= 2 ? "bg-green-500" : "bg-gray-200"
                        }`}
                        style={{
                          width: analysisStage >= 1 ? "100%" : "0%",
                          transition: "width 1s ease-in-out",
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          analysisStage >= 2 ? "bg-green-500" : "bg-gray-300"
                        } ${analysisStage === 2 ? "animate-pulse" : ""}`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          analysisStage === 2
                            ? "text-green-700"
                            : analysisStage > 2
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Analyzing
                      </span>
                    </div>
                    <div className="h-0.5 flex-grow mx-2 bg-gray-100">
                      <div
                        className={`h-full ${
                          analysisStage >= 3 ? "bg-green-500" : "bg-gray-200"
                        }`}
                        style={{
                          width: analysisStage >= 2 ? "100%" : "0%",
                          transition: "width 1s ease-in-out",
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          analysisStage >= 3 ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          analysisStage === 3
                            ? "text-green-700"
                            : "text-gray-400"
                        }`}
                      >
                        Complete
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-green-100">
                      <div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-in-out rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      >
                        {progressPercent > 15 && (
                          <span className="text-xs px-2">
                            {progressPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-green-600">
                        {analysisStage === 1 &&
                          "Preprocessing image for analysis..."}
                        {analysisStage === 2 &&
                          "Identifying plant features and possible diseases..."}
                      </span>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            )}
          </div>
        </div>
      ) : (
        // Results State - Two column layout
        <div className="w-full flex flex-col md:flex-row relative z-10 transition-all duration-500">
          {/* Upload Container - Left side (1/4 width) */}
          <div className="w-full md:w-1/4 bg-white rounded-xl shadow-lg p-6 border border-green-100 md:rounded-r-none md:border-r-0">
            <h3 className="text-lg font-semibold text-center mb-4 text-green-800 flex items-center justify-center">
              <FaCamera className="mr-2" />
              Upload Plant Image
            </h3>

            {/* Upload Area with dashed border - compact */}
            <div
              className={`relative mb-4 p-4 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out
${
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
              />

              {!previewUrl ? (
                <label
                  htmlFor="disease-image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-3"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-3 transform transition-transform duration-300 hover:scale-110 shadow-sm">
                    <FaUpload className="text-xl text-green-600" />
                  </div>
                  <span className="text-md font-medium text-gray-700 mb-1">
                    Upload new image
                  </span>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <span>Drag & drop or click</span>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Selected plant preview"
                    className="max-h-36 object-contain mx-auto rounded-lg border border-gray-200 shadow-sm"
                  />
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      onClick={handleClear}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition duration-300 flex items-center shadow-sm hover:shadow"
                    >
                      <FaTimes className="mr-1" />
                      Clear
                    </button>
                    <button
                      onClick={handleAnalyzeClick}
                      className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition duration-300 flex items-center shadow-sm hover:shadow"
                    >
                      <FaLeaf className="mr-1" />
                      Analyze
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Success Animation */}
              {uploadSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 animate-fade-in">
                  <div className="text-green-500 text-center">
                    <FaRegCheckCircle className="text-4xl mx-auto mb-1" />
                    <p className="font-medium text-sm">Image uploaded!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Container - Right side (3/4 width) */}
          <div className="w-full md:w-3/4 bg-white rounded-xl shadow-lg p-6 border border-green-100 md:rounded-l-none md:border-l-0">
            <FadeInSection delay={300}>
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-md transition-all duration-500 animate-fade-in h-full">
                <div className="flex items-center mb-5">
                  <div className="p-3 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full mr-4 shadow-sm">
                    <FaLeaf className="text-xl text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">
                      Analysis Complete
                    </h3>
                    <p className="text-sm text-gray-600">
                      Our AI has analyzed your plant image
                    </p>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-green-300 mb-6">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed bg-white p-5 rounded-lg shadow-sm">
                    {analysisResult}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleClear}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow flex items-center transform hover:-translate-y-0.5"
                  >
                    <FaCamera className="mr-2" />
                    Analyze Another Image
                  </button>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="w-full mt-6 max-w-xl mx-auto">
          <FadeInSection delay={100}>
            <div
              className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md"
              role="alert"
            >
              <div className="flex">
                <div className="py-1">
                  <svg
                    className="w-6 h-6 mr-4 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      )}

      {/* Additional animations and styling */}
      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(10px) rotate(-5deg);
          }
        }
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }

        @keyframes sway {
          0%,
          100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        .animate-sway {
          animation: sway 8s ease-in-out infinite;
          transform-origin: bottom center;
        }
      `}</style>
    </div>
  );
}

export default DiseaseDetector;