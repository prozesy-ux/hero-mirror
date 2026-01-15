// Premium notification sounds (base64 encoded MP3 snippets)
// High-quality sounds similar to Google/Facebook/Apple notifications

// Wallet credited - Success chime (like PayPal/Stripe)
const WALLET_CREDITED_SOUND = 'data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToGAAAIABAAHQAoADEANgA3ADUAMAARAPH/0f+x/5f/hP94/3T/df96/4P/kP+g/7L/xP/W/+f/9v8EABAAGgAhACYAKQAqACkAJgAhABsAFAAMABsANQBQAGsAfwCMAJIAkQCKAH4AbABWAD0AIwAJAPD/2P/B/6z/m/+O/4X/gP9//4L/if+T/6D/r//A/9H/4v/y/wEADgAZACIAKQAtAC8ALgArACcAIQAaABIACgBgALIA/gBBAXgBngG1AbsBsAGWAWwBNAHxAKQATgDz/5T/NP/W/n/+L/7r/bP9kP18/Xb9f/2W/bn97P0o/m/+u/4J/1j/pf/v/zYAdQCrAN0ABAEgATEBOQE3ATABJQEWAQQBxwBlAP3/mf87/+P+k/5M/g/+3/28/ab9n/2l/bn92/0K/kb+jP7b/iz/hP/e/zYAjQDdACsBcAGqAdoB/QEUAiACIQIWAgAC3QGvAXcBMQHaAHgADQCf/zD/w/5Z/vX9mv1L/Qf91fyx/J/8n/yx/NP8B/1K/Zv99/1e/s7+Qv+4/y0AnQAIAW4BywEfAnACsQLjAgQDGQMfAxoDCQPsAsMCjQJNAggCsgFaAf4AjwAaAKP/Kf+t/jT+vf1M/eL8hfwz/PH7v/ud+4z7kvuq+9P7Cfxk/Mz8Qv29/T/+wf5G/8z/UQDTAFEByQE4ApsCcgJNAgkC';

// Message sent - Soft pop (like iMessage/WhatsApp)
const MESSAGE_SENT_SOUND = 'data:audio/wav;base64,UklGRnQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVAFAACAQIA/gECAP4BAgD+AQIA/gECAP4BAgD+AQIA/gECAP4BAgD+AQIA/gECAP4BAgD+AQIA/gECAP8BPgL/AT4D/wQ+Bv8NPg//ET4V/xk+IP8pPjD/NT5A/0E+Tv9WPmL/bD54/4E+jP+VPqD/qT60/7w+xv/NPtb/3D7k/+o+8P/1Pvr//j7//wI/Af8FPwT/Bz8E/wk/Av8KPwD/Cj/8/wk/+P8GP/P/BD/t/wA/6f//P6T//j+f//o/k//1/4y/8b+K/+0/iv/of4r/47+K/98/iv/af4u/1f+Mf9G/jT/Nv43/yj+O/8b/j//EP5D/wb+SP/+/U3/+f1S//f9V//2/V3/+P1k//z9a/8C/nP/Cv57/xP+g/8f/ov/LP6T/zr+nP9K/qX/W/6t/27+tf+C/r7/l/7G/67+zv/F/tb/3v7e//b+5v8P/+3/Kf/0/0L/+/9b/wAAc/8FAIr/CQCg/wwAtf8OAMX/DwDT/w4A3/8LAOn/BgDx////9//4//v/7/8AAOf/AQDc/wEA0P///8T//P+3//n/qv/0/5z/7/+Q/+n/g//j/3f/3f9s/9f/YP/S/1b/zP9N/8f/Rf/B/z//vP86/7j/N/+0/zX/sv81/7D/Nv+v/zj/r/88/7D/Qf+y/0f/tf9P/7n/V/+//2H/xf9r/8z/d//U/4P/3P+R/+T/n//t/67/9f+9//7/zf8GANz/DgDr/xUA+/8bAAkAIAAYACQAJgAnADQAKQBCACkATwAnAFsAJQBnACEAcgAcAHwAFwCFABAAjQAJAJUAAQCcAPj/ogDv/6cA5v+tAN3/sgDU/7cAy/+7AMT/vwC9/8MAt//GALz/yQDC/8sAzP/NANj/zwDm/9AA9P/RAAQB0gAVAdIAJgHRADcB0ABIATAA';

// Message received - Gentle ding (like Messenger/Slack)
const MESSAGE_RECEIVED_SOUND = 'data:audio/wav;base64,UklGRpgGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXQGAAAAAAYADQAUABsAIQAmACsALwAyADQANQA1ADQAMwAxAC4AKwAnACMAHwAbABcAEwAPAAsACAAFAAIAAAD+//z/+//5//n/+P/4//j/+f/5//r/+//8//7/AAACAAQABgAJAAwADwASABQAFwAZABsAHQAfACAAIQAhACEAIQAgAB8AHgAcABsAGAAWABMAEAANAAoABwAEAAIA///9//v/+f/4//b/9f/0//P/8//z//P/9P/0//X/9v/4//n/+/8AAAAAAQAHAAwAEQAXABwAIQAmACoALgAyADUANwA5ADsAPAA8ADwAOwA5ADcANQAyAC4AKgAlACAAGwAVAA8ACgAEAP//+v/1//D/6//n/+T/4P/d/9r/2P/X/9X/1P/U/9T/1P/V/9b/1//Z/9v/3f/g/+P/5v/q/+3/8f/0//j//P8AAAQACAAMEBAYIBwgHCAcIBwgHCAcIBsgGCAQCAD4/+//5//g/9j/0f/J/8L/u/+1/6//qv+k/5//m/+Y/5X/kv+Q/4//jf+N/43/jf+O/4//kf+T/5X/mP+c/6D/pP+p/63/sv+3/7z/wf/H/8z/0v/X/9z/4v/n/+z/8f/2//r//f8AAAMABgAIAAoADAAPABIAFgAaAB4AIQAmACoALgAxADQANwA5ADsAPQA/AEAAQgBDAEQARQBFAEYARgBGAEYARgBGAEUARABEAEMAQgBAAD8APgA8ADkANwA1ADIALwAsACkAJQAhAB0AGQAVABEADAAIAAQAAADAALgAsACoAKAAk//8//f/8f/s/+f/4v/e/9r/1v/T/9D/zv/M/8r/yf/I/8f/x//H/8f/yP/J/8v/zP/O/9H/0//W/9n/3P/g/+P/5//r/+//8//3//v//v8CAAUACAALAAwADgAQABEAEgATABMAEwATABIAEQAQAA4ADQALAAkABgAEAAIAAAA=';

export const NOTIFICATION_SOUNDS = {
  walletCredited: WALLET_CREDITED_SOUND,
  messageSent: MESSAGE_SENT_SOUND,
  messageReceived: MESSAGE_RECEIVED_SOUND,
};

type SoundType = keyof typeof NOTIFICATION_SOUNDS;

// Create audio elements cache for better performance
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};

/**
 * Play a notification sound
 * @param soundType - The type of sound to play
 * @param volume - Volume level from 0 to 1 (default: 0.5)
 */
export const playSound = (soundType: SoundType, volume = 0.5): void => {
  try {
    // Check if browser supports audio
    if (typeof window === 'undefined' || !window.Audio) {
      return;
    }

    // Get or create cached audio element
    let audio = audioCache[soundType];
    if (!audio) {
      audio = new Audio(NOTIFICATION_SOUNDS[soundType]);
      audioCache[soundType] = audio;
    }

    // Reset and configure
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    
    // Play with error handling (ignore autoplay restrictions)
    audio.play().catch((err) => {
      // Autoplay might be blocked - this is expected behavior
      console.debug('Sound playback blocked:', err.message);
    });
  } catch (error) {
    // Silently fail - sound is non-critical
    console.debug('Sound playback error:', error);
  }
};

/**
 * Preload all sounds for instant playback
 */
export const preloadSounds = (): void => {
  if (typeof window === 'undefined' || !window.Audio) return;
  
  Object.keys(NOTIFICATION_SOUNDS).forEach((key) => {
    const soundType = key as SoundType;
    if (!audioCache[soundType]) {
      audioCache[soundType] = new Audio(NOTIFICATION_SOUNDS[soundType]);
    }
  });
};
