import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { pickImage } from '@/lib/api/uploads';
import { colors, spacing, borderRadius } from '@/lib/theme';

const SKILL_OPTIONS = [
  'General cleaning', 'Deep cleaning', 'Laundry', 'Dishes',
  'Trash removal', 'Window cleaning', 'Ironing',
];

export default function RegisterCleanerScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handlePickPhoto = async () => {
    const uri = await pickImage({ aspect: [1, 1] });
    if (uri) setProfilePhoto(uri);
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !momoNumber.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;

      const { error: signUpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: formattedPhone,
            email: email.trim(),
            role: 'cleaner',
            bio: bio.trim(),
            skills: selectedSkills,
            mobile_money_number: momoNumber.trim(),
            guarantor_name: guarantorName.trim(),
            guarantor_phone: guarantorPhone.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { method: 'phone', identifier: formattedPhone },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} variant="headlineMedium">
          Register as Cleaner
        </Text>
        <Text style={styles.subtitle} variant="bodyMedium">
          Join our team and start earning
        </Text>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <Button
            mode="outlined"
            onPress={handlePickPhoto}
            icon="camera"
            textColor={colors.primary}
            style={styles.photoBtn}
          >
            {profilePhoto ? 'Change Photo' : 'Add Profile Photo'}
          </Button>
          {profilePhoto && (
            <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel} variant="labelLarge">
            Personal Information
          </Text>

          <TextInput
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Affix text="+233" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Email Address *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Mobile Money Number *"
            value={momoNumber}
            onChangeText={setMomoNumber}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Icon icon="cash" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Short Bio"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Tell clients about yourself..."
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <Text style={styles.sectionLabel} variant="labelLarge">
            Skills
          </Text>

          <View style={styles.chipContainer}>
            {SKILL_OPTIONS.map((skill) => (
              <Chip
                key={skill}
                selected={selectedSkills.includes(skill)}
                onPress={() => toggleSkill(skill)}
                style={[
                  styles.chip,
                  selectedSkills.includes(skill) && styles.chipSelected,
                ]}
                textStyle={{
                  color: selectedSkills.includes(skill)
                    ? colors.onPrimary
                    : colors.onSurfaceVariant,
                }}
                showSelectedCheck={false}
              >
                {skill}
              </Chip>
            ))}
          </View>

          <Text style={styles.sectionLabel} variant="labelLarge">
            Guarantor Information
          </Text>

          <TextInput
            label="Guarantor Name"
            value={guarantorName}
            onChangeText={setGuarantorName}
            mode="outlined"
            left={<TextInput.Icon icon="account-check" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Guarantor Phone"
            value={guarantorPhone}
            onChangeText={setGuarantorPhone}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Icon icon="phone" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />
        </View>

        {error ? (
          <Text style={styles.error} variant="bodySmall">
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
        >
          Register & Verify
        </Button>

        <Text style={styles.note} variant="bodySmall">
          Your account will be reviewed and verified by our admin team before you can start accepting jobs.
        </Text>

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={colors.onSurfaceVariant}
        >
          ← Go back
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoBtn: {
    borderColor: colors.primary,
    borderRadius: 12,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  btnContent: {
    paddingVertical: 6,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
});
