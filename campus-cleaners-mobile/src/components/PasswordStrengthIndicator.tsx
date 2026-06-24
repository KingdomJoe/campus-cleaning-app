import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, LayoutAnimation, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '@/lib/theme';

const COMMON_PASSWORDS = [
  '123456', '12345678', '123456789', 'password', '12345', '1234567',
  'qwerty', '1234567890', 'admin', 'letmein1', 'password123', 'welcome',
  '111111', '123123', 'iloveyou', 'sunshine', 'princess', 'admin123', 'qwertz'
];

interface PasswordStrengthIndicatorProps {
  password?: string;
  email?: string;
  fullName?: string;
  onStrengthChange?: (isValid: boolean) => void;
}

export default function PasswordStrengthIndicator({
  password = '',
  email = '',
  fullName = '',
  onStrengthChange,
}: PasswordStrengthIndicatorProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Criteria checks
  const hasMinLength = password.length >= 8;
  const hasNumOrSpecial = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

  // Leakage check
  const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());
  
  // Check if derived from user info (e.g. contains name or email prefix)
  const isDerived = (() => {
    if (!password) return false;
    const p = password.toLowerCase();
    
    if (email) {
      const prefix = email.split('@')[0].toLowerCase();
      if (prefix.length >= 4 && (p.includes(prefix) || prefix.includes(p))) {
        return true;
      }
    }
    
    if (fullName) {
      const parts = fullName.split(/\s+/).map(n => n.toLowerCase()).filter(n => n.length >= 3);
      for (const part of parts) {
        if (p.includes(part) || part.includes(p)) {
          return true;
        }
      }
    }
    return false;
  })();

  const isLeaked = isCommon || isDerived;
  const isPasswordEntered = password.length > 0;

  // Calculate strength score (0 to 4)
  let score = 0;
  if (isPasswordEntered) {
    if (hasMinLength) score += 1;
    if (hasNumOrSpecial) score += 1;
    if (hasUpperLower) score += 1;
    if (!isLeaked) score += 1;
  }

  const isValid = hasMinLength && hasNumOrSpecial && hasUpperLower && !isLeaked;

  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(isValid);
    }
  }, [isValid]);

  useEffect(() => {
    // Animate strength bar width
    Animated.timing(animatedWidth, {
      toValue: score * 25, // percentage (0% to 100%)
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Smooth layout transitions for warning alerts
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [score]);

  // Determine strength label & color
  let strengthLabel = 'Very Weak';
  let strengthColor: string = colors.error;
  if (score === 2) {
    strengthLabel = 'Weak';
    strengthColor = colors.warning;
  } else if (score === 3) {
    strengthLabel = 'Medium';
    strengthColor = colors.info;
  } else if (score === 4) {
    strengthLabel = 'Strong';
    strengthColor = colors.success;
  }

  return (
    <View style={styles.container}>
      {isPasswordEntered && (
        <View style={styles.strengthBarContainer}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel} variant="labelSmall">
              Strength: <Text style={{ color: strengthColor, fontWeight: '700' }}>{strengthLabel}</Text>
            </Text>
            <Text style={styles.percentageText} variant="labelSmall">
              {score * 25}%
            </Text>
          </View>
          <View style={styles.barBackground}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: animatedWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: strengthColor,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Criteria Checklist */}
      <View style={styles.checklist}>
        <Text style={styles.headerTitle} variant="labelMedium">
          Password Requirements:
        </Text>
        
        <CriterionRow
          label="8+ characters"
          satisfied={hasMinLength}
          active={isPasswordEntered}
        />
        <CriterionRow
          label="1 number or special character"
          satisfied={hasNumOrSpecial}
          active={isPasswordEntered}
        />
        <CriterionRow
          label="Uppercase & lowercase letters"
          satisfied={hasUpperLower}
          active={isPasswordEntered}
        />
        <CriterionRow
          label="Safe from common data leaks"
          satisfied={!isLeaked}
          active={isPasswordEntered}
          isCritical
        />
      </View>

      {/* Leaked alert card */}
      {isPasswordEntered && isLeaked && (
        <View style={styles.warningCard}>
          <MaterialCommunityIcons name="alert-decagram" size={20} color={colors.error} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle} variant="labelMedium">
              Insecure Password Detected
            </Text>
            <Text style={styles.warningBody} variant="bodySmall">
              {isCommon
                ? 'This password is too common and has been breached in past leaks. Please choose a unique password.'
                : 'Avoid using details like your email prefix or name in your password, as it is easy to guess.'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

interface CriterionRowProps {
  label: string;
  satisfied: boolean;
  active: boolean;
  isCritical?: boolean;
}

function CriterionRow({ label, satisfied, active, isCritical = false }: CriterionRowProps) {
  let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'circle-outline';
  let iconColor: string = colors.placeholder;

  if (active) {
    if (satisfied) {
      iconName = 'check-circle';
      iconColor = colors.success;
    } else {
      iconName = 'close-circle';
      iconColor = isCritical ? colors.error : colors.placeholder;
    }
  }

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={iconName} size={16} color={iconColor} style={styles.rowIcon} />
      <Text
        style={[
          styles.rowText,
          active && satisfied ? styles.rowTextSatisfied : null,
          active && !satisfied && isCritical ? styles.rowTextFailedCritical : null,
        ]}
        variant="bodySmall"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: 12,
  },
  strengthBarContainer: {
    marginBottom: spacing.md,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    color: colors.onSurfaceVariant,
  },
  percentageText: {
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  barBackground: {
    height: 6,
    backgroundColor: colors.outline,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklist: {
    gap: 8,
  },
  headerTitle: {
    color: colors.white,
    marginBottom: 4,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowText: {
    color: colors.onSurfaceVariant,
  },
  rowTextSatisfied: {
    color: colors.onSurface,
  },
  rowTextFailedCritical: {
    color: colors.error,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 77, 79, 0.08)',
    borderColor: 'rgba(255, 77, 79, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: colors.error,
    fontWeight: '700',
  },
  warningBody: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
});
