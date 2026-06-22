import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '@/lib/theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 24,
  editable = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handlePress = (value: number) => {
    if (editable && onChange) {
      onChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Pressable
          key={star}
          onPress={() => handlePress(star)}
          disabled={!editable}
          hitSlop={8}
        >
          <Text style={[styles.star, { fontSize: size }]}>
            {star <= rating ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
      {showValue && (
        <Text style={styles.value} variant="bodySmall">
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: colors.star,
  },
  value: {
    color: colors.onSurfaceVariant,
    marginLeft: spacing.sm,
  },
});
