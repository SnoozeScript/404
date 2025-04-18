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

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Show upload success animation
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);

      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl("");
  }, [file]);

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
    }, 1000);

    try {
      const result = await detectDiseaseApi(file);
      const cleanedAnalysis = result.analysis.replaceAll("*", "");

      // Delay for animation effect
      setTimeout(() => {
        setAnalysisResult(cleanedAnalysis);
        setAnalysisStage(3); // Complete
        setIsLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pt-24 pb-12 px-4 flex items-center justify-center">
      <FadeInSection>
        <div className="container mx-auto p-6 bg-white rounded-xl shadow-lg max-w-4xl border border-green-100 transform transition-all duration-300 hover:shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-green-100 rounded-full text-green-800 mb-4">
              <MdOutlineHealthAndSafety className="text-4xl" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-green-900">
              Crop Disease Detector
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload an image of your plant, and our AI will analyze it for
              diseases and provide treatment recommendations.
            </p>
          </div>

          {/* Upload Area with Drop Zone */}
          <div
            className={`mb-8 p-8 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out relative
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

            {!previewUrl && (
              <label
                htmlFor="disease-image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 transform transition-transform duration-300 hover:scale-110">
                  <FaUpload className="text-3xl text-green-600" />
                </div>
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your plant image here
                </span>
                <span className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </span>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition duration-300">
                  Select Image
                </button>
              </label>
            )}

            {/* Success Animation */}
            {uploadSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 animate-fade-in">
                <div className="text-green-500 text-center">
                  <FaRegCheckCircle className="text-5xl mx-auto mb-2" />
                  <p className="font-medium">Image uploaded successfully!</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview and Actions Section */}
          {previewUrl && (
            <FadeInSection delay={200}>
              <div className="mb-8 text-center">
                <h3 className="text-xl font-medium text-gray-700 mb-4">
                  <FaCamera className="inline mr-2" />
                  Image Preview
                </h3>
                <div className="relative inline-block group">
                  <img
                    src={previewUrl}
                    alt="Selected plant preview"
                    className="max-w-xs md:max-w-sm max-h-64 object-contain mx-auto border border-gray-300 rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <FaSearchPlus className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-300 flex items-center font-medium shadow-sm hover:shadow"
                  >
                    <FaTimes className="mr-2" />
                    Clear
                  </button>
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading || !file}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 flex items-center shadow-sm hover:shadow transform hover:-translate-y-0.5"
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
            </FadeInSection>
          )}

          {/* Analysis Progress Indicator */}
          {isLoading && (
            <FadeInSection delay={100}>
              <div className="my-8">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                        {analysisStage === 1
                          ? "Processing Image"
                          : "Analyzing Plant Health"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {analysisStage === 1 ? "45%" : "75%"}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                    <div
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-1000 ease-in-out"
                      style={{ width: analysisStage === 1 ? "45%" : "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          )}

          {/* Error Display */}
          {error && (
            <FadeInSection delay={100}>
              <div
                className="my-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-center"
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
          )}

          {/* Analysis Result Display with animations */}
          {analysisResult && !isLoading && (
            <FadeInSection delay={300}>
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg shadow-md transition-all duration-500 animate-fade-in">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-200 rounded-full mr-3">
                    <FaLeaf className="text-xl text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800">
                    Analysis Complete
                  </h3>
                </div>

                <div className="pl-4 border-l-2 border-green-300">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed bg-white p-4 rounded-md shadow-sm">
                    {analysisResult}
                  </pre>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition duration-300"
                  >
                    Analyze Another Image
                  </button>
                </div>
              </div>
            </FadeInSection>
          )}
        </div>
      </FadeInSection>

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
      `}</style>
    </div>
  );
}

export default DiseaseDetector;
