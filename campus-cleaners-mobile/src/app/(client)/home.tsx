import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Card, Avatar, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { supabase } from '@/lib/supabase';
import type { ServiceType } from '@/lib/database.types';
import BookingCard from '@/components/BookingCard';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function ClientHomeScreen() {
  const { profile } = useAuthStore();
  const { activeBookings, fetchClientBookings } = useBookingStore();
  const [services, setServices] = useState<ServiceType[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchClientBookings(profile.id);
    }
    fetchServices();
  }, [profile?.id]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('category');
    // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
    if (data) setServices(data);
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const cleaningServices = services.filter((s) => s.category === 'cleaning');
  const laundryServices = services.filter((s) => s.category === 'laundry');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.hello} variant="bodyLarge">
            Hello, {firstName} 👋
          </Text>
          <Text style={styles.greetingTitle} variant="headlineSmall">
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
          <Text style={styles.sectionTitle} variant="titleMedium">
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
        <Text style={styles.sectionTitle} variant="titleMedium">
          🧹 Cleaning Services
        </Text>
        <View style={styles.serviceGrid}>
          {cleaningServices.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => {
                useBookingStore.getState().updateForm({
                  serviceCategory: 'cleaning',
                  serviceTypeId: service.id,
                });
                router.push('/(client)/book/cleaning');
              }}
            >
              <Card style={styles.serviceCardInner} mode="contained">
                <Card.Content style={styles.serviceContent}>
                  <Text style={styles.serviceIcon}>
                    {service.name.includes('Express') ? '⚡' : service.name.includes('Deep') ? '🔥' : '📦'}
                  </Text>
                  <Text style={styles.serviceName} variant="titleSmall">
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice} variant="bodySmall">
                    From GH₵ {service.base_price}
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Laundry Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} variant="titleMedium">
          👕 Laundry Services
        </Text>
        <View style={styles.serviceGrid}>
          {laundryServices.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => {
                useBookingStore.getState().updateForm({
                  serviceCategory: 'laundry',
                  serviceTypeId: service.id,
                });
                router.push('/(client)/book/laundry');
              }}
            >
              <Card style={styles.serviceCardInner} mode="contained">
                <Card.Content style={styles.serviceContent}>
                  <Text style={styles.serviceIcon}>
                    {service.name.includes('Iron') ? '🔥' : '🧺'}
                  </Text>
                  <Text style={styles.serviceName} variant="titleSmall">
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice} variant="bodySmall">
                    From GH₵ {service.base_price}/item
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Quick Action */}
      <Button
        mode="outlined"
        icon="magnify"
        onPress={() => router.push('/(client)/book')}
        textColor={colors.primary}
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
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  hello: {
    color: colors.onSurfaceVariant,
  },
  greetingTitle: {
    color: colors.white,
    fontWeight: '700',
    marginTop: 2,
  },
  avatar: {
    backgroundColor: colors.primaryDark,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: '47%',
  },
  serviceCardInner: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  serviceContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  serviceName: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  servicePrice: {
    color: colors.primary,
    fontWeight: '600',
  },
  findBtn: {
    borderColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.md,
  },
});
