import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import {
  Text,
  SegmentedButtons,
  ProgressBar,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { colors, spacing, borderRadius } from "@/lib/theme";

export default function JobsListScreen() {
  "use no memo"; // Opt out: async document loading calls setState inside a useEffect
  const profile = useAuthStore((s) => s.profile);
  const cleanerProfile = useAuthStore((s) => s.cleanerProfile);
  const {
    activeBookings,
    pastBookings,
    availableJobs,
    isLoading,
    fetchCleanerJobs,
    fetchAvailableJobs,
  } = useBookingStore();
  const [tab, setTab] = useState("available");
  const theme = useTheme();

  const [documents, setDocuments] = useState<Record<string, string | null>>({
    ghana_card: null,
    selfie: null,
  });

  const loadDocuments = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from("cleaner_documents")
        .select("document_type, file_url")
        .eq("cleaner_id", profile.id);

      if (error) throw error;

      const docsMap: Record<string, string | null> = {
        ghana_card: null,
        selfie: null,
      };

      data?.forEach((doc) => {
        docsMap[doc.document_type] = doc.file_url;
      });

      setDocuments(docsMap);
    } catch (err) {
      console.error("Error loading documents in jobs screen:", err);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchCleanerJobs(profile.id);
      fetchAvailableJobs();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (isLoading) return <LoadingScreen message="Loading jobs..." />;

  // Calculate Profile Completion Percentage (15% per section, 10% for selfie)
  const hasPhoto = !!profile?.avatar_url;
  const hasBio = !!cleanerProfile?.bio?.trim();
  const hasMomo = !!cleanerProfile?.mobile_money_number?.trim();
  const hasSkills = !!(
    cleanerProfile?.skills && cleanerProfile.skills.length > 0
  );
  const hasGuarantor = !!(
    cleanerProfile?.guarantor_name?.trim() &&
    cleanerProfile?.guarantor_phone?.trim()
  );
  const hasGhanaCard = !!documents.ghana_card;
  const hasSelfie = !!documents.selfie;

  let completionPct = 0;
  if (hasPhoto) completionPct += 15;
  if (hasBio) completionPct += 15;
  if (hasMomo) completionPct += 15;
  if (hasSkills) completionPct += 15;
  if (hasGuarantor) completionPct += 15;
  if (hasGhanaCard) completionPct += 15;
  if (hasSelfie) completionPct += 10;

  const isProfileIncomplete = completionPct < 100;
  const verificationStatus = cleanerProfile?.verification_status ?? "pending";
  const isApproved = verificationStatus === "approved";

  const dataMap: Record<string, typeof availableJobs> = {
    available: availableJobs,
    active: activeBookings,
    completed: pastBookings,
  };

  const renderProfileBanner = () => {
    if (isProfileIncomplete) {
      return (
        <Pressable
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => router.push("/(cleaner)/profile")}
        >
          <View style={styles.bannerLeft}>
            <Text
              style={[
                styles.bannerTitle,
                { color: theme.colors.onPrimaryContainer },
              ]}
              variant="labelLarge"
            >
              ⚠️ Profile {completionPct}% complete
            </Text>
            <Text
              style={[
                styles.bannerSub,
                { color: theme.colors.onPrimaryContainer },
              ]}
              variant="bodySmall"
            >
              Complete your profile to start accepting jobs → Tap to finish
            </Text>
            <ProgressBar
              progress={completionPct / 100}
              color={theme.colors.primary}
              style={styles.bannerProgress}
            />
          </View>
        </Pressable>
      );
    }

    if (!isApproved) {
      return (
        <View
          style={[
            styles.banner,
            {
              backgroundColor:
                verificationStatus === "rejected"
                  ? theme.colors.errorContainer
                  : theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <Text
            style={[styles.bannerTitle, { color: theme.colors.onSurface }]}
            variant="labelLarge"
          >
            {verificationStatus === "rejected"
              ? "❌  Verification Rejected"
              : "⏳  Awaiting Admin Verification"}
          </Text>
          <Text
            style={[styles.bannerSub, { color: theme.colors.onSurfaceVariant }]}
            variant="bodySmall"
          >
            {verificationStatus === "rejected"
              ? "Update your profile details — Tap Profile tab to fix"
              : "Your profile is under review. You'll be notified when approved."}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderAvailableJobsTab = () => (
    <FlatList
      data={availableJobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BookingCard
          booking={item}
          userRole="cleaner"
          onPress={() => router.push(`/(cleaner)/jobs/${item.id}`)}
        />
      )}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState icon="📭" title="No new jobs available" />
      }
    />
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Compact profile/verification banner shown above tabs */}
      {renderProfileBanner()}

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          {
            value: "available",
            label: `New (${isApproved && !isProfileIncomplete ? availableJobs.length : "—"})`,
            style: styles.segBtn,
          },
          {
            value: "active",
            label: `Active (${activeBookings.length})`,
            style: styles.segBtn,
          },
          {
            value: "completed",
            label: `Done (${pastBookings.length})`,
            style: styles.segBtn,
          },
        ]}
        style={styles.segment}
        theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
      />

      {tab === "available" ? (
        isProfileIncomplete || !isApproved ? (
          <EmptyState
            icon={isProfileIncomplete ? "📋" : "⏳"}
            title={
              isProfileIncomplete
                ? "Finish your profile to see jobs"
                : "Waiting for admin approval"
            }
            subtitle={
              isProfileIncomplete
                ? "Tap the banner above to complete your profile"
                : "You will be notified once approved"
            }
          />
        ) : (
          renderAvailableJobsTab()
        )
      ) : (
        <FlatList
          data={dataMap[tab]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              userRole="cleaner"
              onPress={() => router.push(`/(cleaner)/jobs/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={tab === "active" ? "🔧" : "✅"}
              title={
                tab === "active" ? "No active jobs" : "No completed jobs yet"
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { marginHorizontal: spacing.lg, marginVertical: spacing.md },
  segBtn: { borderColor: colors.outline },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  // Compact banner
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  bannerLeft: { gap: spacing.xs },
  bannerTitle: { fontWeight: "700" },
  bannerSub: { lineHeight: 18 },
  bannerProgress: { height: 6, borderRadius: 3, marginTop: spacing.xs },
});
