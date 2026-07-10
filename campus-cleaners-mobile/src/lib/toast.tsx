import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { Alert } from 'react-native';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export type ToastType = 'success' | 'error' | 'info';
type EmitFn = (message: string, type: ToastType, duration: number) => void;

// Module-level listener so the standalone showToast() (used by all screens)
// actually triggers the Snackbar rendered by ToastProvider, without every
// call site needing the React context.
let emitToast: EmitFn | null = null;

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  if (emitToast) {
    emitToast(message, type, duration);
  } else {
    // Provider not mounted yet (e.g. very early). Surface errors as a native
    // alert so failures are never silent on preview/production builds.
    console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      Alert.alert('Error', message);
    }
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1E90FF');
  const [duration, setDuration] = useState(3000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    emitToast = (msg: string, type: ToastType, dur: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setMessage(msg);
      setBackgroundColor(
        type === 'success' ? '#00C896' : type === 'error' ? '#FF4D4F' : '#1E90FF'
      );
      setDuration(dur);
      setVisible(true);

      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, dur);
    };

    return () => {
      emitToast = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Expose the context variant too (for screens that may use the hook).
  const showToastCb = useCallback((msg: string, type: ToastType = 'info', dur = 3000) => {
    showToast(msg, type, dur);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: showToastCb }}>
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
