// Simple Development/Production Flag Configuration
// Change IS_PRODUCTION to true for production, false for development

export const IS_PRODUCTION = false; // <-- SWITCH THIS FLAG

// API URLs based on flag
export const API_URL = IS_PRODUCTION
  ? 'https://belles-rental.onrender.com/api'
  : 'http://localhost:5000/api';

// Environment info
console.log('Environment:', IS_PRODUCTION ? 'production' : 'development');

export const ENVIRONMENT = IS_PRODUCTION ? 'production' : 'development';
