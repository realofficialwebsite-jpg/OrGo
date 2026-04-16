import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

// IMPORT THE OFFICIAL CAPACITOR PLUGIN
import { Camera as CapCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

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
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCaptureAndSubmit = async () => {
    setErrorMessage('');
    
    try {
      // 1. Force Android to ask for Camera permissions
      await CapCamera.requestPermissions();

      // 2. Open Native Android Front Camera
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Front // Force selfie camera
      });

      if (image.base64String) {
        setIsProcessing(true);
        setStep(2); // Show the processing screen while uploading

        const capturedBase64 = `data:image/jpeg;base64,${image.base64String}`;

        // 3. Update Firestore
        await updateDoc(doc(db, 'users', workerId), {
          dailyVerificationImage: capturedBase64,
          dailySecurityStatus: 'pending'
        });

        // Move to Step 3 (Success Standby)
        setStep(3);
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      // Ignore error if they just hit the "back" button on the camera
      if (err.message !== 'User cancelled photos app') {
        setErrorMessage(err.message || 'Failed to capture or upload photo.');
      }
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
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            We regularly ask you to verify your identity to help secure your account and protect our community. By taking a photo, you agree to submit a live photo to our admin team for verification.
          </p>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl text-sm font-medium mb-6 w-full">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleCaptureAndSubmit}
            className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Open Camera
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-sm text-center">
          <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Uploading Securely</h2>
          <p className="text-sm text-gray-500">Please wait while we encrypt and upload your photo...</p>
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
