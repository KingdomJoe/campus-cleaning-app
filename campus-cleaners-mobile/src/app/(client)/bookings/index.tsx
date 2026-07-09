import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { colors, spacing } from "@/lib/theme";

export default function BookingsListScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { activeBookings, pastBookings, isLoading, fetchClientBookings, subscribeToClientBookings } =
    useBookingStore();
  const [tab, setTab] = useState("active");
  const theme = useTheme();
  const profileId = profile?.id;

  useFocusEffect(
    useCallback(() => {
      if (profileId) fetchClientBookings(profileId);
    }, [profileId, fetchClientBookings]),
  );

  // Realtime subscription
  useEffect(() => {
    if (!profileId) return;
    const unsubscribe = subscribeToClientBookings(profileId);
    return () => unsubscribe();
  }, [profileId, subscribeToClientBookings]);

  if (isLoading) return <LoadingScreen message="Loading bookings..." />;

  const data = tab === "active" ? activeBookings : pastBookings;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          {
            value: "active",
            label: `Active (${activeBookings.length})`,
            style: styles.segBtn,
          },
          {
            value: "past",
            label: `Past (${pastBookings.length})`,
            style: styles.segBtn,
          },
        ]}
        style={styles.segment}
        theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
      />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            userRole="client"
            onPress={() => router.push(`/(client)/bookings/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={tab === "active" ? "📋" : "📦"}
            title={tab === "active" ? "No active bookings" : "No past bookings"}
            subtitle={
              tab === "active"
                ? "Book a cleaning or laundry service to get started"
                : undefined
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { marginHorizontal: spacing.lg, marginVertical: spacing.md },
  segBtn: { borderColor: colors.outline },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
