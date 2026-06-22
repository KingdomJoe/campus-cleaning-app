import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Checkbox } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { colors, spacing, borderRadius } from '@/lib/theme';

const LAUNDRY_ITEMS = [
  'Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Dresses',
  'Hoodies', 'Curtains', 'Bedsheets',
];

export default function LaundryBookingScreen() {
  const { form, updateForm, addLaundryItem, removeLaundryItem, updateLaundryQuantity } = useBookingStore();

  const isItemSelected = (item: string) =>
    form.laundryItems.some((i) => i.item_type === item);

  const getItemQuantity = (item: string) =>
    form.laundryItems.find((i) => i.item_type === item)?.quantity ?? 0;

  const toggleItem = (item: string) => {
    if (isItemSelected(item)) {
      removeLaundryItem(item);
    } else {
      addLaundryItem({ item_type: item, quantity: 1 });
    }
  };

  const handleNext = () => {
    if (!form.location || !form.scheduledDate || !form.scheduledTime || form.laundryItems.length === 0) {
      return;
    }
    router.push('/(client)/book/summary');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label} variant="labelLarge">Select Items</Text>

        {LAUNDRY_ITEMS.map((item) => (
          <View key={item} style={styles.itemRow}>
            <Checkbox.Android
              status={isItemSelected(item) ? 'checked' : 'unchecked'}
              onPress={() => toggleItem(item)}
              color={colors.primary}
              uncheckedColor={colors.onSurfaceVariant}
            />
            <Text style={styles.itemName} variant="bodyLarge">{item}</Text>
            {isItemSelected(item) && (
              <View style={styles.qtyControls}>
                <Button
                  mode="outlined"
                  onPress={() => updateLaundryQuantity(item, Math.max(1, getItemQuantity(item) - 1))}
                  textColor={colors.primary}
                  compact
                  style={styles.qtyBtn}
                >
                  −
                </Button>
                <Text style={styles.qtyValue} variant="titleSmall">
                  {getItemQuantity(item)}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => updateLaundryQuantity(item, getItemQuantity(item) + 1)}
                  textColor={colors.primary}
                  compact
                  style={styles.qtyBtn}
                >
                  +
                </Button>
              </View>
            )}
          </View>
        ))}

        <TextInput
          label="Location *"
          value={form.location}
          onChangeText={(v) => updateForm({ location: v })}
          placeholder="e.g., Amamoma Hall, Room B204"
          mode="outlined"
          left={<TextInput.Icon icon="map-marker" />}
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          textColor={colors.onSurface}
          theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
        />

        <TextInput
          label="Date * (YYYY-MM-DD)"
          value={form.scheduledDate}
          onChangeText={(v) => updateForm({ scheduledDate: v })}
          placeholder="2026-06-25"
          mode="outlined"
          left={<TextInput.Icon icon="calendar" />}
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          textColor={colors.onSurface}
          theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
        />

        <TextInput
          label="Time * (HH:MM)"
          value={form.scheduledTime}
          onChangeText={(v) => updateForm({ scheduledTime: v })}
          placeholder="14:00"
          mode="outlined"
          left={<TextInput.Icon icon="clock-outline" />}
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          textColor={colors.onSurface}
          theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
        />

        <TextInput
          label="Additional Notes"
          value={form.description}
          onChangeText={(v) => updateForm({ description: v })}
          placeholder="Any special instructions..."
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          textColor={colors.onSurface}
          theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
        />

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
          disabled={!form.location || !form.scheduledDate || !form.scheduledTime || form.laundryItems.length === 0}
        >
          Review Booking →
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  label: { color: colors.primary, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  itemName: { flex: 1, color: colors.onSurface },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { minWidth: 32, borderColor: colors.outline },
  qtyValue: { color: colors.white, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  input: { backgroundColor: colors.surfaceVariant },
  btn: { borderRadius: 12, marginTop: spacing.md },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
});
