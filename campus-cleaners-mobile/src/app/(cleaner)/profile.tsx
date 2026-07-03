import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import {
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  Chip,
  Switch,
  useTheme,
  ProgressBar,
  TextInput,
} from "react-native-paper";

const PaperText = Text;
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import StarRating from "@/components/StarRating";
import { colors, spacing, borderRadius } from "@/lib/theme";
import { useThemeStore } from "@/stores/themeStore";
import {
  pickImage,
  takePhoto,
  uploadAvatar,
  uploadDocument,
} from "@/lib/api/uploads";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";

const verificationStatusConfig = {
  pending: { label: "Pending Verification", color: colors.warning, icon: "⏳" },
  approved: { label: "Verified", color: colors.success, icon: "✅" },
  rejected: { label: "Rejected", color: colors.error, icon: "❌" },
};

const SKILL_OPTIONS = ["General cleaning", "Deep cleaning", "Laundry"];
const UCC_AREAS = [
  "Amamoma",
  "Kwaprow",
  "Apewosika",
  "Kokoado",
  "Duakor",
  "UCC Main Campus",
  "Science",
  "Valco Flat"
];

export default function CleanerProfileScreen() {
  "use no memo"; // Opt out: form-sync effects and async document loading call setState in effects
  const { profile, cleanerProfile, signOut, fetchProfile, profileLoading } = useAuthStore();
  const { themeMode, toggleTheme } = useThemeStore();
  const theme = useTheme();

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <PaperText style={styles.loadingText} variant="bodyMedium">
          Loading profile...
        </PaperText>
      </View>
    );
  }

  // Edit Mode States (Work Details)
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(cleanerProfile?.bio ?? "");
  const [momo, setMomo] = useState(cleanerProfile?.mobile_money_number ?? "");
  const [guarantorName, setGuarantorName] = useState(
    cleanerProfile?.guarantor_name ?? "",
  );
  const [guarantorPhone, setGuarantorPhone] = useState(
    cleanerProfile?.guarantor_phone ?? "",
  );
  const [skills, setSkills] = useState<string[]>(cleanerProfile?.skills ?? []);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  // Edit Mode States (Personal Info & Neighborhood Location)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [locationStr, setLocationStr] = useState(profile?.location ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sync personal info state with store profile updates
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(profile.full_name ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhone(profile.phone ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(profile.email ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationStr(profile.location ?? "");
    }
  }, [profile]);

  // Sync state with store profile updates
  useEffect(() => {
    if (cleanerProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBio(cleanerProfile.bio ?? "");
      setMomo(cleanerProfile.mobile_money_number ?? "");
      setGuarantorName(cleanerProfile.guarantor_name ?? "");
      setGuarantorPhone(cleanerProfile.guarantor_phone ?? "");
      setSkills(cleanerProfile.skills ?? []);
    }
  }, [cleanerProfile]);

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
      console.error("Error loading documents:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const checkAndAutoPending = async (updatedDocs: typeof documents) => {
    if (!profile?.id || !cleanerProfile) return;

    const willHavePhoto = !!profile.avatar_url;
    const willHaveBio = !!cleanerProfile.bio?.trim();
    const willHaveMomo = !!cleanerProfile.mobile_money_number?.trim();
    const willHaveSkills =
      cleanerProfile.skills && cleanerProfile.skills.length > 0;
    const willHaveGuarantor = !!(
      cleanerProfile.guarantor_name?.trim() &&
      cleanerProfile.guarantor_phone?.trim()
    );
    const willHaveGhanaCard = !!updatedDocs.ghana_card;
    const willHaveSelfie = !!updatedDocs.selfie;

    let pct = 0;
    if (willHavePhoto) pct += 15;
    if (willHaveBio) pct += 15;
    if (willHaveMomo) pct += 15;
    if (willHaveSkills) pct += 15;
    if (willHaveGuarantor) pct += 15;
    if (willHaveGhanaCard) pct += 15;
    if (willHaveSelfie) pct += 10;

    if (
      pct === 100 &&
      cleanerProfile.verification_status !== "approved" &&
      cleanerProfile.verification_status !== "pending"
    ) {
      await supabase
        .from("cleaner_profiles")
        .update({ verification_status: "pending" })
        .eq("user_id", profile.id);
      await fetchProfile();
    }
  };

  const handleUploadDoc = async (type: "ghana_card" | "selfie") => {
    if (!profile?.id) return;
    try {
      const uri =
        type === "selfie"
          ? await takePhoto({ aspect: [1, 1], quality: 0.8 })
          : await pickImage({ aspect: [4, 3], quality: 0.8 });

      if (!uri) return;

      setIsUploadingPhoto(true);
      const publicUrl = await uploadDocument(profile.id, type, uri);
      if (publicUrl) {
        const updatedDocs = { ...documents, [type]: publicUrl };
        setDocuments(updatedDocs);
        Alert.alert(
          "Success",
          `${type.replace("_", " ")} uploaded successfully!`,
        );
        await checkAndAutoPending(updatedDocs);
      } else {
        Alert.alert("Error", "Failed to upload document.");
      }
    } catch (err) {
      console.error("Document upload error:", err);
      Alert.alert("Error", "Failed to upload document.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
  };

  // Completion Gauge Calculation
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

  const verificationStatus =
    completionPct < 100
      ? { label: "Incomplete Profile", color: colors.warning, icon: "⚠️" }
      : verificationStatusConfig[
          cleanerProfile?.verification_status ?? "pending"
        ];

  const handlePickAvatar = async () => {
    if (!profile?.id) return;
    try {
      const uri = await pickImage({ aspect: [1, 1] });
      if (!uri) return;

      setIsUploadingPhoto(true);
      const publicUrl = await uploadAvatar(profile.id, uri);
      if (publicUrl) {
        await fetchProfile();
        showToast('Profile photo updated successfully!', 'success');
      } else {
        showToast('Could not upload photo. Check network and try again.', 'error');
      }
    } catch (err) {
      console.error("Photo picker error:", err);
      showToast('Failed to update profile photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!profile?.id) {
      showToast('Profile not loaded. Please wait...', 'error');
      return;
    }
    setIsSaving(true);

    try {
      // Validate phone formatting if entered
      let formattedGuarantorPhone = "";
      if (guarantorPhone.trim()) {
        const cleaned = guarantorPhone.replace(/[^\d+]/g, "");
        formattedGuarantorPhone = cleaned.startsWith("+")
          ? cleaned
          : `+233${cleaned.replace(/^0/, "")}`;
        const ghanaPhoneRegex = /^\+233\d{9}$/;
        if (!ghanaPhoneRegex.test(formattedGuarantorPhone)) {
          showToast('Please enter a valid Ghana phone number for your guarantor.', 'error');
          setIsSaving(false);
          return;
        }
      }

      // Calculate mock completion percentage with local edits to decide if status goes to pending
      const willHavePhoto = !!profile.avatar_url;
      const willHaveBio = !!bio.trim();
      const willHaveMomo = !!momo.trim();
      const willHaveSkills = skills.length > 0;
      const willHaveGuarantor = !!(
        guarantorName.trim() && formattedGuarantorPhone.trim()
      );
      const willHaveGhanaCard = !!documents.ghana_card;
      const willHaveSelfie = !!documents.selfie;

      let newPct = 0;
      if (willHavePhoto) newPct += 15;
      if (willHaveBio) newPct += 15;
      if (willHaveMomo) newPct += 15;
      if (willHaveSkills) newPct += 15;
      if (willHaveGuarantor) newPct += 15;
      if (willHaveGhanaCard) newPct += 15;
      if (willHaveSelfie) newPct += 10;

      // Auto-transition to pending review if 100% complete and not already approved
      const autoPending =
        newPct === 100 && cleanerProfile?.verification_status !== "approved";

      const { error } = await supabase
        .from("cleaner_profiles")
        .update({
          bio: bio.trim(),
          mobile_money_number: momo.trim(),
          guarantor_name: guarantorName.trim(),
          guarantor_phone: formattedGuarantorPhone,
          skills: skills,
          ...(autoPending ? { verification_status: "pending" } : {}),
        })
        .eq("user_id", profile.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      console.error("Error saving profile details:", err);
      showToast(err.message || 'Failed to save profile changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!profile?.id) {
      showToast('Profile not loaded. Please wait...', 'error');
      return;
    }
    if (!fullName.trim()) {
      showToast('Full Name is required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      // Clean, format, and validate phone if entered
      let formattedPhone = phone.trim();
      if (formattedPhone) {
        const cleaned = formattedPhone.replace(/[^\d+]/g, "");
        formattedPhone = cleaned.startsWith("+")
          ? cleaned
          : `+233${cleaned.replace(/^0/, "")}`;
        const ghanaPhoneRegex = /^\+233\d{9}$/;
        if (!ghanaPhoneRegex.test(formattedPhone)) {
          showToast('Please enter a valid Ghana mobile number (e.g. 024 123 4567).', 'error');
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: formattedPhone || null,
          email: email.trim() || null,
          location: locationStr.trim() || null,
        } as any)
        .eq("id", profile.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditingPersonal(false);
      showToast('Personal details updated successfully!', 'success');
    } catch (err: any) {
      console.error("Error saving personal details:", err);
      showToast(err.message || 'Failed to save personal details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Photo & Basic Header */}
      <View style={styles.header}>
        <Pressable onPress={handlePickAvatar} disabled={isUploadingPhoto}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Avatar.Image
                size={96}
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={96}
                label={profile?.full_name?.charAt(0) ?? "?"}
                style={styles.avatar}
                color={colors.white}
              />
            )}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </View>
        </Pressable>

        {isUploadingPhoto && (
          <Text
            style={{ color: theme.colors.primary, marginTop: 4, fontSize: 12 }}
          >
            Uploading photo...
          </Text>
        )}

<PaperText
           style={[styles.name, { color: theme.colors.onBackground }]}
           variant="headlineSmall"
         >
           {profile?.full_name ?? "Cleaner"}
         </PaperText>
        <PaperText style={styles.role} variant="bodyMedium">
          🧹 Cleaner
        </PaperText>

        {/* Verification Status Badge */}
        <Chip
          icon={() => <Text>{verificationStatus.icon}</Text>}
          style={[
            styles.verificationChip,
            { borderColor: verificationStatus.color },
          ]}
          textStyle={{
            color: verificationStatus.color,
            fontWeight: "600",
            fontSize: 12,
          }}
          mode="outlined"
        >
          {verificationStatus.label}
        </Chip>

        {/* Rating */}
        {cleanerProfile &&
          cleanerProfile.avg_rating !== null &&
          cleanerProfile.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating
                rating={cleanerProfile.avg_rating}
                showValue
                size={20}
              />
<PaperText
             style={[
               styles.jobCount,
               { color: theme.colors.onSurfaceVariant },
             ]}
             variant="bodySmall"
           >
             ({cleanerProfile.total_jobs} job
             {cleanerProfile.total_jobs !== 1 ? "s" : ""})
           </PaperText>
            </View>
          )}
      </View>

      {/* Completion Gauge Card */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.gaugeHeader}>
            <PaperText
              variant="titleMedium"
              style={{ fontWeight: "700", color: theme.colors.onSurface }}
            >
              Profile Completion
            </PaperText>
            <PaperText
              variant="titleMedium"
              style={{ fontWeight: "700", color: theme.colors.primary }}
            >
              {completionPct}%
            </PaperText>
          </View>
          <ProgressBar
            progress={completionPct / 100}
            color={
              completionPct === 100
                ? theme.colors.primary
                : theme.colors.secondary
            }
            style={styles.progressBar}
          />

          <View style={styles.checklist}>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasPhoto ? "✅" : "❌"} Profile Photo
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasBio ? "✅" : "❌"} Short Bio
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasMomo ? "✅" : "❌"} Mobile Money Number
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasSkills ? "✅" : "❌"} Professional Skills
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasGuarantor ? "✅" : "❌"} Guarantor Details
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasGhanaCard ? "✅" : "❌"} Ghana Card (National ID)
            </PaperText>
            <PaperText
              style={[
                styles.checkItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodySmall"
            >
              {hasSelfie ? "✅" : "❌"} Selfie Verification
            </PaperText>
          </View>
        </Card.Content>
      </Card>

      {/* Personal Info */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <PaperText
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
              variant="labelLarge"
            >
              Personal Information
            </PaperText>
            {!isEditingPersonal && (
              <Button
                mode="text"
                compact
                onPress={() => setIsEditingPersonal(true)}
                textColor={theme.colors.primary}
              >
                Edit Details
              </Button>
            )}
          </View>
          <Divider
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />

          {isEditingPersonal ? (
            <View style={styles.editForm}>
              <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <TextInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel} variant="labelSmall">
                Area / Neighborhood (Cape Coast)
              </Text>
              <View style={styles.chipEditRow}>
                {UCC_AREAS.map((area) => (
                  <Chip
                    key={area}
                    selected={locationStr === area}
                    onPress={() => setLocationStr(area)}
                    style={[
                      styles.skillChipEdit,
                      locationStr === area && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                    textStyle={{
                      color: locationStr === area
                        ? colors.white
                        : theme.colors.onSurfaceVariant,
                    }}
                    showSelectedCheck={false}
                    compact
                  >
                    {area}
                  </Chip>
                ))}
                <Chip
                  selected={!UCC_AREAS.includes(locationStr) && locationStr.length > 0}
                  onPress={() => setLocationStr("")}
                  style={[
                    styles.skillChipEdit,
                    !UCC_AREAS.includes(locationStr) && locationStr.length > 0 && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  textStyle={{
                    color: !UCC_AREAS.includes(locationStr) && locationStr.length > 0
                      ? colors.white
                      : theme.colors.onSurfaceVariant,
                  }}
                  showSelectedCheck={false}
                  compact
                >
                  Other (Type manually)
                </Chip>
              </View>

              {(!UCC_AREAS.includes(locationStr) || locationStr === "") && (
                <TextInput
                  label="Enter neighborhood manually"
                  value={locationStr}
                  onChangeText={setLocationStr}
                  mode="outlined"
                  dense
                  placeholder="e.g. Kakumdo"
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  style={styles.textInput}
                />
              )}

              <View style={styles.editActionRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsEditingPersonal(false);
                    // Reset fields to current profile values
                    setFullName(profile?.full_name ?? "");
                    setPhone(profile?.phone ?? "");
                    setEmail(profile?.email ?? "");
                    setLocationStr(profile?.location ?? "");
                  }}
                  disabled={isSaving}
                  textColor={theme.colors.outline}
                  style={styles.actionBtn}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSavePersonal}
                  loading={isSaving}
                  disabled={isSaving}
                  buttonColor={theme.colors.primary}
                  style={styles.actionBtn}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <InfoRow icon="👤" label="Full Name" value={profile?.full_name ?? "—"} />
              <InfoRow icon="📱" label="Phone" value={profile?.phone ?? "—"} />
              <InfoRow icon="📧" label="Email" value={profile?.email ?? "—"} />
              <InfoRow
                icon="📍"
                label="Location"
                value={profile?.location ?? "Not set"}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Editable Work/Cleaner Details */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
              variant="labelLarge"
            >
              Work Details
            </Text>
            {!isEditing && (
              <Button
                mode="text"
                compact
                onPress={() => setIsEditing(true)}
                textColor={theme.colors.primary}
              >
                Edit Details
              </Button>
            )}
          </View>
          <Divider
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />

          {isEditing ? (
            // Edit Mode Form
            <View style={styles.editForm}>
              <TextInput
                label="Mobile Money Number"
                value={momo}
                onChangeText={setMomo}
                keyboardType="phone-pad"
                mode="outlined"
                dense
                placeholder="e.g. 024 123 4567"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <TextInput
                label="Short Bio"
                value={bio}
                onChangeText={setBio}
                mode="outlined"
                multiline
                numberOfLines={3}
                dense
                placeholder="Tell clients about your experience and style..."
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel} variant="labelSmall">
                Skills (Select category)
              </Text>
              <View style={styles.chipEditRow}>
                {SKILL_OPTIONS.map((skill) => (
                  <Chip
                    key={skill}
                    selected={skills.includes(skill)}
                    onPress={() => toggleSkill(skill)}
                    style={[
                      styles.skillChipEdit,
                      skills.includes(skill) && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                    textStyle={{
                      color: skills.includes(skill)
                        ? colors.white
                        : theme.colors.onSurfaceVariant,
                    }}
                    showSelectedCheck={false}
                    compact
                  >
                    {skill}
                  </Chip>
                ))}
              </View>

              <Divider style={styles.formDivider} />
              <Text style={styles.fieldLabel} variant="labelSmall">
                Guarantor Information
              </Text>

              <TextInput
                label="Guarantor Name"
                value={guarantorName}
                onChangeText={setGuarantorName}
                mode="outlined"
                dense
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <TextInput
                label="Guarantor Phone"
                value={guarantorPhone}
                onChangeText={setGuarantorPhone}
                keyboardType="phone-pad"
                mode="outlined"
                dense
                placeholder="e.g. 024 123 4567"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
              />

              <View style={styles.editActionRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsEditing(false);
                    // Reset fields to current profile values
                    setBio(cleanerProfile?.bio ?? "");
                    setMomo(cleanerProfile?.mobile_money_number ?? "");
                    setGuarantorName(cleanerProfile?.guarantor_name ?? "");
                    setGuarantorPhone(cleanerProfile?.guarantor_phone ?? "");
                    setSkills(cleanerProfile?.skills ?? []);
                  }}
                  disabled={isSaving}
                  textColor={theme.colors.outline}
                  style={styles.actionBtn}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveDetails}
                  loading={isSaving}
                  disabled={isSaving}
                  buttonColor={theme.colors.primary}
                  style={styles.actionBtn}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            // View Mode Static Fields
            <View>
              <InfoRow
                icon="💰"
                label="MoMo Number"
                value={cleanerProfile?.mobile_money_number ?? "—"}
              />
              <InfoRow
                icon="👤"
                label="Guarantor Name"
                value={cleanerProfile?.guarantor_name ?? "—"}
              />
              <InfoRow
                icon="📞"
                label="Guarantor Phone"
                value={cleanerProfile?.guarantor_phone ?? "—"}
              />

              {cleanerProfile?.bio && (
                <>
                  <Divider
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.outline },
                    ]}
                  />
                  <Text
                    style={[
                      styles.bioLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    variant="labelSmall"
                  >
                    Bio
                  </Text>
                  <Text
                    style={[styles.bioText, { color: theme.colors.onSurface }]}
                    variant="bodyMedium"
                  >
                    {cleanerProfile.bio}
                  </Text>
                </>
              )}

              {cleanerProfile?.skills && cleanerProfile.skills.length > 0 && (
                <>
                  <Divider
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.outline },
                    ]}
                  />
                  <Text
                    style={[
                      styles.bioLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    variant="labelSmall"
                  >
                    Skills
                  </Text>
                  <View style={styles.skillsRow}>
                    {cleanerProfile.skills.map((skill) => (
                      <Chip
                        key={skill}
                        style={[
                          styles.skillChip,
                          { backgroundColor: theme.colors.primaryContainer },
                        ]}
                        textStyle={{
                          color: theme.colors.onPrimaryContainer,
                          fontSize: 12,
                        }}
                        compact
                      >
                        {skill}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Verification Documents Card */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
        mode="contained"
      >
        <Card.Content>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.primary }]}
            variant="labelLarge"
          >
            Verification Documents
          </Text>
          <Divider
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />

          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              fontSize: 13,
              marginBottom: spacing.sm,
            }}
            variant="bodySmall"
          >
            Please upload clear photos of your documents. Our admin team will
            review them for approval.
          </Text>

          <DocUploadRow
            label="Ghana Card (National ID) *"
            url={documents.ghana_card}
            onUpload={() => handleUploadDoc("ghana_card")}
            uploading={isUploadingPhoto}
          />

          <DocUploadRow
            label="Selfie Verification *"
            url={documents.selfie}
            onUpload={() => handleUploadDoc("selfie")}
            uploading={isUploadingPhoto}
          />
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
        mode="contained"
      >
        <Card.Content>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.primary }]}
            variant="labelLarge"
          >
            App Settings
          </Text>
          <Divider
            style={[styles.divider, { backgroundColor: theme.colors.outline }]}
          />
          <View style={infoStyles.row}>
            <Text style={infoStyles.icon}>🌓</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  infoStyles.label,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                variant="labelSmall"
              >
                App Theme
              </Text>
              <Text
                style={[infoStyles.value, { color: theme.colors.onSurface }]}
                variant="bodyMedium"
              >
                {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <Switch
              value={themeMode === "dark"}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleSignOut}
        textColor={theme.colors.error}
        style={[styles.logoutBtn, { borderColor: theme.colors.error }]}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View>
        <Text
          style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]}
          variant="labelSmall"
        >
          {label}
        </Text>
        <Text
          style={[infoStyles.value, { color: theme.colors.onSurface }]}
          variant="bodyMedium"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function DocUploadRow({
  label,
  url,
  onUpload,
  uploading,
}: {
  label: string;
  url: string | null;
  onUpload: () => void;
  uploading: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={docStyles.row}>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          variant="bodyMedium"
        >
          {label}
        </Text>
        <Text
          style={{ color: url ? colors.success : colors.error, fontSize: 12 }}
          variant="bodySmall"
        >
          {url ? "✓ Uploaded" : "✗ Missing"}
        </Text>
      </View>
      {url && (
        <Avatar.Image
          size={40}
          source={{ uri: url }}
          style={{ marginRight: spacing.sm, backgroundColor: "transparent" }}
        />
      )}
      <Button
        mode={url ? "outlined" : "contained"}
        onPress={onUpload}
        disabled={uploading}
        compact
        buttonColor={url ? undefined : theme.colors.primary}
        style={{ borderRadius: 8 }}
      >
        {url ? "Replace" : "Upload"}
      </Button>
    </View>
  );
}

const docStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: { fontSize: 20, width: 28, textAlign: "center" },
  label: { fontSize: 11 },
  value: { fontWeight: "500" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: "center", paddingVertical: spacing.xl },
  avatarWrapper: { position: "relative", alignSelf: "center" },
  avatar: { backgroundColor: colors.primaryDark },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { fontWeight: "700", marginTop: spacing.md },
  role: { color: colors.primary, fontWeight: "600", marginTop: spacing.xs },
  verificationChip: { marginTop: spacing.md, backgroundColor: "transparent" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  jobCount: {},
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: colors.primary, fontWeight: "600" },
  divider: { marginVertical: spacing.sm },
  bioLabel: { marginBottom: 4 },
  bioText: {},
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  skillChip: {},
  skillText: {},
  logoutBtn: { borderRadius: 12, marginTop: spacing.md },

  // Completion Gauge
  gaugeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressBar: { height: 8, borderRadius: 4, marginBottom: spacing.md },
  checklist: { gap: spacing.xs, paddingLeft: spacing.xs },
  checkItem: {},

  // Edit Mode Styles
  editForm: { gap: spacing.md, marginTop: spacing.xs },
  textInput: { backgroundColor: "transparent" },
  fieldLabel: {
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  chipEditRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  skillChipEdit: { borderWidth: 1 },
  formDivider: { height: 1, marginVertical: spacing.sm },
  editActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionBtn: { borderRadius: 8, minWidth: 90 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.onSurfaceVariant },
});
