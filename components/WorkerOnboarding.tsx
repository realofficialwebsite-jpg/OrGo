import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { orgoServices } from '../src/servicesData';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface OnboardingState {
  fullName: string;
  mobileNumber: string;
  age: string;
  email: string;
  profilePhotoBase64: string;
  servicesOffered: string[];
  yearsOfExperience: string;
  degrees: string;
  aadhaarNumber: string;
  panNumber: string;
  permanentAddress: string;
  emergencyContact: string;
  bankAccount: string;
  ifscCode: string;
  languages: string[];
  backgroundConsent: boolean;
  faceScanBase64: string;
}

const INITIAL_STATE: OnboardingState = {
  fullName: '',
  mobileNumber: '',
  age: '',
  email: '',
  profilePhotoBase64: '',
  servicesOffered: [],
  yearsOfExperience: '',
  degrees: '',
  aadhaarNumber: '',
  panNumber: '',
  permanentAddress: '',
  emergencyContact: '',
  bankAccount: '',
  ifscCode: '',
  languages: [],
  backgroundConsent: false,
  faceScanBase64: '',
};

const LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali'];

export const WorkerOnboarding: React.FC<{ onComplete: () => void, onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appStatus, setAppStatus] = useState<string | null>(localStorage.getItem('worker_application_status'));
  const [isApproved, setIsApproved] = useState(false);

  // Listen for approval status in real-time
  useEffect(() => {
    if (appStatus !== 'pending' || !auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'approved' && data.role === 'professional') {
          localStorage.removeItem('worker_application_status');
          setIsApproved(true);
          // Small delay for the success animation if we had one, but here we just complete
          setTimeout(() => {
            onComplete();
          }, 1500);
        }
      }
    });

    return () => unsubscribe();
  }, [appStatus, auth.currentUser, onComplete]);

  // Service Selection State
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Camera & Mediapipe State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActiveState] = useState(false);
  const cameraActiveRef = useRef(false);
  const setCameraActive = (active: boolean) => {
    cameraActiveRef.current = active;
    setCameraActiveState(active);
  };

  const [livenessInstruction, setLivenessInstruction] = useState('Loading Face Scanner...');
  const [livenessStage, setLivenessStageState] = useState<'loading' | 'position' | 'blink' | 'turn' | 'success' | 'failed'>('loading');
  const livenessStageRef = useRef<'loading' | 'position' | 'blink' | 'turn' | 'success' | 'failed'>('loading');
  const instructionStepRef = useRef<'face-detect' | 'blink' | 'turn-left' | 'turn-right' | 'look-down' | 'look-up' | 'success'>('face-detect');
  const isTransitioningRef = useRef(false);
  
  const setLivenessStage = (stage: 'loading' | 'position' | 'blink' | 'turn' | 'success' | 'failed') => {
    livenessStageRef.current = stage;
    setLivenessStageState(stage);
    
    // Sync instructionStepRef with stage
    if (stage === 'position') instructionStepRef.current = 'face-detect';
    if (stage === 'success') instructionStepRef.current = 'success';
  };

  const moveToNextStep = (nextStep: typeof instructionStepRef.current, instruction: string) => {
    isTransitioningRef.current = true;
    setLivenessInstruction(instruction);
    setTimeout(() => {
      instructionStepRef.current = nextStep;
      isTransitioningRef.current = false;
    }, 1000);
  };

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  
  // Tracking variables for liveness
  const blinkCountRef = useRef(0);
  const isEyeClosedRef = useRef(false);
  const requiredTurnsRef = useRef(new Set(['left', 'right', 'up', 'down']));

  useEffect(() => {
    if (appStatus === 'pending') return;
    if (step !== 5) return;
    if (faceLandmarkerRef.current) return;

    const initMediapipe = async () => {
      setIsAILoading(true);
      console.log("Starting MediaPipe initialization...");
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        console.log("FilesetResolver loaded.");
        
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "CPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        faceLandmarkerRef.current = landmarker;
        setIsAILoading(false);
        console.clear();
        console.log("MediaPipe FaceLandmarker initialized successfully.");
        
        if (step === 5 && !formData.faceScanBase64 && livenessStageRef.current !== 'success') {
          startCamera();
        }
      } catch (err: any) {
        console.error("MediaPipe Initialization Error:", err);
        setError("Camera AI failed to load. Please check permissions.");
        setLivenessStage('failed');
        setIsAILoading(false);
      }
    };
    initMediapipe();
  }, [appStatus, step]);

  useEffect(() => {
    if (step === 5 && !formData.faceScanBase64 && livenessStage !== 'success') {
      if (faceLandmarkerRef.current && !isAILoading) {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, formData.faceScanBase64, isAILoading]);

  const startCamera = async () => {
    setError('');
    setLivenessStage('position');
    setLivenessInstruction('Place head inside the circle');
    blinkCountRef.current = 0;
    isEyeClosedRef.current = false;
    requiredTurnsRef.current = new Set(['left', 'right', 'up', 'down']);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        // If video is already ready, start the loop immediately
        if (videoRef.current.readyState >= 2) {
          predictWebcam();
        }
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err instanceof Error ? err.message : String(err));
      setError(err.message || "Camera access denied.");
      setLivenessStage('failed');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  };

  const calculateEAR = (landmarks: any[], indices: number[]) => {
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];

    const dist = (pA: any, pB: any) => Math.hypot(pA.x - pB.x, pA.y - pB.y);

    const v1 = dist(p2, p6);
    const v2 = dist(p3, p5);
    const h = dist(p1, p4);

    return (v1 + v2) / (2.0 * h);
  };

  const predictWebcam = () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !cameraActiveRef.current) {
      if (cameraActiveRef.current) {
        console.log("Predict loop waiting for dependencies...", { 
          hasVideo: !!videoRef.current, 
          hasLandmarker: !!faceLandmarkerRef.current 
        });
        requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return;
    }

    const video = videoRef.current;
    
    // Ensure video has dimensions and is playing
    if (video.readyState < 2 || video.videoWidth === 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    // Debounce/Transition Lock
    if (isTransitioningRef.current) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    let startTimeMs = performance.now();
    
    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;
      
      try {
        const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Stage 1: Face Detection
          if (instructionStepRef.current === 'face-detect') {
            console.log("Face detected! Landmarks count:", landmarks.length);
            moveToNextStep('blink', 'Please Blink');
          }
        
        // Stage 2: Blink Detection
        else if (instructionStepRef.current === 'blink') {
          const leftEyeIndices = [33, 160, 158, 133, 153, 144];
          const rightEyeIndices = [362, 385, 387, 263, 373, 380];
          
          const leftEAR = calculateEAR(landmarks, leftEyeIndices);
          const rightEAR = calculateEAR(landmarks, rightEyeIndices);
          const avgEAR = (leftEAR + rightEAR) / 2.0;

          if (avgEAR < 0.2) {
            isEyeClosedRef.current = true;
          } else if (avgEAR > 0.25 && isEyeClosedRef.current) {
            isEyeClosedRef.current = false;
            moveToNextStep('turn-left', 'Turn Head Left');
          }
        }

        // Stage 3: Turn Left
        else if (instructionStepRef.current === 'turn-left') {
          const noseTip = landmarks[1];
          const leftTragion = landmarks[234];
          const rightTragion = landmarks[454];
          const faceWidth = Math.abs(rightTragion.x - leftTragion.x);
          const noseToRight = Math.abs(noseTip.x - rightTragion.x);
          
          if (noseToRight / faceWidth < 0.3) {
            moveToNextStep('turn-right', 'Turn Head Right');
          }
        }

        // Stage 4: Turn Right
        else if (instructionStepRef.current === 'turn-right') {
          const noseTip = landmarks[1];
          const leftTragion = landmarks[234];
          const rightTragion = landmarks[454];
          const faceWidth = Math.abs(rightTragion.x - leftTragion.x);
          const noseToLeft = Math.abs(noseTip.x - leftTragion.x);
          
          if (noseToLeft / faceWidth < 0.3) {
            moveToNextStep('look-down', 'Look Down');
          }
        }

        // Stage 5: Look Down
        else if (instructionStepRef.current === 'look-down') {
          const noseTip = landmarks[1];
          const chin = landmarks[152];
          const forehead = landmarks[10];
          const faceHeight = Math.abs(chin.y - forehead.y);
          const noseToChin = Math.abs(noseTip.y - chin.y);
          
          if (noseToChin / faceHeight < 0.35) {
            moveToNextStep('look-up', 'Look Up');
          }
        }

        // Stage 6: Look Up
        else if (instructionStepRef.current === 'look-up') {
          const noseTip = landmarks[1];
          const chin = landmarks[152];
          const forehead = landmarks[10];
          const faceHeight = Math.abs(chin.y - forehead.y);
          const noseToForehead = Math.abs(noseTip.y - forehead.y);
          
          if (noseToForehead / faceHeight < 0.35) {
            instructionStepRef.current = 'success';
            captureFrame();
          }
        }
      } else {
        if (livenessStageRef.current !== 'loading' && livenessStageRef.current !== 'failed' && livenessStageRef.current !== 'success') {
          setLivenessInstruction('Face not detected. Place head inside the circle.');
        }
      }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }

    if (livenessStageRef.current !== 'success' && livenessStageRef.current !== 'failed') {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        updateForm('faceScanBase64', base64);
        setLivenessStage('success');
        setLivenessInstruction('Verification Successful');
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    updateForm('faceScanBase64', '');
    setLivenessStage('position');
    startCamera();
  };

  const updateForm = (field: keyof OnboardingState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof OnboardingState) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateForm(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSubService = (subServiceTitle: string) => {
    setFormData(prev => {
      const current = prev.servicesOffered;
      if (current.includes(subServiceTitle)) {
        return { ...prev, servicesOffered: current.filter(s => s !== subServiceTitle) };
      } else {
        return { ...prev, servicesOffered: [...current, subServiceTitle] };
      }
    });
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    setError('');

    try {
      const user = auth.currentUser;
      
      await addDoc(collection(db, 'pendingWorkers'), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        skills: formData.servicesOffered.length > 0 ? formData.servicesOffered : ['Pending'],
        phone: formData.mobileNumber,
        age: formData.age,
        experience: formData.yearsOfExperience,
      });

      localStorage.setItem('worker_application_status', 'pending');
      setAppStatus('pending');
    } catch (err: any) {
      console.error("Error submitting application:", err instanceof Error ? err.message : String(err));
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancel = () => {
    localStorage.removeItem('worker_application_status');
    setAppStatus(null);
    setStep(1);
    setFormData(INITIAL_STATE);
    setSelectedMainCategory(null);
    setSelectedSubCategory(null);
    setShowCancelConfirm(false);
  };

  if (appStatus === 'pending') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          {isApproved ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-emerald-500 rounded-full p-4"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
          ) : (
            <CheckCircle className="w-10 h-10 text-gray-900" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isApproved ? 'Application Approved!' : 'Review in Progress'}
        </h1>
        <p className="text-gray-500 text-center mb-8 max-w-sm">
          {isApproved 
            ? 'Welcome to the OrGo team! Redirecting you to your dashboard...' 
            : 'Your application has been submitted and is currently under review by our team. We will notify you once approved.'}
        </p>
        {!isApproved && (
          <div className="w-full max-w-xs space-y-4">
            <button 
              onClick={onComplete}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </button>
            <a 
              href="mailto:queries.girish@gmail.com"
              className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              Contact Support
            </a>
            <button 
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel Application
            </button>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {showCancelConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Application?</h3>
                <p className="text-gray-500 mb-8">Are you sure you want to cancel? All your progress and data will be permanently lost.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmCancel}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
                  >
                    Yes, Cancel
                  </button>
                  <button 
                    onClick={() => setShowCancelConfirm(false)}
                    className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    No, Keep it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white pb-4 pt-4 px-4 flex items-center justify-between border-b border-gray-100">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <span className="text-sm font-bold text-gray-400 tracking-widest">{step}/5</span>
        </div>

        {/* Main Content Area */}
        <div className="pt-4 pb-32 px-4">
          <div className="max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              {/* STEP 1: Basics */}
              {step === 1 && (
                <div className="space-y-8 mt-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Personal Details</h2>
                    <p className="text-gray-500">Let's start with the basics.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => updateForm('fullName', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Mobile Number</label>
                      <input 
                        type="tel" 
                        value={formData.mobileNumber}
                        onChange={(e) => updateForm('mobileNumber', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Age</label>
                      <input 
                        type="number" 
                        value={formData.age}
                        onChange={(e) => updateForm('age', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Profile */}
              {step === 2 && (
                <div className="space-y-8 mt-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Professional Profile</h2>
                    <p className="text-gray-500">Tell us about your expertise.</p>
                  </div>

                  <div className="space-y-8">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-4">Profile Photo</label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                          {formData.profilePhotoBase64 ? (
                            <img src={formData.profilePhotoBase64} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="text-gray-400" size={32} />
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, 'profilePhotoBase64')}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-2">Upload a clear photo of your face.</p>
                          <label className="inline-block px-4 py-2 bg-gray-100 text-gray-900 rounded-xl text-sm font-bold cursor-pointer hover:bg-gray-200 transition-colors">
                            Choose Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(e, 'profilePhotoBase64')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Modern Service Selection */}
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-900">Services Offered</label>
                        <p className="text-xs text-gray-500 font-medium">(You can select multiple services)</p>
                      </div>
                      
                      {!selectedMainCategory ? (
                        <div className="grid grid-cols-2 gap-4">
                          {orgoServices.map(category => {
                            const isCategoryActive = formData.servicesOffered.some(s => 
                              category.subCategories?.some(sub => 
                                typeof sub === 'string' ? sub === s : (sub.title === s || sub.items?.some(i => i.title === s))
                              )
                            );
                            return (
                              <div 
                                key={category.id}
                                onClick={() => setSelectedMainCategory(category.id)}
                                className={`relative aspect-square rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                                  isCategoryActive ? 'ring-4 ring-gray-900 ring-offset-2 scale-[0.98]' : 'hover:scale-[1.02]'
                                }`}
                              >
                                <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-white font-bold text-lg">{category.name}</span>
                                    {isCategoryActive && (
                                      <div className="bg-white rounded-full p-1">
                                        <CheckCircle size={16} className="text-gray-900" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <button 
                            onClick={() => {
                              if (selectedSubCategory) setSelectedSubCategory(null);
                              else setSelectedMainCategory(null);
                            }}
                            className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-900"
                          >
                            <ChevronLeft size={16} /> {selectedSubCategory ? 'Back to Sub-categories' : 'Back to Categories'}
                          </button>
                          
                          <div className="flex flex-wrap gap-3">
                            {(() => {
                              const mainCat = orgoServices.find(c => c.id === selectedMainCategory);
                              if (!mainCat) return null;

                              if (!selectedSubCategory) {
                                return mainCat.subCategories?.map(sub => {
                                  const subTitle = typeof sub === 'string' ? sub : sub.title;
                                  const hasItems = typeof sub !== 'string' && sub.items && sub.items.length > 0;
                                  const isSelected = formData.servicesOffered.includes(subTitle) || 
                                    (hasItems && sub.items!.some(i => formData.servicesOffered.includes(i.title)));

                                  return (
                                    <button
                                      key={typeof sub === 'string' ? sub : sub.id}
                                      onClick={() => {
                                        if (hasItems) {
                                          setSelectedSubCategory(sub.id);
                                        } else {
                                          toggleSubService(subTitle);
                                        }
                                      }}
                                      className={`px-5 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                                        isSelected 
                                          ? 'bg-gray-900 text-white shadow-md' 
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      {subTitle}
                                      {hasItems && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">More</span>}
                                    </button>
                                  );
                                });
                              } else {
                                const subCat = mainCat.subCategories?.find(s => typeof s !== 'string' && s.id === selectedSubCategory);
                                if (typeof subCat === 'string' || !subCat) return null;

                                return subCat.items?.map(item => {
                                  const isSelected = formData.servicesOffered.includes(item.title);
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => toggleSubService(item.title)}
                                      className={`px-5 py-3 rounded-full text-sm font-bold transition-all ${
                                        isSelected 
                                          ? 'bg-gray-900 text-white shadow-md' 
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      {item.title}
                                    </button>
                                  );
                                });
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Years of Experience</label>
                      <input 
                        type="number" 
                        value={formData.yearsOfExperience}
                        onChange={(e) => updateForm('yearsOfExperience', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: KYC */}
              {step === 3 && (
                <div className="space-y-8 mt-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">KYC Details</h2>
                    <p className="text-gray-500">For background verification.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Aadhaar Number</label>
                      <input 
                        type="text" 
                        value={formData.aadhaarNumber}
                        onChange={(e) => updateForm('aadhaarNumber', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">PAN Card Number</label>
                      <input 
                        type="text" 
                        value={formData.panNumber}
                        onChange={(e) => updateForm('panNumber', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Permanent Address</label>
                      <textarea 
                        value={formData.permanentAddress}
                        onChange={(e) => updateForm('permanentAddress', e.target.value)}
                        rows={3}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Safety & Payouts */}
              {step === 4 && (
                <div className="space-y-8 mt-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Safety & Payouts</h2>
                    <p className="text-gray-500">Where should we send your earnings?</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Emergency Contact</label>
                      <input 
                        type="tel" 
                        value={formData.emergencyContact}
                        onChange={(e) => updateForm('emergencyContact', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Bank Account Number</label>
                      <input 
                        type="text" 
                        value={formData.bankAccount}
                        onChange={(e) => updateForm('bankAccount', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">IFSC Code</label>
                      <input 
                        type="text" 
                        value={formData.ifscCode}
                        onChange={(e) => updateForm('ifscCode', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 font-medium uppercase"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-4">Spoken Languages</label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => {
                          const isSelected = formData.languages.includes(lang);
                          return (
                            <button
                              key={lang}
                              onClick={() => {
                                const current = formData.languages;
                                if (current.includes(lang)) {
                                  updateForm('languages', current.filter(l => l !== lang));
                                } else {
                                  updateForm('languages', [...current, lang]);
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                isSelected 
                                  ? 'bg-gray-900 text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.backgroundConsent}
                        onChange={(e) => updateForm('backgroundConsent', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        I consent to a background check and verify that all provided information is accurate.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: Biometric Liveness Check */}
              {step === 5 && (
                <div className="space-y-8 mt-4 flex flex-col items-center">
                  <div className="text-center w-full">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Identity Verification</h2>
                    <p className="text-gray-500">Let's verify it's really you.</p>
                  </div>

                  <div className="w-full flex flex-col items-center justify-center py-8">
                    {livenessStage !== 'success' ? (
                      <>
                        <div className="relative w-64 h-64 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-inner mb-8">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            width={480}
                            height={480}
                            onLoadedData={predictWebcam}
                            className="w-full h-full object-cover transform -scale-x-100"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Loading Overlay */}
                          {isAILoading && (
                            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
                              <p className="text-sm font-bold text-gray-900 px-4 text-center">Loading AI Security Models...</p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2 mb-6 font-medium">Ensure your face is well-lit</p>
                        
                        <div className="h-16 flex flex-col items-center justify-center text-center">
                          {livenessStage === 'failed' || error ? (
                            <>
                              <p className="text-red-500 font-bold mb-4">{error || 'Verification Failed'}</p>
                              <div className="flex gap-4">
                                <button 
                                  onClick={handleRetake}
                                  className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
                                >
                                  Retake Video
                                </button>
                                <label className="px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-bold cursor-pointer hover:bg-gray-200 transition-colors">
                                  Upload Photo
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      handleFileUpload(e, 'faceScanBase64');
                                      setLivenessStage('success');
                                    }} 
                                  />
                                </label>
                              </div>
                            </>
                          ) : (
                            <motion.p 
                              key={livenessInstruction}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xl font-bold text-gray-900"
                            >
                              {livenessInstruction}
                            </motion.p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-64 h-64 rounded-full overflow-hidden mb-8 border-4 border-gray-900 relative">
                          <img src={formData.faceScanBase64} alt="Face Scan" className="w-full h-full object-cover transform -scale-x-100" />
                          <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2 shadow-lg">
                              <CheckCircle size={32} className="text-gray-900" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful</h3>
                        <p className="text-gray-500 mb-8">Your identity has been verified.</p>
                        <button 
                          onClick={handleRetake}
                          className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Bottom Action Bar Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto flex gap-4">
          {step < 5 ? (
            <button 
              onClick={handleNext}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
            >
              Continue
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.faceScanBase64}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
