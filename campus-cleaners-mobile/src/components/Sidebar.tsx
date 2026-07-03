import React, { useState } from "react";
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Alert } from "react-native";
import { Text, Avatar, Divider, useTheme } from "react-native-paper";
import { router, usePathname } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { colors, spacing, borderRadius } from "@/lib/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "@/lib/supabase";

type UserRole = "client" | "cleaner";

interface NavItem {
  label: string;
  icon: string;
  href: string;
  role?: UserRole;
}

const CLIENT_NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "home", href: "/(client)/home" },
  { label: "Book Service", icon: "plus-circle", href: "/(client)/book" },
  { label: "My Bookings", icon: "clipboard-list", href: "/(client)/bookings" },
  { label: "Messages", icon: "chat", href: "/(client)/messages" },
  { label: "Profile", icon: "account", href: "/(client)/profile" },
  { label: "Location Settings", icon: "map-marker", href: "/(client)/settings/location" },
  { label: "Help & Feedback", icon: "help-circle", href: "/(client)/help" },
];

const CLEANER_NAV_ITEMS: NavItem[] = [
  { label: "Jobs", icon: "briefcase", href: "/(cleaner)/jobs" },
  { label: "Messages", icon: "chat", href: "/(cleaner)/messages" },
  { label: "Earnings", icon: "cash", href: "/(cleaner)/earnings" },
  { label: "Profile", icon: "account", href: "/(cleaner)/profile" },
  { label: "Help & Feedback", icon: "help-circle", href: "/(cleaner)/help" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const theme = useTheme();
  const { profile, signOut, fetchProfile } = useAuthStore();
  const currentPath = usePathname();

  const navItems = userRole === "client" ? CLIENT_NAV_ITEMS : CLEANER_NAV_ITEMS;

  const [anim] = useState(() => new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOpen, anim]);

  const handleNavPress = (href: string) => {
    router.replace(href as any);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
    onClose();
  };

  const handleSwitchRole = async () => {
    if (!profile?.id) return;
    const newRole = userRole === "client" ? "cleaner" : "client";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profile.id);

      if (error) throw error;

      if (newRole === "cleaner") {
        await supabase
          .from("cleaner_profiles")
          .upsert({ user_id: profile.id });
      }

      await fetchProfile();
      onClose();
      
      if (newRole === "cleaner") {
        router.replace("/(cleaner)/jobs");
      } else {
        router.replace("/(client)/home");
      }
    } catch (err) {
      console.error("Error switching role:", err);
      Alert.alert("Error", "Failed to switch roles. Please try again.");
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "User";
  const roleLabel = userRole === "client" ? "🏠 Client" : "🧹 Cleaner";

  const isNavActive = (href: string) => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(href + "/");
  };

  return (
    <>
      {/* Overlay backdrop — only rendered when open */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={onClose} accessibilityRole="button">
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Drawer panel */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.surface,
            borderRightColor: theme.colors.outline,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.drawerHeader, { backgroundColor: theme.colors.primaryContainer, borderBottomColor: theme.colors.outline }]}>
          <Avatar.Text
            size={56}
            label={firstName.charAt(0)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            color={colors.white}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: theme.colors.onSurface }]} variant="titleMedium">
              {profile?.full_name ?? firstName}
            </Text>
            <Text style={[styles.userRole, { color: theme.colors.primary }]} variant="bodySmall">
              {roleLabel}
            </Text>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

        <View style={styles.navList}>
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <TouchableWithoutFeedback
                key={item.href}
                onPress={() => handleNavPress(item.href)}
              >
                <View
                  style={[
                    styles.navItem,
                    active && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    style={styles.navIcon}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      { color: active ? theme.colors.primary : theme.colors.onSurface },
                      active && { fontWeight: "600" },
                    ]}
                    variant="bodyMedium"
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>

        {profile?.registered_as_client && profile?.registered_as_cleaner && (
          <>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <TouchableWithoutFeedback onPress={handleSwitchRole}>
              <View style={styles.switchRoleItem}>
                <MaterialCommunityIcons
                  name={"swap-horizontal" as any}
                  size={24}
                  color={theme.colors.primary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: theme.colors.primary, fontWeight: "600" }]} variant="bodyMedium">
                  {userRole === "client" ? "Switch to Cleaner Mode" : "Switch to Client Mode"}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </>
        )}

        <TouchableWithoutFeedback onPress={handleSignOut}>
          <View style={styles.signOutItem}>
            <MaterialCommunityIcons
              name={"logout" as any}
              size={24}
              color={theme.colors.error}
              style={styles.navIcon}
            />
            <Text style={[styles.navLabel, { color: theme.colors.error }]} variant="bodyMedium">
              Sign Out
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <View style={[styles.versionInfo, { borderTopColor: theme.colors.outline }]}>
          <Text style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
            Campus Cleaners v1.0.0
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 90,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 100,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.xl + 20, // Account for status bar
    borderBottomWidth: 1,
  },
  avatar: {
    // backgroundColor set inline
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontWeight: "700",
  },
  userRole: {
    fontWeight: "500",
  },
  divider: {
    marginHorizontal: spacing.md,
  },
  navList: {
    flex: 1,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  navIcon: {
    width: 28,
    textAlign: "center",
  },
  navLabel: {
    fontSize: 16,
  },
  switchRoleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  signOutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
  },
  versionInfo: {
    padding: spacing.lg,
    alignItems: "center",
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 12,
  },
});