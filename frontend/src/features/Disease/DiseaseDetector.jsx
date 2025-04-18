import React, { useState, useEffect, useCallback } from 'react';
import { detectDiseaseApi } from '../../services/api'; // Adjust path if needed
// Optional: Import a loading spinner component if you have one
// import LoadingSpinner from '../../components/LoadingSpinner';

function DiseaseDetector() {
  const [file, setFile] = useState(null); // Stores the actual File object
  const [previewUrl, setPreviewUrl] = useState(''); // For displaying image preview
  const [analysisResult, setAnalysisResult] = useState(''); // Stores backend response text
  const [error, setError] = useState(''); // Stores error messages
  const [isLoading, setIsLoading] = useState(false); // For loading state

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    // If a file is selected, create a preview URL
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Cleanup function to revoke the object URL
      return () => URL.revokeObjectURL(objectUrl);
    }
    // If file is null (cleared), clear the preview
    setPreviewUrl('');
  }, [file]); // Re-run only when file changes

  // Handle file input changes
  const handleFileChange = (event) => {
    // Reset state on new file selection
    setAnalysisResult('');
    setError('');
    setFile(null); // Clear previous file first

    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      // Basic validation (can add size validation too)
      if (!selectedFile.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, etc.).');
        event.target.value = ''; // Clear the input
        return;
      }
      // Optional: Size validation (e.g., max 5MB)
      const maxSizeMB = 5;
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
         setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
         event.target.value = ''; // Clear the input
         return;
      }

      setFile(selectedFile);
    }
  };

  // Handle the "Analyze" button click
  const handleAnalyzeClick = useCallback(async () => { // Use useCallback if passing this down
    if (!file) {
      setError('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setAnalysisResult('');
    setError('');

    try {
      const result = await detectDiseaseApi(file); // Call the API service
      setAnalysisResult(result.analysis); // Assuming result = { analysis: "..." }
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message || 'An unknown error occurred during analysis.');
      setAnalysisResult(''); // Clear any previous results on error
    } finally {
      setIsLoading(false);
    }
  }, [file]); // Dependency: re-create function if 'file' changes

  // Handle clearing the selection
  const handleClear = () => {
    setFile(null);
    setPreviewUrl('');
    setAnalysisResult('');
    setError('');
    // Reset the file input visually
    const fileInput = document.getElementById('disease-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md max-w-3xl border border-gray-200">
      <h2 className="text-2xl md:text-3xl font-semibold mb-5 text-center text-green-800">
        Crop Disease Detector
      </h2>

      {/* File Input Section */}
      <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg text-center">
        <label
          htmlFor="disease-image-upload"
          className="block mb-2 text-lg font-medium text-gray-700 cursor-pointer"
        >
          Upload Plant Image
        </label>
        <input
          type="file"
          id="disease-image-upload"
          accept="image/*" // Accept all image types
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200 cursor-pointer"
          disabled={isLoading}
        />
         <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WEBP etc. Max 5MB.</p>
      </div>

      {/* Preview and Actions Section */}
      {previewUrl && (
        <div className="mb-6 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Image Preview:</h3>
          <img
            src={previewUrl}
            alt="Selected plant preview"
            className="max-w-xs md:max-w-sm max-h-64 object-contain mx-auto border border-gray-300 rounded shadow"
          />
           <button
              onClick={handleClear}
              disabled={isLoading}
              className="mt-4 mr-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition duration-150 ease-in-out text-sm"
            >
              Clear Selection
            </button>
          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading || !file}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
         <div className="text-center my-4">
           {/* Optional: Replace with a spinner component */}
           <p className="text-lg text-blue-600 animate-pulse">Loading analysis...</p>
         </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Analysis Result Display */}
      {analysisResult && !isLoading && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Analysis Result:</h3>
          {/* Use pre-wrap to respect newlines and wrap long lines */}
          <pre className="whitespace-pre-wrap text-gray-700 text-sm md:text-base font-sans leading-relaxed">
            {analysisResult}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DiseaseDetector;