import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, Card, Avatar, Button, useTheme } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";
import { supabase } from "@/lib/supabase";
import type { ServiceType } from "@/lib/database.types";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import { colors, spacing, borderRadius } from "@/lib/theme";

export default function ClientHomeScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { activeBookings, fetchClientBookings } = useBookingStore();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const profileId = profile?.id;

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .eq("is_active", true)
        .order("category");
      if (error) throw error;
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      if (data) setServices(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load services";
      setServicesError(message);
      console.error("Error fetching services:", err);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profileId) {
        fetchClientBookings(profileId);
      }
      fetchServices();
    }, [profileId, fetchServices, fetchClientBookings]),
  );

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const cleaningServices = services.filter((s) => s.category === "cleaning");
  const laundryServices = services.filter((s) => s.category === "laundry");

  const renderServiceSection = (
    title: string,
    icon: string,
    services: ServiceType[],
    category: "cleaning" | "laundry",
    iconMap: Record<string, string>
  ) => {
    if (servicesLoading) {
      return (
        <View style={styles.loadingGrid}>
          {Array.from({ length: category === "cleaning" ? 2 : 3 }, (_, i) => (
            <View key={i} style={styles.serviceCard}>
              <Card style={[styles.serviceCardInner, { backgroundColor: theme.colors.surfaceVariant }]} mode="contained">
                <Card.Content style={styles.serviceContent}>
                  <View style={[styles.serviceIcon, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={[styles.skeleton, styles.skeletonText]} />
                  <View style={[styles.skeleton, styles.skeletonPrice]} />
                </Card.Content>
              </Card>
            </View>
          ))}
        </View>
      );
    }

    if (servicesError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Failed to load services"
          subtitle={servicesError}
          theme={theme}
          actionLabel="Retry"
          onAction={fetchServices}
        />
      );
    }

    if (services.length === 0) {
      return (
        <EmptyState
          icon={icon}
          title={`No ${title.toLowerCase()} available`}
          subtitle="Check back later for new offerings"
          theme={theme}
        />
      );
    }

    return (
      <View style={styles.serviceGrid}>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={styles.serviceCard}
            onPress={() => {
              useBookingStore.getState().updateForm({
                serviceCategory: category,
                serviceTypeId: service.id,
              });
              router.push(`/(client)/book/${category}`);
            }}
          >
            <Card
              style={[
                styles.serviceCardInner,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
              mode="contained"
            >
              <Card.Content style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>
                  {iconMap[service.name] ?? (category === "cleaning" ? "📦" : "🧺")}
                </Text>
                <Text
                  style={[
                    styles.serviceName,
                    { color: theme.colors.onSurface },
                  ]}
                  variant="titleSmall"
                >
                  {service.name}
                </Text>
                <Text style={styles.servicePrice} variant="bodySmall">
                  From GH₵ {service.base_price}{category === "laundry" ? "/item" : ""}
                </Text>
              </Card.Content>
            </Card>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text
            style={[styles.hello, { color: theme.colors.onSurfaceVariant }]}
            variant="bodyLarge"
          >
            Hello, {firstName} 👋
          </Text>
          <Text
            style={[styles.greetingTitle, { color: theme.colors.onBackground }]}
            variant="headlineSmall"
          >
            What do you need today?
          </Text>
        </View>
        <Avatar.Text
          size={44}
          label={firstName.charAt(0)}
          style={styles.avatar}
          color={colors.white}
        />
      </View>

      {/* Active Booking Banner */}
      {activeBookings.length > 0 && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
            variant="titleMedium"
          >
            Active Bookings
          </Text>
          {activeBookings.slice(0, 2).map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              userRole="client"
              onPress={() => router.push(`/(client)/bookings/${booking.id}`)}
            />
          ))}
        </View>
      )}

      {/* Cleaning Services */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          variant="titleMedium"
        >
          🧹 Cleaning Services
        </Text>
        {renderServiceSection(
          "Cleaning Services",
          "🧹",
          cleaningServices,
          "cleaning",
          { Express: "⚡", Deep: "🔥", "Move-In": "📦" }
        )}
      </View>

      {/* Laundry Services */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          variant="titleMedium"
        >
          👕 Laundry Services
        </Text>
        {renderServiceSection(
          "Laundry Services",
          "👕",
          laundryServices,
          "laundry",
          { Iron: "🔥", Wash: "🧺" }
        )}
      </View>

      {/* Quick Action */}
      <Button
        mode="outlined"
        icon="magnify"
        onPress={() => router.push("/(client)/book")}
        textColor={theme.colors.primary}
        style={styles.findBtn}
      >
        Browse All Services
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  hello: {
    // color determined dynamically
  },
  greetingTitle: {
    fontWeight: "700",
    marginTop: 2,
  },
  avatar: {
    backgroundColor: colors.primaryDark,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  loadingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  serviceCard: {
    width: "47%",
  },
  serviceCardInner: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  serviceContent: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  serviceName: {
    fontWeight: "600",
    textAlign: "center",
  },
  servicePrice: {
    color: colors.primary,
    fontWeight: "600",
  },
  findBtn: {
    borderColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.outline,
    borderRadius: 4,
  },
  skeletonText: {
    width: "80%",
    height: 16,
    marginBottom: spacing.xs,
  },
  skeletonPrice: {
    width: "50%",
    height: 14,
  },
});
