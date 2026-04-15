import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { toast } from 'sonner';

interface FaceVerificationModalProps {
  workerId: string;
  referencePhotoUrl: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({ 
  workerId, 
  referencePhotoUrl, 
  onSuccess, 
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'failure'>('idle');

  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        startVideo();
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setErrorMessage('Failed to load security models. Please check your connection.');
      }
    };
    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setErrorMessage('Camera access denied or unavailable.');
    }
  };

  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !isModelLoaded || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage('');
    setVerificationStatus('idle');

    try {
      // 1. Create a canvas and draw the current video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");
      
      // Flip horizontally to match mirror effect
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // 2. Get the captured image as Base64
      const capturedBase64 = canvas.toDataURL('image/jpeg');

      // 3. Compare the captured image against the database reference
      if (!referencePhotoUrl) throw new Error("Reference scan missing from database.");

      // Load reference and captured images
      const referenceImg = await faceapi.fetchImage(referencePhotoUrl);
      const capturedImg = await faceapi.fetchImage(capturedBase64);

      // Detect faces
      const referenceDetection = await faceapi.detectSingleFace(referenceImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      const liveDetection = await faceapi.detectSingleFace(capturedImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!referenceDetection || !liveDetection) {
        throw new Error("Could not detect face. Please ensure your face is clearly visible.");
      }

      // Compare descriptors
      const distance = faceapi.euclideanDistance(referenceDetection.descriptor, liveDetection.descriptor);
      
      if (distance < 0.6) {
        setVerificationStatus('success');
        await updateDoc(doc(db, 'users', workerId), {
          status: 'online',
          isOnline: true,
          lastFaceScanAt: serverTimestamp()
        });
        toast.success('Identity Verified! You are now online.');
        setTimeout(onSuccess, 1500);
      } else {
        throw new Error("Face does not match. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Could not verify identity.");
      setVerificationStatus('failure');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-black text-slate-900 mt-10 text-center">Daily Security Check</h2>
        <p className="text-sm text-gray-500 text-center mt-2 mx-6">
          Please position your face clearly in the circle to go online.
        </p>
      </div>

      {/* Circular Camera Container */}
      <div className="w-64 h-64 mx-auto my-10 rounded-full overflow-hidden border-[6px] border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative bg-gray-50">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        
        {/* Overlay for status */}
        <AnimatePresence>
          {verificationStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-20 backdrop-blur-[2px]"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Check size={32} className="text-white" strokeWidth={4} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scanning State */}
      {isProcessing && (
        <p className="text-gray-500 animate-pulse text-sm font-medium">Analyzing biometrics...</p>
      )}

      <div className="mt-auto mb-10 w-full flex flex-col items-center gap-4">
        {errorMessage && (
          <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl text-sm font-medium mx-6 text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {verificationStatus === 'success' ? (
          <div className="text-center">
            <p className="text-emerald-600 font-bold text-lg">Identity Verified!</p>
            <p className="text-slate-400 text-xs mt-1">Redirecting to dashboard...</p>
          </div>
        ) : (
          <button
            onClick={handleCaptureAndVerify}
            disabled={!isModelLoaded || isProcessing}
            className="bg-red-600 text-white font-bold text-lg w-[calc(100%-3rem)] mx-6 py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera size={20} />
                Capture & Verify
              </>
            )}
          </button>
        )}

        {!isModelLoaded && !errorMessage && (
          <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
            Initializing Security...
          </p>
        )}
      </div>

      {/* Hidden Reference Image */}
      <img 
        id="reference-image" 
        src={referencePhotoUrl} 
        alt="Reference" 
        className="hidden" 
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};
