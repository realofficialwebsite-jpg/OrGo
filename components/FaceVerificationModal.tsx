import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera as CameraIcon, ShieldCheck, Search } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
// IMPORT CAPACITOR FOR TROJAN HORSE
import { Camera } from '@capacitor/camera';

interface FaceVerificationModalProps {
  workerId: string;
  referencePhotoUrl: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({ 
  workerId, 
  onSuccess, 
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const startVideo = async () => {
    try {
      setErrorMessage('');
      
      // 1. THE TROJAN HORSE: Force native Android to allow camera access first
      await Camera.requestPermissions();

      // 2. Start the web video stream for the canvas
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
      setErrorMessage('Camera access denied or unavailable. Please check App Permissions.');
    }
  };

  const handleContinueToCamera = () => {
    setStep(2);
    startVideo();
  };

  const handleCaptureAndSubmit = async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) {
      setErrorMessage("Camera still loading. Please wait.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);

      await updateDoc(doc(db, 'users', workerId), {
        dailyVerificationImage: capturedBase64,
        dailySecurityStatus: 'pending'
      });

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      setStep(3);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Could not submit photo.");
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

      {step === 1 && (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8">
            <ShieldCheck size={48} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            Take a photo of yourself to confirm it's your account.
          </h2>
          <p className="text-sm text-gray-500 mb-12 leading-relaxed">
            We regularly ask you to verify your identity to help secure your account and protect our community. By taking a photo, you agree to submit a live photo to our admin team for verification.
          </p>
          <button
            onClick={handleContinueToCamera}
            className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg active:scale-95 transition-all"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center w-full h-full">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black text-slate-900 mt-10 text-center">Daily Security Check</h2>
            <p className="text-sm text-gray-500 text-center mt-2 mx-6">
              Fit your face inside the guide and ensure good lighting.
            </p>
          </div>

          <div className="w-64 h-64 mx-auto my-10 rounded-full overflow-hidden border-[6px] border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative bg-gray-50">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl text-sm font-medium mx-6 mb-4 text-center w-full max-w-sm">
              {errorMessage}
            </div>
          )}

          <div className="mt-auto mb-10 w-full max-w-sm">
            <button
              onClick={handleCaptureAndSubmit}
              disabled={isProcessing}
              className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isProcessing ? 'Processing...' : 'Capture & Submit'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative">
            <Search size={40} className="text-gray-400" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            Stand by while we check your photo.
          </h2>
          <p className="text-sm text-gray-500 mb-12 leading-relaxed">
            This usually takes a few minutes. Thanks for helping keep your account secure.
          </p>
          <button
            onClick={() => {
              onClose();
            }}
            className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg active:scale-95 transition-all"
          >
            Got it
          </button>
        </div>
      )}
    </motion.div>
  );
};
