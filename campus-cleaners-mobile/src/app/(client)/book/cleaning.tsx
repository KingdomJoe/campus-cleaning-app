import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Switch, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/lib/theme';
import CustomDatePickerModal from '@/components/CustomDatePickerModal';
import CustomTimeSlotModal from '@/components/CustomTimeSlotModal';
import SuggestiveNotesModal from '@/components/SuggestiveNotesModal';

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
  const theme = useTheme();
  const { form, updateForm } = useBookingStore();
  const [roomType, setRoomType] = useState(form.roomType || 'single');
  const [roomSize, setRoomSize] = useState(form.roomSize || 'small');
  const profile = useAuthStore((s) => s.profile);

  // Security guard: redirect back if service type is not selected
  React.useEffect(() => {
    if (!form.serviceTypeId) {
      router.replace('/(client)/book');
    }
  }, [form.serviceTypeId]);

  React.useEffect(() => {
    if (!form.location && profile?.location) {
      const locString = profile.room_number 
        ? `${profile.location}, Room ${profile.room_number}`
        : profile.location;
      updateForm({ location: locString });
    }
  }, [profile?.location, profile?.room_number, form.location, updateForm]);

  // Modal Visibility States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotesPicker, setShowNotesPicker] = useState(false);

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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label} variant="labelLarge">Room Type</Text>
        <SegmentedButtons
          value={roomType}
          onValueChange={(v) => { setRoomType(v); updateForm({ roomType: v }); }}
          buttons={ROOM_TYPES.map((r) => ({
            value: r.value,
            label: r.label,
            style: [styles.segBtn, { borderColor: theme.colors.outline }],
          }))}
          style={styles.segment}
          theme={{ colors: { secondaryContainer: theme.colors.primaryContainer } }}
        />

        <Text style={styles.label} variant="labelLarge">Room Size</Text>
        <SegmentedButtons
          value={roomSize}
          onValueChange={(v) => { setRoomSize(v); updateForm({ roomSize: v }); }}
          buttons={ROOM_SIZES.map((r) => ({
            value: r.value,
            label: r.label,
            style: [styles.segBtn, { borderColor: theme.colors.outline }],
          }))}
          style={styles.segment}
          theme={{ colors: { secondaryContainer: theme.colors.primaryContainer } }}
        />

        <Text style={styles.label} variant="labelLarge">Number of Rooms</Text>
        <View style={styles.counterRow}>
          <Button
            mode="outlined"
            onPress={() => updateForm({ roomCount: Math.max(1, form.roomCount - 1) })}
            textColor={theme.colors.primary}
            style={{ borderColor: theme.colors.outline }}
            compact
          >
            −
          </Button>
          <Text style={[styles.counterValue, { color: theme.colors.onSurface }]} variant="titleLarge">{form.roomCount}</Text>
          <Button
            mode="outlined"
            onPress={() => updateForm({ roomCount: form.roomCount + 1 })}
            textColor={theme.colors.primary}
            style={{ borderColor: theme.colors.outline }}
            compact
          >
            +
          </Button>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]} variant="bodyLarge">Include Bathroom</Text>
          <Switch
            value={form.bathroomIncluded}
            onValueChange={(v) => updateForm({ bathroomIncluded: v })}
            color={theme.colors.primary}
          />
        </View>

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
          disabled={!form.location || !form.scheduledDate || !form.scheduledTime}
        >
          Review Booking →
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={theme.colors.onSurfaceVariant}
          style={{ marginTop: spacing.xs }}
        >
          ← Go Back
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
        serviceCategory="cleaning"
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
  segment: { marginBottom: spacing.xs },
  segBtn: {},
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, justifyContent: 'center' },
  counterValue: { fontWeight: '700', minWidth: 40, textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  switchLabel: {},
  input: {},
  btn: { borderRadius: 12, marginTop: spacing.md },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
});
