import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useBookingStore } from '@/stores/bookingStore';
import type { ServiceType } from '@/lib/database.types';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function BookIndexScreen() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const updateForm = useBookingStore((s) => s.updateForm);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('base_price');
      if (data) setServices(data);
    };
    load();
  }, []);

  const cleaning = services.filter((s) => s.category === 'cleaning');
  const laundry = services.filter((s) => s.category === 'laundry');

  const selectService = (service: ServiceType) => {
    updateForm({
      serviceCategory: service.category,
      serviceTypeId: service.id,
    });
    router.push(
      service.category === 'cleaning'
        ? '/(client)/book/cleaning'
        : '/(client)/book/laundry'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle} variant="titleMedium">
        🧹 Cleaning
      </Text>
      {cleaning.map((s) => (
        <Pressable key={s.id} onPress={() => selectService(s)}>
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.name} variant="titleSmall">{s.name}</Text>
                <Text style={styles.desc} variant="bodySmall">{s.description}</Text>
              </View>
              <Text style={styles.price} variant="titleMedium">
                GH₵ {s.base_price}
              </Text>
            </Card.Content>
          </Card>
        </Pressable>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]} variant="titleMedium">
        👕 Laundry
      </Text>
      {laundry.map((s) => (
        <Pressable key={s.id} onPress={() => selectService(s)}>
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.name} variant="titleSmall">{s.name}</Text>
                <Text style={styles.desc} variant="bodySmall">{s.description}</Text>
              </View>
              <Text style={styles.price} variant="titleMedium">
                GH₵ {s.base_price}/item
              </Text>
            </Card.Content>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { color: colors.white, fontWeight: '700', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.md,
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, marginRight: spacing.md },
  name: { color: colors.white, fontWeight: '600' },
  desc: { color: colors.onSurfaceVariant, marginTop: 2 },
  price: { color: colors.primary, fontWeight: '700' },
});
