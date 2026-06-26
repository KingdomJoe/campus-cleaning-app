import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput, Button, Checkbox, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { colors, spacing, borderRadius } from '@/lib/theme';
import CustomDatePickerModal from '@/components/CustomDatePickerModal';
import CustomTimeSlotModal from '@/components/CustomTimeSlotModal';
import SuggestiveNotesModal from '@/components/SuggestiveNotesModal';

const LAUNDRY_ITEMS = [
  'Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Dresses',
  'Hoodies', 'Curtains', 'Bedsheets',
];

export default function LaundryBookingScreen() {
  const theme = useTheme();
  const { form, updateForm, addLaundryItem, removeLaundryItem, updateLaundryQuantity } = useBookingStore();

  // Modal Visibility States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotesPicker, setShowNotesPicker] = useState(false);

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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label} variant="labelLarge">Select Items</Text>

        {LAUNDRY_ITEMS.map((item) => (
          <View key={item} style={[styles.itemRow, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
            <Checkbox.Android
              status={isItemSelected(item) ? 'checked' : 'unchecked'}
              onPress={() => toggleItem(item)}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.itemName, { color: theme.colors.onSurface }]} variant="bodyLarge">{item}</Text>
            {isItemSelected(item) && (
              <View style={styles.qtyControls}>
                <Button
                  mode="outlined"
                  onPress={() => updateLaundryQuantity(item, Math.max(1, getItemQuantity(item) - 1))}
                  textColor={theme.colors.primary}
                  compact
                  style={[styles.qtyBtn, { borderColor: theme.colors.outline }]}
                >
                  −
                </Button>
                <Text style={[styles.qtyValue, { color: theme.colors.onSurface }]} variant="titleSmall">
                  {getItemQuantity(item)}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => updateLaundryQuantity(item, getItemQuantity(item) + 1)}
                  textColor={theme.colors.primary}
                  compact
                  style={[styles.qtyBtn, { borderColor: theme.colors.outline }]}
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
          style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        {/* Calendar Picker Trigger */}
        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Date *"
              value={form.scheduledDate}
              placeholder="Tap to select date..."
              mode="outlined"
              editable={false}
              left={<TextInput.Icon icon="calendar" />}
              style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </Pressable>

        {/* Time Slot Picker Trigger */}
        <Pressable onPress={() => setShowTimePicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Time *"
              value={form.scheduledTime}
              placeholder="Tap to select time..."
              mode="outlined"
              editable={false}
              left={<TextInput.Icon icon="clock-outline" />}
              style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </Pressable>

        {/* Suggestive Notes Trigger */}
        <Pressable onPress={() => setShowNotesPicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Additional Notes"
              value={form.description}
              placeholder="Tap to select suggestions..."
              mode="outlined"
              editable={false}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="note-text-outline" />}
              style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </Pressable>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={theme.colors.primary}
          disabled={!form.location || !form.scheduledDate || !form.scheduledTime || form.laundryItems.length === 0}
        >
          Review Booking →
        </Button>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePickerModal
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        selectedDate={form.scheduledDate}
        onSelectDate={(date) => updateForm({ scheduledDate: date })}
      />

      {/* Time Picker Modal */}
      <CustomTimeSlotModal
        visible={showTimePicker}
        onDismiss={() => setShowTimePicker(false)}
        selectedTime={form.scheduledTime}
        onSelectTime={(time) => updateForm({ scheduledTime: time })}
      />

      {/* Suggestive Notes Modal */}
      <SuggestiveNotesModal
        visible={showNotesPicker}
        onDismiss={() => setShowNotesPicker(false)}
        serviceCategory="laundry"
        initialNotes={form.description}
        onApplyNotes={(notes) => updateForm({ description: notes })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  label: { color: colors.primary, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingRight: spacing.md,
    borderWidth: 1,
  },
  itemName: { flex: 1 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { minWidth: 32 },
  qtyValue: { fontWeight: '700', minWidth: 24, textAlign: 'center' },
  input: {},
  btn: { borderRadius: 12, marginTop: spacing.md },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
});
