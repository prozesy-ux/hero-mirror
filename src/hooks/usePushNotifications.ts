import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Convert URL-safe base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    const supported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window;
    setIsSupported(supported);
    console.log('[Push] Browser support:', supported);
    
    if (supported) {
      setPermission(Notification.permission);
      console.log('[Push] Current permission:', Notification.permission);
    }
  }, []);

  // Check subscription status on mount and auth change
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[Push] No session, skipping subscription check');
          setIsSubscribed(false);
          return;
        }

        console.log('[Push] Checking subscription for user:', session.user.id.slice(0, 8));

        // Check with backend
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ action: 'check-subscription' }),
          }
        );

        const result = await response.json();
        console.log('[Push] Subscription check result:', result);
        setIsSubscribed(result.isSubscribed);

        // Also check if service worker is registered
        const registration = await navigator.serviceWorker.getRegistration();
        console.log('[Push] Service worker registered:', !!registration);
        
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          console.log('[Push] Browser has active subscription:', !!subscription);
        }
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }
    };

    if (isSupported) {
      checkSubscription();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('[Push] Auth state changed:', event);
      if (isSupported) {
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          toast.error('Notification permission denied');
          setIsLoading(false);
          return false;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to enable notifications');
        setIsLoading(false);
        return false;
      }

      // 1. Get VAPID public key from server
      const keyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'get-public-key' }),
        }
      );

      const { publicKey, error: keyError } = await keyResponse.json();
      if (keyError || !publicKey) {
        throw new Error(keyError || 'Failed to get VAPID key');
      }

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // 4. Send subscription to server
      const subscribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'subscribe',
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent,
          }),
        }
      );

      const subscribeResult = await subscribeResponse.json();
      if (subscribeResult.error) {
        throw new Error(subscribeResult.error);
      }

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission]);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    const autoSubscribe = async () => {
      if (!isSupported || isLoading || isSubscribed) return;
      
      // Only auto-subscribe if permission is already granted and user is not subscribed
      if (Notification.permission === 'granted') {
        console.log('[Push] Auto-subscribing - permission already granted');
        await subscribe();
      }
    };

    // Small delay to ensure subscription check completes first
    const timer = setTimeout(autoSubscribe, 1500);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, isLoading, subscribe]);


  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return false;
      }

      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Notify server
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'unsubscribe' }),
        }
      );

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
