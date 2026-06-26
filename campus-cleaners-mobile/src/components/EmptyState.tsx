import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { spacing } from "@/lib/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  theme?: any;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "📭",
  title,
  subtitle,
  theme,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const defaultTheme = useTheme();
  const appTheme = theme ?? defaultTheme;
  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[styles.title, { color: appTheme.colors.onSurface }]}
        variant="titleMedium"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[styles.subtitle, { color: appTheme.colors.onSurfaceVariant }]}
          variant="bodyMedium"
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="outlined"
          onPress={onAction}
          style={styles.actionBtn}
          contentStyle={styles.actionBtnContent}
          labelStyle={styles.actionBtnLabel}
          icon="refresh"
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  actionBtn: {
    marginTop: spacing.lg,
    borderRadius: 12,
  },
  actionBtnContent: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  actionBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
