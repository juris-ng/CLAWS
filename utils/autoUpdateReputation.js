import { RatingService } from './ratingService';

export const autoUpdateReputation = async (memberId) => {
  // Update reputation in background without blocking UI
  setTimeout(() => {
    RatingService.updateReputation(memberId).catch(error => {
      console.error('Background reputation update failed:', error);
    });
  }, 1000);
};

// Call this after:
// - Creating a petition
// - Receiving votes on petitions
// - Making comments
// - Getting petition approved
