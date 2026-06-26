import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Portal, Modal, Text, IconButton, Button, useTheme } from 'react-native-paper';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';
import { spacing, borderRadius } from '@/lib/theme';

interface CustomDatePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectDate: (dateString: string) => void;
  selectedDate?: string; // YYYY-MM-DD
}

export default function CustomDatePickerModal({
  visible,
  onDismiss,
  onSelectDate,
  selectedDate,
}: CustomDatePickerModalProps) {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? parseISO(selectedDate) : new Date()
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleDayPress = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    onSelectDate(formatted);
    onDismiss();
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const parsedSelected = selectedDate ? parseISO(selectedDate) : null;

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
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-left"
            onPress={handlePrevMonth}
            iconColor={theme.colors.onSurface}
          />
          <Text style={[styles.monthLabel, { color: theme.colors.onSurface }]} variant="titleMedium">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <IconButton
            icon="chevron-right"
            onPress={handleNextMonth}
            iconColor={theme.colors.onSurface}
          />
        </View>

        {/* Weekdays Header */}
        <View style={styles.weekRow}>
          {weekDays.map((wd) => (
            <Text
              key={wd}
              style={[styles.weekDayLabel, { color: theme.colors.onSurfaceVariant }]}
              variant="labelMedium"
            >
              {wd}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.grid}>
          {days.map((day, idx) => {
            const isCurrent = isSameMonth(day, currentMonth);
            const isSel = parsedSelected ? isSameDay(day, parsedSelected) : false;
            const isTd = isToday(day);

            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => handleDayPress(day)}
                style={[
                  styles.dayCell,
                  isSel && { backgroundColor: theme.colors.primary },
                  isTd && !isSel && { borderWidth: 1, borderColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSel && { color: theme.colors.onPrimary, fontWeight: '700' },
                    !isCurrent && { color: theme.colors.onSurfaceVariant, opacity: 0.3 },
                    isCurrent && !isSel && { color: theme.colors.onSurface },
                  ]}
                  variant="bodyMedium"
                >
                  {format(day, 'd')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Footer Actions */}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  weekDayLabel: {
    width: 36,
    textAlign: 'center',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dayText: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
});
