import React, { useState } from "react";
import { View, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { Text, Avatar, Divider, useTheme } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { colors, spacing, borderRadius } from "@/lib/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

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
];

const CLEANER_NAV_ITEMS: NavItem[] = [
  { label: "Jobs", icon: "briefcase", href: "/(cleaner)/jobs" },
  { label: "Messages", icon: "chat", href: "/(cleaner)/messages" },
  { label: "Earnings", icon: "cash", href: "/(cleaner)/earnings" },
  { label: "Profile", icon: "account", href: "/(cleaner)/profile" },
  { label: "Location Settings", icon: "map-marker", href: "/(cleaner)/settings/location" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const theme = useTheme();
  const { profile, signOut } = useAuthStore();
  const { pathname } = useLocalSearchParams();
  const currentPath = pathname as string;

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

  const firstName = profile?.full_name?.split(" ")[0] ?? "User";
  const roleLabel = userRole === "client" ? "🏠 Client" : "🧹 Cleaner";

  return (
    <>
      <Pressable
        style={[
          styles.overlay,
          {
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
        onPress={onClose}
        accessibilityRole="button"
      />
      <Animated.View
        style={[
          styles.drawer,
          {
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
        <View style={styles.drawerHeader}>
          <Avatar.Text
            size={56}
            label={firstName.charAt(0)}
            style={styles.avatar}
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
            const isActive = currentPath === item.href;
            return (
              <Pressable
                key={item.href}
                style={[
                  styles.navItem,
                  isActive && styles.navItemActive,
                  { backgroundColor: isActive ? theme.colors.primaryContainer : "transparent" },
                ]}
                onPress={() => handleNavPress(item.href)}
                android_ripple={{ color: theme.colors.primary + "20" }}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? theme.colors.primary : theme.colors.onSurface },
                    isActive && { fontWeight: "600" },
                  ]}
                  variant="bodyMedium"
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

        <Pressable
          style={styles.signOutItem}
          onPress={handleSignOut}
          android_ripple={{ color: theme.colors.error + "20" }}
        >
          <MaterialCommunityIcons
            name="logout" as any
            size={24}
            color={theme.colors.error}
            style={styles.navIcon}
          />
          <Text style={[styles.navLabel, { color: theme.colors.error }]} variant="bodyMedium">
            Sign Out
          </Text>
        </Pressable>

        <View style={styles.versionInfo}>
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
    backgroundColor: colors.black,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.outline,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.xl + 20, // Account for status bar
    backgroundColor: colors.primaryContainer,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  avatar: {
    backgroundColor: colors.primary,
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
  navItemActive: {
    // backgroundColor handled inline
  },
  navIcon: {
    width: 28,
    textAlign: "center",
  },
  navLabel: {
    fontSize: 16,
  },
  signOutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  versionInfo: {
    padding: spacing.lg,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  versionText: {
    fontSize: 12,
  },
});