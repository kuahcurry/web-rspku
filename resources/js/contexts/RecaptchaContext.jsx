import React, { createContext, useContext } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const RecaptchaContext = createContext();

export const useRecaptcha = () => {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha must be used within RecaptchaProvider');
  }
  return context;
};

export const RecaptchaProvider = ({ children }) => {
  // IMPORTANT: Replace this with your actual reCAPTCHA site key from Google
  // Get your keys from: https://www.google.com/recaptcha/admin
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key for development
  
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <RecaptchaContext.Provider value={{}}>
        {children}
      </RecaptchaContext.Provider>
    </GoogleReCaptchaProvider>
  );
};

export default RecaptchaProvider;
