import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Switch } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { colors, spacing } from '@/lib/theme';

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Room' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'office', label: 'Office' },
];

const ROOM_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export default function CleaningBookingScreen() {
  const { form, updateForm } = useBookingStore();
  const [roomType, setRoomType] = useState(form.roomType || 'single');
  const [roomSize, setRoomSize] = useState(form.roomSize || 'small');

  const handleNext = () => {
    if (!form.location || !form.scheduledDate || !form.scheduledTime) {
      return;
    }
    updateForm({ roomType, roomSize });
    router.push('/(client)/book/summary');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label} variant="labelLarge">Room Type</Text>
        <SegmentedButtons
          value={roomType}
          onValueChange={(v) => { setRoomType(v); updateForm({ roomType: v }); }}
          buttons={ROOM_TYPES.map((r) => ({
            value: r.value,
            label: r.label,
            style: styles.segBtn,
          }))}
          style={styles.segment}
          theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
        />

        <Text style={styles.label} variant="labelLarge">Room Size</Text>
        <SegmentedButtons
          value={roomSize}
          onValueChange={(v) => { setRoomSize(v); updateForm({ roomSize: v }); }}
          buttons={ROOM_SIZES.map((r) => ({
            value: r.value,
            label: r.label,
            style: styles.segBtn,
          }))}
          style={styles.segment}
          theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
        />

        <Text style={styles.label} variant="labelLarge">Number of Rooms</Text>
        <View style={styles.counterRow}>
          <Button
            mode="outlined"
            onPress={() => updateForm({ roomCount: Math.max(1, form.roomCount - 1) })}
            textColor={colors.primary}
            compact
          >
            −
          </Button>
          <Text style={styles.counterValue} variant="titleLarge">{form.roomCount}</Text>
          <Button
            mode="outlined"
            onPress={() => updateForm({ roomCount: form.roomCount + 1 })}
            textColor={colors.primary}
            compact
          >
            +
          </Button>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel} variant="bodyLarge">Include Bathroom</Text>
          <Switch
            value={form.bathroomIncluded}
            onValueChange={(v) => updateForm({ bathroomIncluded: v })}
            color={colors.primary}
          />
        </View>

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
          disabled={!form.location || !form.scheduledDate || !form.scheduledTime}
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
  segment: { marginBottom: spacing.xs },
  segBtn: { borderColor: colors.outline },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, justifyContent: 'center' },
  counterValue: { color: colors.white, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  switchLabel: { color: colors.onSurface },
  input: { backgroundColor: colors.surfaceVariant },
  btn: { borderRadius: 12, marginTop: spacing.md },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
});
