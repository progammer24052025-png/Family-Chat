import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Register for push notifications (Capacitor native)
 * Call this after user logs in successfully
 */
export async function registerForPushNotifications() {
  // Only register on native platforms (iOS/Android)
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return;
  }

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  // Register with Apple / Google to receive push via FCM/APNs
  await PushNotifications.register();

  // On success, we should receive a token
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
    // TODO: Send this token to your backend to store it
    // For now, we'll just log it
  });

  // Registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error: ' + JSON.stringify(error));
  });

  // Handle notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received in foreground: ' + JSON.stringify(notification));
    // Don't store notification, just log it
  });

  // Handle notification tap - redirect user to appropriate screen
  PushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
    console.log('Push notification action performed: ' + JSON.stringify(notificationAction));
    
    const data = notificationAction.notification.data;
    const actionId = notificationAction.actionId;
    
    // Handle different notification types
    if (data && data.type) {
      switch (data.type) {
        case 'message':
          // Redirect to the specific chat
          if (data.chatId) {
            console.log('Navigate to chat:', data.chatId);
            // TODO: Use your router to navigate
            // Example: window.location.href = `/chat/${data.chatId}`;
          }
          break;
          
        case 'friend_request':
          // Handle friend request actions
          if (actionId === 'accept') {
            console.log('Accept friend request from:', data.fromUserId);
            // TODO: Call API to accept friend request
          } else if (actionId === 'reject') {
            console.log('Reject friend request from:', data.fromUserId);
            // TODO: Call API to reject friend request
          } else {
            // Default: navigate to friends page
            console.log('Navigate to friends page');
          }
          break;
          
        default:
          console.log('Unknown notification type:', data.type);
      }
    }
  });
}

/**
 * Unregister from push notifications (on logout)
 */
export async function unregisterFromPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  
  await PushNotifications.removeAllListeners();
  console.log('Unregistered from push notifications');
}
