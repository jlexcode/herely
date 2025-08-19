// autoLogout.js - Automatic logout after inactivity

class AutoLogoutManager {
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.timeoutMinutes = options.timeoutMinutes || 30; // Default 30 minutes
    this.warningMinutes = options.warningMinutes || 5; // Show warning 5 minutes before logout
    this.timeoutId = null;
    this.warningId = null;
    this.warningShown = false;
    
    this.init();
  }

  init() {
    // Reset timer on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });

    // Start the timer
    this.resetTimer();
  }

  resetTimer() {
    // Clear existing timers
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    // Reset warning flag
    this.warningShown = false;

    // Set warning timer
    const warningTime = (this.timeoutMinutes - this.warningMinutes) * 60 * 1000;
    this.warningId = setTimeout(() => {
      this.showWarning();
    }, warningTime);

    // Set logout timer
    const logoutTime = this.timeoutMinutes * 60 * 1000;
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, logoutTime);
  }

  showWarning() {
    if (this.warningShown) return;
    this.warningShown = true;

    // Show warning notification
    if (window.notifications) {
      window.notifications.warning(
        `You will be logged out in ${this.warningMinutes} minutes due to inactivity. Click anywhere to stay logged in.`,
        10000
      );
    } else {
      alert(`You will be logged out in ${this.warningMinutes} minutes due to inactivity. Click anywhere to stay logged in.`);
    }
  }

  async logout() {
    try {
      // Sign out from Supabase
      await this.supabase.auth.signOut();
      
      // Show logout notification
      if (window.notifications) {
        window.notifications.info("You have been logged out due to inactivity.", 5000);
      }
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
      
    } catch (error) {
      console.error('Error during auto logout:', error);
      // Force redirect even if logout fails
      window.location.href = '/login.html';
    }
  }

  // Manual method to stop auto logout (useful for admin pages or when user explicitly wants to stay logged in)
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }
  }

  // Manual method to restart auto logout
  start() {
    this.resetTimer();
  }
}

// Create global instance
let autoLogoutManager = null;

// Initialize auto logout
export function initAutoLogout(supabase, options = {}) {
  if (autoLogoutManager) {
    autoLogoutManager.stop();
  }
  
  autoLogoutManager = new AutoLogoutManager(supabase, options);
  return autoLogoutManager;
}

// Export the class for direct use
export default AutoLogoutManager;
