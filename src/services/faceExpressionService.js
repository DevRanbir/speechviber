import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';

let faceDetectionNet;
let faceExpressionNet;

// Initialize face detection and expression recognition models
async function loadModels() {
  try {
    // Load face detection model
    faceDetectionNet = await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    // Load face expression recognition model
    faceExpressionNet = await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    return true;
  } catch (error) {
    console.error('Error loading face detection models:', error);
    return false;
  }
}

// Analyze facial expressions from video stream
async function analyzeFacialExpressions(videoElement) {
  if (!faceDetectionNet || !faceExpressionNet) {
    await loadModels();
  }

  try {
    // Detect faces and expressions
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections && detections.length > 0) {
      // Get the dominant expression
      const expressions = detections[0].expressions;
      const dominantExpression = Object.entries(expressions).reduce((a, b) => 
        a[1] > b[1] ? a : b
      );

      return {
        expressions: expressions,
        dominant: {
          expression: dominantExpression[0],
          confidence: dominantExpression[1]
        },
        allDetections: detections
      };
    }

    return null;
  } catch (error) {
    console.error('Error analyzing facial expressions:', error);
    return null;
  }
}

// Start continuous facial expression analysis
function startContinuousAnalysis(videoElement, onResult) {
  let isAnalyzing = true;

  const analyze = async () => {
    if (!isAnalyzing) return;

    const result = await analyzeFacialExpressions(videoElement);
    if (result) {
      onResult(result);
    }

    // Continue analysis in next frame
    requestAnimationFrame(analyze);
  };

  analyze();

  return () => {
    isAnalyzing = false;
  };
}

export {
  loadModels,
  analyzeFacialExpressions,
  startContinuousAnalysis
};