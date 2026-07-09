import React, { createContext, useState, useCallback, useRef } from 'react';
import { Snackbar } from 'react-native-paper';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1E90FF');
  const [duration, setDuration] = useState(3000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info', dur: number = 3000) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(msg);
    setBackgroundColor(type === 'success' ? '#00C896' : type === 'error' ? '#FF4D4F' : '#1E90FF');
    setDuration(dur);
    setVisible(true);

    // Auto-dismiss after duration
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, dur);
  }, []);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={duration}
        style={{ backgroundColor }}
        action={{
          label: 'Dismiss',
          onPress: () => setVisible(false),
          textColor: '#FFFFFF',
        }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

// For backward compatibility - simple function that logs to console
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
  console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
}