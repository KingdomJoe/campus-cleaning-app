import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Sidebar from "@/components/Sidebar";

export default function CleanerLayout() {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: "600" },
          headerLeft: () => (
            <Pressable
              onPress={() => setSidebarOpen(true)}
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
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="briefcase" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: "Earnings",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cash" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings/location"
          options={{
            href: null,
            title: "Location Settings",
          }}
        />
      </Tabs>

      {/* Sidebar rendered as absolute overlay on top of tabs */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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