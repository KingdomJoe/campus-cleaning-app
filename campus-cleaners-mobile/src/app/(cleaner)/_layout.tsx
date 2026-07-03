import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Sidebar from "@/components/Sidebar";
import { useSidebarStore } from "@/stores/sidebarStore";
import { router } from "expo-router";

export default function CleanerLayout() {
  const theme = useTheme();
  const sidebar = useSidebarStore();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: "600" },
          headerLeft: () => (
            <Pressable
              onPress={() => useSidebarStore.getState().open()}
              style={{ marginLeft: 12, padding: 8 }}
              accessibilityLabel="Open menu"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="menu"
                size={28}
                color={theme.colors.onSurface}
              />
            </Pressable>
          ),
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: "Earnings",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
          }}
        />
        <Tabs.Screen
          name="settings/location"
          options={{
            href: null,
            title: "Location Settings",
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                style={{ marginLeft: 12, padding: 8 }}
                accessibilityLabel="Go back"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={theme.colors.onSurface}
                />
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            href: null,
            title: "Help & Feedback",
          }}
        />
      </Tabs>

      {/* Sidebar rendered as absolute overlay on top of tabs */}
      <Sidebar
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        userRole="cleaner"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});