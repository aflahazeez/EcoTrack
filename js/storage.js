/**
 * EcoTrack – LocalStorage Management Helper
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Centralizes all browser storage read/write operations.
 * Built with defensive resilience:
 * - Handles corrupted/invalid JSON without throwing uncaught exceptions.
 * - Detects if LocalStorage is disabled (e.g. private mode, strict iframe).
 * - Provides an in-memory fallback so the UI never crashes.
 */

const STORAGE_KEYS = {
  FOOTPRINT: 'ecotrack_footprint_data',
  HABITS: 'ecotrack_habits_data',
  PROFILE: 'ecotrack_user_profile',
  HISTORY: 'ecotrack_history_log'
};

// Internal in-memory fallback store if localStorage is blocked or unavailable
const _memoryFallback = {};

/**
 * Verifies whether window.localStorage is supported and accessible
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__ecotrack_storage_probe__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const EcoStorage = {
  /**
   * Status flag indicating if persistent storage is functional
   */
  isAvailable: isStorageAvailable(),

  /**
   * Safely retrieves parsed JSON data from LocalStorage or in-memory fallback
   * @param {string} key - Storage key name
   * @param {any} defaultValue - Fallback value if missing or invalid
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      if (this.isAvailable) {
        const item = window.localStorage.getItem(key);
        if (item === null || item === undefined || item === '') {
          return defaultValue;
        }
        return JSON.parse(item);
      } else {
        // Fallback to in-memory store
        return Object.prototype.hasOwnProperty.call(_memoryFallback, key)
          ? _memoryFallback[key]
          : defaultValue;
      }
    } catch (error) {
      console.warn(`[EcoStorage] Error parsing '${key}', falling back to default:`, error);
      return defaultValue;
    }
  },

  /**
   * Safely serializes and saves value to LocalStorage or in-memory fallback
   * @param {string} key - Storage key name
   * @param {any} value - Value to serialize and store
   * @returns {boolean} True if successfully stored, false otherwise
   */
  set(key, value) {
    try {
      if (this.isAvailable) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } else {
        _memoryFallback[key] = value;
        return true;
      }
    } catch (error) {
      console.warn(`[EcoStorage] Failed to save key '${key}' to localStorage:`, error);
      // Attempt in-memory save as safety net
      _memoryFallback[key] = value;
      return false;
    }
  },

  /**
   * Safely removes a specific key
   * @param {string} key
   */
  remove(key) {
    try {
      if (this.isAvailable) {
        window.localStorage.removeItem(key);
      }
      delete _memoryFallback[key];
    } catch (error) {
      console.warn(`[EcoStorage] Failed to remove key '${key}':`, error);
    }
  },

  /**
   * Clears all EcoTrack-specific keys from storage and memory fallback
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (this.isAvailable) {
          window.localStorage.removeItem(key);
        }
        delete _memoryFallback[key];
      });
      return true;
    } catch (error) {
      console.warn('[EcoStorage] Error during clearAll:', error);
      return false;
    }
  }
};

// Expose on window object for cross-script browser accessibility
if (typeof window !== 'undefined') {
  window.EcoStorage = EcoStorage;
  window.STORAGE_KEYS = STORAGE_KEYS;
}
