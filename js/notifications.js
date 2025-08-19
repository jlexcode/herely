// notifications.js - Reusable notification system

import { escapeHtml } from './utils.js';

class NotificationManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} transform transition-all duration-300 translate-x-full opacity-0`;
    
    // Set up notification content
    const icon = this.getIcon(type);
    const bgColor = this.getBgColor(type);
    const textColor = this.getTextColor(type);
    
    notification.innerHTML = `
      <div class="flex items-start p-4 rounded-lg shadow-lg ${bgColor} ${textColor} border-l-4 ${this.getBorderColor(type)}">
        <div class="flex-shrink-0 mr-3">
          ${icon}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${escapeHtml(message)}</p>
        </div>
        <button class="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    // Add to container
    this.container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  remove(notification) {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
      error: '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
      warning: '<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };
    return icons[type] || icons.info;
  }

  getBgColor(type) {
    const colors = {
      success: 'bg-green-50',
      error: 'bg-red-50',
      warning: 'bg-yellow-50',
      info: 'bg-blue-50'
    };
    return colors[type] || colors.info;
  }

  getTextColor(type) {
    const colors = {
      success: 'text-green-800',
      error: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    };
    return colors[type] || colors.info;
  }

  getBorderColor(type) {
    const colors = {
      success: 'border-green-400',
      error: 'border-red-400',
      warning: 'border-yellow-400',
      info: 'border-blue-400'
    };
    return colors[type] || colors.info;
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Create global instance
window.notifications = new NotificationManager();

// Export for module usage
export default window.notifications;
