import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { fetchCleanerEarnings } from '@/lib/api/payments';
import type { Payment } from '@/lib/database.types';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function EarningsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [earnings, setEarnings] = useState({
    available: 0,
    pending: 0,
    total: 0,
    history: [] as Payment[],
  });

  useEffect(() => {
    if (profile?.id) {
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      fetchCleanerEarnings(profile.id).then(setEarnings);
    }
  }, [profile?.id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, styles.availableCard]} mode="contained">
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryLabel} variant="labelMedium">Available</Text>
            <Text style={styles.summaryValue} variant="headlineSmall">
              GH₵ {earnings.available.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, styles.pendingCard]} mode="contained">
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.pendingLabel} variant="labelMedium">Pending</Text>
            <Text style={styles.pendingValue} variant="headlineSmall">
              GH₵ {earnings.pending.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.totalCard} mode="contained">
        <Card.Content style={styles.totalContent}>
          <Text style={styles.totalLabel} variant="labelMedium">Total Earned</Text>
          <Text style={styles.totalValue} variant="headlineMedium">
            GH₵ {earnings.total.toFixed(2)}
          </Text>
        </Card.Content>
      </Card>

      {/* Payment History */}
      <Text style={styles.historyTitle} variant="titleMedium">Payment History</Text>

      {earnings.history.length === 0 ? (
        <Text style={styles.emptyText} variant="bodyMedium">
          No payments yet. Complete jobs to start earning!
        </Text>
      ) : (
        earnings.history.map((payment) => (
          <Card key={payment.id} style={styles.paymentCard} mode="contained">
            <Card.Content style={styles.paymentContent}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount} variant="titleSmall">
                  GH₵ {payment.cleaner_payout.toFixed(2)}
                </Text>
                <Text style={styles.paymentDate} variant="bodySmall">
                  {new Date(payment.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusDot, {
                backgroundColor:
                  payment.status === 'released' ? colors.success
                    : payment.status === 'held' ? colors.warning
                    : colors.error,
              }]} />
              <Text style={styles.paymentStatus} variant="labelSmall">
                {payment.status === 'released' ? 'Paid' : payment.status === 'held' ? 'Held' : 'Refunded'}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  summaryCard: { flex: 1, borderRadius: borderRadius.lg },
  availableCard: { backgroundColor: colors.primaryContainer },
  pendingCard: { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.outline },
  summaryContent: { alignItems: 'center', paddingVertical: spacing.md },
  summaryLabel: { color: colors.onPrimaryContainer },
  summaryValue: { color: colors.primary, fontWeight: '800', marginTop: spacing.xs },
  pendingLabel: { color: colors.onSurfaceVariant },
  pendingValue: { color: colors.warning, fontWeight: '800', marginTop: spacing.xs },
  totalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.xl },
  totalContent: { alignItems: 'center', paddingVertical: spacing.lg },
  totalLabel: { color: colors.onSurfaceVariant },
  totalValue: { color: colors.white, fontWeight: '800', marginTop: spacing.xs },
  historyTitle: { color: colors.white, fontWeight: '700', marginBottom: spacing.md },
  emptyText: { color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
  paymentCard: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.outline },
  paymentContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  paymentInfo: { flex: 1 },
  paymentAmount: { color: colors.white, fontWeight: '700' },
  paymentDate: { color: colors.onSurfaceVariant },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  paymentStatus: { color: colors.onSurfaceVariant, minWidth: 50 },
});
