import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const colors = {
  // Primary palette — teal-green
  primary: '#00C896',
  primaryLight: '#33D4AB',
  primaryDark: '#009B75',
  primaryContainer: '#003D2E',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#00E6AA',

  // Secondary palette — deep blue
  secondary: '#16213E',
  secondaryLight: '#1A2744',
  secondaryContainer: '#0F3460',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#A3B8D8',

  // Background & surfaces
  background: '#0A0A0F',
  surface: '#111118',
  surfaceVariant: '#1A1A24',
  surfaceElevated: '#1E1E2A',
  onBackground: '#E8E8ED',
  onSurface: '#E8E8ED',
  onSurfaceVariant: '#9E9EAD',

  // Status colors
  success: '#00C896',
  warning: '#FFB020',
  error: '#FF4D4F',
  info: '#2196F3',

  // Booking status colors
  statusRequested: '#FFB020',
  statusAccepted: '#2196F3',
  statusEnRoute: '#9C27B0',
  statusArrived: '#00BCD4',
  statusStarted: '#FF9800',
  statusCompleted: '#00C896',
  statusVerified: '#4CAF50',
  statusClosed: '#607D8B',
  statusCancelled: '#FF4D4F',
  statusDeclined: '#F44336',

  // Misc
  outline: '#2A2A38',
  outlineVariant: '#3A3A4A',
  shadow: '#000000',
  inverseSurface: '#E8E8ED',
  inversePrimary: '#006B52',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  disabled: '#4A4A5A',
  placeholder: '#6B6B7B',
  white: '#FFFFFF',
  black: '#000000',
  card: '#15151F',
  border: '#2A2A38',
  notification: '#FF4D4F',
  star: '#FFD700',
} as const;

export const theme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryContainer,
    onPrimary: colors.onPrimary,
    onPrimaryContainer: colors.onPrimaryContainer,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryContainer,
    onSecondary: colors.onSecondary,
    onSecondaryContainer: colors.onSecondaryContainer,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    onSurfaceVariant: colors.onSurfaceVariant,
    error: colors.error,
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
    shadow: colors.shadow,
    inverseSurface: colors.inverseSurface,
    inversePrimary: colors.inversePrimary,
    backdrop: colors.backdrop,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surfaceVariant,
      level3: colors.surfaceElevated,
      level4: colors.surfaceElevated,
      level5: colors.surfaceElevated,
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
