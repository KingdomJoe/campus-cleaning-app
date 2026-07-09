import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { fetchCleanerEarnings } from "@/lib/api/payments";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/lib/database.types";
import { colors, spacing, borderRadius } from "@/lib/theme";

export default function EarningsScreen() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [earnings, setEarnings] = useState({
    available: 0,
    pending: 0,
    total: 0,
    history: [] as Payment[],
  });

  const profileId = profile?.id;
  useFocusEffect(
    useCallback(() => {
      if (profileId) {
        // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
        fetchCleanerEarnings(profileId).then(setEarnings);
      }
    }, [profileId]),
  );

  // Real-time: reflect held/released/refunded payments as they change.
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`cleaner-payments-${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `cleaner_id=eq.${profileId}` },
        () => {
          // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
          fetchCleanerEarnings(profileId).then(setEarnings);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const statusColor = (status: string) =>
    status === "released"
      ? colors.success
      : status === "held"
        ? colors.warning
        : colors.error;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          mode="contained"
        >
          <Card.Content style={styles.summaryContent}>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.onPrimaryContainer },
              ]}
              variant="labelMedium"
            >
              Available
            </Text>
            <Text
              style={[styles.summaryValue, { color: theme.colors.primary }]}
              variant="headlineSmall"
            >
              GH₵ {earnings.available.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            },
          ]}
          mode="contained"
        >
          <Card.Content style={styles.summaryContent}>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="labelMedium"
            >
              Pending
            </Text>
            <Text
              style={[styles.summaryValue, { color: colors.warning }]}
              variant="headlineSmall"
            >
              GH₵ {earnings.pending.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card
        style={[
          styles.totalCard,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.primary,
          },
        ]}
        mode="contained"
      >
        <Card.Content style={styles.totalContent}>
          <Text
            style={[
              styles.totalLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
            variant="labelMedium"
          >
            Total Earned
          </Text>
          <Text
            style={[styles.totalValue, { color: theme.colors.primary }]}
            variant="headlineMedium"
          >
            GH₵ {earnings.total.toFixed(2)}
          </Text>
        </Card.Content>
      </Card>

      {/* Payment History */}
      <Text
        style={[styles.historyTitle, { color: theme.colors.onBackground }]}
        variant="titleMedium"
      >
        Payment History
      </Text>

      {earnings.history.length === 0 ? (
        <Text
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          variant="bodyMedium"
        >
          No payments yet. Complete jobs to start earning!
        </Text>
      ) : (
        earnings.history.map((payment) => (
          <Card
            key={payment.id}
            style={[
              styles.paymentCard,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
            mode="contained"
          >
            <Card.Content style={styles.paymentContent}>
              <View style={styles.paymentInfo}>
                <Text
                  style={[
                    styles.paymentAmount,
                    { color: theme.colors.onSurface },
                  ]}
                  variant="titleSmall"
                >
                  GH₵ {payment.cleaner_payout.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.paymentDate,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  variant="bodySmall"
                >
                  {new Date(payment.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor(payment.status) },
                ]}
              />
              <Text
                style={[
                  styles.paymentStatus,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                variant="labelSmall"
              >
                {payment.status === "released"
                  ? "Paid"
                  : payment.status === "held"
                    ? "Held"
                    : "Refunded"}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: { flex: 1, borderRadius: borderRadius.lg },
  summaryContent: { alignItems: "center", paddingVertical: spacing.md },
  summaryLabel: { fontWeight: "600" },
  summaryValue: { fontWeight: "800", marginTop: spacing.xs },
  totalCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  totalContent: { alignItems: "center", paddingVertical: spacing.lg },
  totalLabel: {},
  totalValue: { fontWeight: "800", marginTop: spacing.xs },
  historyTitle: { fontWeight: "700", marginBottom: spacing.md },
  emptyText: { textAlign: "center", paddingVertical: spacing.xl },
  paymentCard: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontWeight: "700" },
  paymentDate: {},
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  paymentStatus: { minWidth: 50 },
});
