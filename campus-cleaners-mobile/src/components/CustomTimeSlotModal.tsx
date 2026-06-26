import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Portal, Modal, Text, Button, useTheme } from 'react-native-paper';
import { spacing, borderRadius } from '@/lib/theme';

interface CustomTimeSlotModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectTime: (timeString: string) => void;
  selectedTime?: string; // HH:MM
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00'
];

export default function CustomTimeSlotModal({
  visible,
  onDismiss,
  onSelectTime,
  selectedTime,
}: CustomTimeSlotModalProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.elevation.level3 },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.onSurface }]} variant="titleMedium">
          Select Booking Time
        </Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {TIME_SLOTS.map((time) => {
            const isSel = selectedTime === time;

            return (
              <Pressable
                key={time}
                onPress={() => {
                  onSelectTime(time);
                  onDismiss();
                }}
                style={[
                  styles.slotCell,
                  { borderColor: theme.colors.outline },
                  isSel && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    isSel && { color: theme.colors.onPrimary, fontWeight: '700' },
                    !isSel && { color: theme.colors.onSurface },
                  ]}
                  variant="bodyMedium"
                >
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={onDismiss} textColor={theme.colors.primary}>
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    maxHeight: '70%',
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotCell: {
    width: '28%',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
});
