import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Modal, Text, Chip, TextInput, Button, useTheme } from 'react-native-paper';
import { spacing, borderRadius } from '@/lib/theme';

interface SuggestiveNotesModalProps {
  visible: boolean;
  onDismiss: () => void;
  onApplyNotes: (notes: string) => void;
  serviceCategory: 'cleaning' | 'laundry' | null;
  initialNotes?: string;
}

const CLEANING_TEMPLATES = [
  'Please focus on deep cleaning the bathroom.',
  'I will leave the key under the doormat.',
  'Please clean dust under the bed and desk.',
  'Need cleaning completed before 5:00 PM.',
  'Please sweep the balcony/outer porch.',
  'Friendly dog/pet in the room, please be aware.'
];

const LAUNDRY_TEMPLATES = [
  'Please separate white clothes from colors.',
  'Use mild/gentle detergent if possible.',
  'No tumble dry for delicate woolen clothes.',
  'Please fold everything, no hangers needed.',
  'Wash bedsheets and towels separately.',
  'Please treat the coffee stain on the white shirt.'
];

export default function SuggestiveNotesModal({
  visible,
  onDismiss,
  onApplyNotes,
  serviceCategory,
  initialNotes = '',
}: SuggestiveNotesModalProps) {
  const theme = useTheme();
  const [customText, setCustomText] = useState(initialNotes);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const templates = serviceCategory === 'laundry' ? LAUNDRY_TEMPLATES : CLEANING_TEMPLATES;

  const toggleTemplate = (template: string) => {
    setSelectedTemplates((prev) => {
      if (prev.includes(template)) {
        return prev.filter((t) => t !== template);
      } else {
        return [...prev, template];
      }
    });
  };

  const handleApply = () => {
    const combined = [
      ...selectedTemplates,
      ...(customText.trim() ? [customText.trim()] : [])
    ].join(' ');
    onApplyNotes(combined);
    onDismiss();
  };

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
          Additional Notes Suggestions
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
          Tap chips to quickly add special instructions:
        </Text>

        <ScrollView style={styles.templatesScroll} contentContainerStyle={styles.chipsRow}>
          {templates.map((template) => {
            const isSel = selectedTemplates.includes(template);
            return (
              <Chip
                key={template}
                selected={isSel}
                onPress={() => toggleTemplate(template)}
                style={[
                  styles.chip,
                  isSel && { backgroundColor: theme.colors.primary },
                ]}
                textStyle={[
                  styles.chipText,
                  isSel && { color: theme.colors.onPrimary },
                  !isSel && { color: theme.colors.onSurface },
                ]}
                showSelectedOverlay
                showSelectedCheck={false}
              >
                {template}
              </Chip>
            );
          })}
        </ScrollView>

        <TextInput
          label="Custom Notes / Additions"
          value={customText}
          onChangeText={setCustomText}
          mode="outlined"
          multiline
          numberOfLines={2}
          placeholder="Type any other instructions..."
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <View style={styles.footer}>
          <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleApply} buttonColor={theme.colors.primary}>
            Apply Notes
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
    maxHeight: '80%',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  templatesScroll: {
    maxHeight: 180,
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
});
