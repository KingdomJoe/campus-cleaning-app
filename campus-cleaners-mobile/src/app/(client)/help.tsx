import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { Text, Card, Button, TextInput, useTheme, List } from "react-native-paper";
import { useAuthStore } from "@/stores/authStore";
import { spacing, borderRadius, colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export default function HelpScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const [category, setCategory] = useState<"bug" | "suggestion" | "question" | "praise" | "other">("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert("Input Required", "Please enter your feedback message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedbacks").insert({
        user_id: profile?.id || null,
        category,
        message: message.trim(),
      });

      if (error) throw error;

      Alert.alert("Thank You! ❤️", "Your feedback has been submitted successfully to our team.");
      setMessage("");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      Alert.alert("Error", "Could not submit feedback. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* About Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content style={styles.aboutContent}>
          <Text style={[styles.title, { color: theme.colors.primary }]} variant="titleMedium">
            🏫 Uber for Cleaning UCC
          </Text>
          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
            An on-demand campus cleaning services portal designed exclusively for the University of Cape Coast. Connecting students with verified student cleaners to provide high-quality room cleaning and laundry services.
          </Text>
        </Card.Content>
      </Card>

      {/* FAQs Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]} variant="titleMedium">
        💡 Frequently Asked Questions
      </Text>

      <List.Section style={styles.faqSection}>
        <List.Accordion
          title="How do I book a cleaning?"
          left={(props) => <List.Icon {...props} icon="plus-circle-outline" />}
          theme={{ colors: { primary: theme.colors.primary } }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            titleNumberOfLines={4}
            title="Go to 'Book Service' from the sidebar menu, select cleaning, pin your room on the map, set date/time, and request. Cleaners nearby will receive it and bid."
          />
        </List.Accordion>

        <List.Accordion
          title="How do payments & escrow work?"
          left={(props) => <List.Icon {...props} icon="shield-check-outline" />}
          theme={{ colors: { primary: theme.colors.primary } }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            titleNumberOfLines={4}
            title="When you hire a cleaner, your payment is held securely in escrow. It is only released to the cleaner once you verify the completion of the job."
          />
        </List.Accordion>

        <List.Accordion
          title="How do I select my cleaner?"
          left={(props) => <List.Icon {...props} icon="account-multiple-outline" />}
          theme={{ colors: { primary: theme.colors.primary } }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            titleNumberOfLines={4}
            title="Review pending cleaner bids in 'My Bookings'. You can view their profile ratings, bios, and choose the cleaner that best fits your requirements."
          />
        </List.Accordion>

        <List.Accordion
          title="What if the cleaner doesn't show up?"
          left={(props) => <List.Icon {...props} icon="alert-circle-outline" />}
          theme={{ colors: { primary: theme.colors.primary } }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            titleNumberOfLines={4}
            title="You can cancel the booking inside the booking details page or raise a dispute. Disputed payments are manually audited by the campus support admin."
          />
        </List.Accordion>
      </List.Section>

      {/* Feedback Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]} variant="titleMedium">
        📝 Send Us Feedback
      </Text>
      
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content style={styles.formContent}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
            Choose Category
          </Text>
          <View style={styles.categoryRow}>
            {(["bug", "suggestion", "question", "praise"] as const).map((cat) => {
              const active = category === cat;
              const emojiMap = { bug: "🐛 Bug", suggestion: "💡 Idea", question: "❓ Help", praise: "❤️ Praise" };
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catBtn,
                    active && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                  ]}
                >
                  <Text style={[styles.catText, active && { color: "#FFF", fontWeight: "600" }]} variant="bodySmall">
                    {emojiMap[cat]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            label="Message"
            placeholder="Type your suggestion, bug report, or questions here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <Button
            mode="contained"
            onPress={handleSubmitFeedback}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
            textColor="#FFF"
          >
            Submit Feedback
          </Button>
        </Card.Content>
      </Card>
      
      <Button
        mode="text"
        onPress={() => router.replace("/(client)/home" as any)}
        textColor={theme.colors.primary}
        style={styles.homeBtn}
      >
        ← Go Back to Home
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  aboutContent: {
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
  },
  description: {
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  faqSection: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  formContent: {
    gap: spacing.md,
  },
  label: {
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  catBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: "transparent",
  },
  catText: {
    color: colors.onSurface,
  },
  input: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    borderRadius: 8,
  },
  homeBtn: {
    marginTop: spacing.md,
  },
});
