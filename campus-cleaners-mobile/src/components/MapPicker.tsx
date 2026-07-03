import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { spacing, borderRadius } from "@/lib/theme";

type Coordinate = [number, number];

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
  onMapInteraction?: (interacting: boolean) => void;
}

const osmRasterStyle = {
  version: 8 as const,
  name: "OSM Raster",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
    },
  ],
};

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  height = 350,
  onMapInteraction,
}: MapPickerProps) {
  const theme = useTheme();
  const cameraRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = useState(16);

  const hasCoords = latitude !== null && longitude !== null;
  const center: Coordinate = hasCoords
    ? [longitude!, latitude!]
    : [-1.2825, 5.1154]; // University of Cape Coast (UCC) main campus center

  // Fly camera to new coordinates when latitude/longitude props change
  useEffect(() => {
    if (hasCoords && cameraRef.current) {
      cameraRef.current.flyTo({ center: [longitude!, latitude!], duration: 600 });
      setCurrentZoom(16);
    }
  }, [latitude, longitude, hasCoords]);

  const handleMapPress = (e: any) => {
    if (e?.geometry?.coordinates) {
      const [lng, lat] = e.geometry.coordinates;
      onLocationChange(lat, lng);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 19);
    setCurrentZoom(newZoom);
    if (cameraRef.current) {
      cameraRef.current.zoomTo(newZoom, { duration: 300 });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 5);
    setCurrentZoom(newZoom);
    if (cameraRef.current) {
      cameraRef.current.zoomTo(newZoom, { duration: 300 });
    }
  };

  return (
    <View 
      style={[styles.container, { height, borderRadius: borderRadius.lg, borderColor: theme.colors.outline }]}
      onTouchStart={() => onMapInteraction?.(true)}
      onTouchEnd={() => onMapInteraction?.(false)}
      onTouchCancel={() => onMapInteraction?.(false)}
    >
      <Map
        mapStyle={osmRasterStyle}
        style={styles.map}
        onPress={handleMapPress}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center,
            zoom: hasCoords ? 16 : 14,
          }}
        />

        {hasCoords && (
          <Marker
            id="location-marker"
            lngLat={[longitude!, latitude!]}
            anchor="bottom"
          >
            <View style={styles.markerWrapper}>
              <View style={[styles.markerPin, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.markerInner} />
              </View>
              <View style={styles.markerShadow} />
            </View>
          </Marker>
        )}
      </Map>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <Pressable
          style={[styles.zoomBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          onPress={handleZoomIn}
          accessibilityLabel="Zoom in"
        >
          <Text style={[styles.zoomBtnText, { color: theme.colors.onSurface }]}>＋</Text>
        </Pressable>
        <Pressable
          style={[styles.zoomBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          onPress={handleZoomOut}
          accessibilityLabel="Zoom out"
        >
          <Text style={[styles.zoomBtnText, { color: theme.colors.onSurface }]}>−</Text>
        </Pressable>
      </View>

      {/* Tap hint */}
      <View style={[styles.tapHint, { backgroundColor: theme.colors.surface + "E6" }]}>
        <Text style={[styles.tapHintText, { color: theme.colors.onSurface }]} variant="bodySmall">
          Tap the map to place or drag the pin to adjust
        </Text>
      </View>

      {/* Coordinate badge */}
      {hasCoords && (
        <View style={[styles.coordsBadge, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.coordsText, { color: theme.colors.primary }]} variant="labelSmall">
            {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
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
  map: {
    flex: 1,
  },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  markerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  markerShadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: -2,
  },
  zoomControls: {
    position: "absolute",
    right: 10,
    top: 10,
    gap: 6,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  zoomBtnText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  tapHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tapHintText: {
    fontSize: 11,
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
