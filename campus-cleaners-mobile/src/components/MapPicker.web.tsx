import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { spacing, borderRadius } from "@/lib/theme";

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
  onMapInteraction?: (interacting: boolean) => void;
}

/**
 * Web fallback for MapPicker.
 * @maplibre/maplibre-react-native is native-only and crashes on web,
 * so we render a simple coordinate input form instead.
 */
export default function MapPickerWeb({
  latitude,
  longitude,
  onLocationChange,
  height = 350,
}: MapPickerProps) {
  const theme = useTheme();
  const [latStr, setLatStr] = useState(latitude?.toString() ?? "5.1154");
  const [lngStr, setLngStr] = useState(longitude?.toString() ?? "-1.2825");

  const handleApply = () => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange(lat, lng);
    }
  };

  const hasCoords = latitude !== null && longitude !== null;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius: borderRadius.lg,
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      {/* Map placeholder */}
      <View style={styles.placeholder}>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 40 }}>🗺️</Text>
        <Text
          style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
          variant="bodyMedium"
        >
          Map preview is only available on mobile
        </Text>
        <Text
          style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}
          variant="bodySmall"
        >
          Enter coordinates manually below
        </Text>
      </View>

      {/* Coordinate inputs */}
      <View style={styles.inputRow}>
        <TextInput
          label="Latitude"
          value={latStr}
          onChangeText={setLatStr}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          dense
        />
        <TextInput
          label="Longitude"
          value={lngStr}
          onChangeText={setLngStr}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          dense
        />
        <Pressable
          onPress={handleApply}
          style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>Set</Text>
        </Pressable>
      </View>

      {/* Current coordinate badge */}
      {hasCoords && (
        <View
          style={[
            styles.coordsBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            style={[styles.coordsText, { color: theme.colors.primary }]}
            variant="labelSmall"
          >
            📍 {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
  },
  applyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  coordsBadge: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: 12,
  },
  coordsText: {
    fontWeight: "600",
    fontSize: 10,
  },
});
