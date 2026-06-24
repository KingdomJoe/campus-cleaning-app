import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

// Light theme colors
export const lightColors = {
  primary: '#00C896',
  primaryLight: '#33D4AB',
  primaryDark: '#009B75',
  primaryContainer: '#E0F9F1',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#003D2E',

  secondary: '#0F3460',
  secondaryLight: '#1A5F96',
  secondaryContainer: '#E8F0FE',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#0F3460',

  background: '#F9FBFD',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F3F6',
  surfaceElevated: '#E8ECF0',
  onBackground: '#111118',
  onSurface: '#111118',
  onSurfaceVariant: '#5B6275',

  success: '#00C896',
  warning: '#FFB020',
  error: '#FF4D4F',
  info: '#2196F3',

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

  outline: '#E0E4EC',
  outlineVariant: '#CBD2DE',
  shadow: '#000000',
  inverseSurface: '#111118',
  inversePrimary: '#00C896',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  disabled: '#A0AABF',
  placeholder: '#8E9AA8',
  white: '#FFFFFF',
  black: '#000000',
  card: '#FFFFFF',
  border: '#E0E4EC',
  notification: '#FF4D4F',
  star: '#FFD700',
} as const;

// Dark theme colors
export const darkColors = {
  primary: '#00C896',
  primaryLight: '#33D4AB',
  primaryDark: '#009B75',
  primaryContainer: '#003D2E',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#00E6AA',

  secondary: '#16213E',
  secondaryLight: '#1A2744',
  secondaryContainer: '#0F3460',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#A3B8D8',

  background: '#0A0A0F',
  surface: '#111118',
  surfaceVariant: '#1A1A24',
  surfaceElevated: '#1E1E2A',
  onBackground: '#E8E8ED',
  onSurface: '#E8E8ED',
  onSurfaceVariant: '#9E9EAD',

  success: '#00C896',
  warning: '#FFB020',
  error: '#FF4D4F',
  info: '#2196F3',

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

// Static colors map to light colors by default so static styles compile to light colors
export const colors = lightColors;

// Configure light theme
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    primaryContainer: lightColors.primaryContainer,
    onPrimary: lightColors.onPrimary,
    onPrimaryContainer: lightColors.onPrimaryContainer,
    secondary: lightColors.secondary,
    secondaryContainer: lightColors.secondaryContainer,
    onSecondary: lightColors.onSecondary,
    onSecondaryContainer: lightColors.onSecondaryContainer,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    onBackground: lightColors.onBackground,
    onSurface: lightColors.onSurface,
    onSurfaceVariant: lightColors.onSurfaceVariant,
    error: lightColors.error,
    outline: lightColors.outline,
    outlineVariant: lightColors.outlineVariant,
    shadow: lightColors.shadow,
    inverseSurface: lightColors.inverseSurface,
    inversePrimary: lightColors.inversePrimary,
    backdrop: lightColors.backdrop,
    elevation: {
      level0: 'transparent',
      level1: lightColors.surface,
      level2: lightColors.surfaceVariant,
      level3: lightColors.surfaceElevated,
      level4: lightColors.surfaceElevated,
      level5: lightColors.surfaceElevated,
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};

// Configure dark theme
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryContainer,
    onPrimary: darkColors.onPrimary,
    onPrimaryContainer: darkColors.onPrimaryContainer,
    secondary: darkColors.secondary,
    secondaryContainer: darkColors.secondaryContainer,
    onSecondary: darkColors.onSecondary,
    onSecondaryContainer: darkColors.onSecondaryContainer,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    onBackground: darkColors.onBackground,
    onSurface: darkColors.onSurface,
    onSurfaceVariant: darkColors.onSurfaceVariant,
    error: darkColors.error,
    outline: darkColors.outline,
    outlineVariant: darkColors.outlineVariant,
    shadow: darkColors.shadow,
    inverseSurface: darkColors.inverseSurface,
    inversePrimary: darkColors.inversePrimary,
    backdrop: darkColors.backdrop,
    elevation: {
      level0: 'transparent',
      level1: darkColors.surface,
      level2: darkColors.surfaceVariant,
      level3: darkColors.surfaceElevated,
      level4: darkColors.surfaceElevated,
      level5: darkColors.surfaceElevated,
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};

// Export fallback theme as lightTheme
export const theme = lightTheme;

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
