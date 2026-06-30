import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Text, Card, Button, useTheme } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useBookingStore } from "@/stores/bookingStore";
import type { ServiceType } from "@/lib/database.types";
import EmptyState from "@/components/EmptyState";
import { spacing, borderRadius } from "@/lib/theme";

export default function BookIndexScreen() {
  const theme = useTheme();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updateForm = useBookingStore((s) => s.updateForm);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("service_types")
        .select("*")
        .eq("is_active", true)
        .order("base_price");
      if (fetchError) throw fetchError;
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      if (data) setServices(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load services";
      setError(message);
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  const cleaning = services.filter((s) => s.category === "cleaning");
  const laundry = services.filter((s) => s.category === "laundry");

  const selectService = (service: ServiceType) => {
    updateForm({
      serviceCategory: service.category,
      serviceTypeId: service.id,
    });
    router.push(
      service.category === "cleaning"
        ? "/(client)/book/cleaning"
        : "/(client)/book/laundry",
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md }} variant="bodyMedium">
          Loading services...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="⚠️"
          title="Failed to load services"
          subtitle={error}
          theme={theme}
          actionLabel="Retry"
          onAction={loadServices}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        variant="titleMedium"
      >
        🧹 Cleaning
      </Text>
      {cleaning.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.lg }} variant="bodyMedium">
          No cleaning services available
        </Text>
      ) : (
        cleaning.map((s) => (
          <Pressable key={s.id} onPress={() => selectService(s)}>
            <Card
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
              mode="contained"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text
                    style={[styles.name, { color: theme.colors.onSurface }]}
                    variant="titleSmall"
                  >
                    {s.name}
                  </Text>
                  <Text
                    style={[
                      styles.desc,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    variant="bodySmall"
                  >
                    {s.description}
                  </Text>
                </View>
                <Text
                  style={[styles.price, { color: theme.colors.primary }]}
                  variant="titleMedium"
                >
                  GH₵ {s.base_price}
                </Text>
              </Card.Content>
            </Card>
          </Pressable>
        ))
      )}

      <Text
        style={[
          styles.sectionTitle,
          { color: theme.colors.onBackground, marginTop: spacing.lg },
        ]}
        variant="titleMedium"
      >
        👕 Laundry
      </Text>
      {laundry.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
          No laundry services available
        </Text>
      ) : (
        laundry.map((s) => (
          <Pressable key={s.id} onPress={() => selectService(s)}>
            <Card
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
              mode="contained"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text
                    style={[styles.name, { color: theme.colors.onSurface }]}
                    variant="titleSmall"
                  >
                    {s.name}
                  </Text>
                  <Text
                    style={[
                      styles.desc,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    variant="bodySmall"
                  >
                    {s.description}
                  </Text>
                </View>
                <Text
                  style={[styles.price, { color: theme.colors.primary }]}
                  variant="titleMedium"
                >
                  GH₵ {s.base_price}/item
                </Text>
              </Card.Content>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  sectionTitle: { fontWeight: "700", marginBottom: spacing.md },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: { flex: 1, marginRight: spacing.md },
  name: { fontWeight: "600" },
  desc: { marginTop: 2 },
  price: { fontWeight: "700" },
});
