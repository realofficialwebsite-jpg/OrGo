import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera as CameraIcon, CheckCircle, ShieldCheck } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { orgoServices } from '../src/servicesData';

// IMPORT THE OFFICIAL CAPACITOR PLUGIN
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

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

  // Service Selection State
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Native Camera Capture for Step 5
  const handleNativeCameraCapture = async () => {
    setError('');
    try {
      await Camera.requestPermissions();
      
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Front // Force selfie camera
      });

      if (image.base64String) {
        const capturedBase64 = `data:image/jpeg;base64,${image.base64String}`;
        updateForm('faceScanBase64', capturedBase64);
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      if (err.message !== 'User cancelled photos app') {
        setError(err.message || 'Failed to open native camera.');
      }
    }
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
      
      await setDoc(doc(db, 'users', user.uid), {
        faceScanBase64: formData.faceScanBase64,
        photo: formData.faceScanBase64,
        name: formData.fullName,
        email: formData.email,
        skills: formData.servicesOffered.length > 0 ? formData.servicesOffered : ['Pending'],
        phone: formData.mobileNumber,
        age: formData.age,
        experience: formData.yearsOfExperience,
      }, { merge: true });

      await setDoc(doc(db, 'pendingWorkers', user.uid), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        submittedAt: serverTimestamp(),
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
          <CheckCircle className="w-10 h-10 text-gray-900" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review in Progress</h1>
        <p className="text-gray-500 text-center mb-8 max-w-sm">
          Your application has been submitted and is currently under review by our team. We will notify you once approved.
        </p>
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
                            <CameraIcon className="text-gray-400" size={32} />
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

              {/* STEP 5: Identity Photo */}
              {step === 5 && (
                <div className="space-y-8 mt-4 flex flex-col items-center">
                  <div className="text-center w-full">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Identity Photo</h2>
                    <p className="text-gray-500">Take a clear photo of your face.</p>
                  </div>

                  <div className="w-full flex flex-col items-center justify-center py-8">
                    {!formData.faceScanBase64 ? (
                      <>
                        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8">
                          <ShieldCheck size={64} className="text-blue-600" />
                        </div>
                        
                        {error && (
                          <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl text-sm font-medium mb-6 w-full text-center">
                            {error}
                          </div>
                        )}
                        
                        <button 
                          onClick={handleNativeCameraCapture}
                          className="w-full max-w-xs py-4 bg-black text-white font-bold rounded-xl text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <CameraIcon size={20} />
                          Open Camera
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-64 h-64 rounded-full overflow-hidden mb-8 border-4 border-gray-900 relative">
                          <img src={formData.faceScanBase64} alt="Face Scan" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2 shadow-lg">
                              <CheckCircle size={32} className="text-gray-900" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Photo Captured</h3>
                        <p className="text-gray-500 mb-8">You are ready to submit your application.</p>
                        <button 
                          onClick={handleNativeCameraCapture}
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
