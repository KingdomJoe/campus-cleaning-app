import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { Text, TextInput, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore, BYPASS_AUTH } from '@/stores/authStore';
import { pickImage } from '@/lib/api/uploads';
import { colors, spacing, borderRadius } from '@/lib/theme';

const SKILL_OPTIONS = [
  'General cleaning',
  'Deep cleaning',
  'Laundry',
];

const DOCUMENT_TYPES = [
  { key: 'ghana_card', label: 'Ghana Card *', required: true },
  { key: 'student_id', label: 'Student ID', required: false },
  { key: 'selfie', label: 'Selfie Photo *', required: true },
  { key: 'guarantor_doc', label: 'Guarantor Document', required: false },
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
  const [documents, setDocuments] = useState<Record<string, string | null>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

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

  const handleDocumentPick = async (docType: string) => {
    const uri = await pickImage({ aspect: [4, 3] });
    if (uri) {
      setDocuments((prev) => ({ ...prev, [docType]: uri }));
      Alert.alert('Saved', `${DOCUMENT_TYPES.find(d => d.key === docType)?.label} will be uploaded after verification`);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !momoNumber.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required).map(d => d.key);
    const missingDocs = requiredDocs.filter(key => !documents[key]);
    if (missingDocs.length > 0) {
      setError(`Please upload required documents: ${missingDocs.map(k => DOCUMENT_TYPES.find(d => d.key === k)?.label).join(', ')}`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Clean phone input (remove spaces, parentheses, etc.)
      const cleanedPhone = phone.replace(/[^\d+]/g, '');
      const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+233${cleanedPhone.replace(/^0/, '')}`;

      // Validate Ghana phone number format (checking +233 followed by exactly 9 digits)
      const ghanaPhoneRegex = /^\+233\d{9}$/;
      if (!ghanaPhoneRegex.test(formattedPhone)) {
        setError('Please enter a valid Ghana mobile number (e.g., 024 123 4567 or 055 123 4567)');
        setIsLoading(false);
        return;
      }

      // Clean guarantor phone input if set
      const cleanedGuarantorPhone = guarantorPhone.replace(/[^\d+]/g, '');
      const formattedGuarantorPhone = cleanedGuarantorPhone
        ? (cleanedGuarantorPhone.startsWith('+') ? cleanedGuarantorPhone : `+233${cleanedGuarantorPhone.replace(/^0/, '')}`)
        : '';

      if (BYPASS_AUTH) {
        useAuthStore.getState().setMockTempData({
          identifier: email.trim(),
          method: 'email',
          fullName: fullName.trim(),
          phone: formattedPhone,
          cleanerDetails: {
            bio: bio.trim(),
            skills: selectedSkills,
            mobile_money_number: momoNumber.trim(),
            guarantor_name: guarantorName.trim(),
            guarantor_phone: formattedGuarantorPhone,
          }
        });

        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            method: 'email',
            identifier: email.trim(),
          },
        });
        setIsLoading(false);
        return;
      }

      // Save pending uploads to authStore so verify-otp can run them post-login
      useAuthStore.getState().setPendingUploads(documents, profilePhoto);

      // Sign up with OTP
      let signUpResult;
      let usedMethod = verificationMethod;
      if (verificationMethod === 'phone') {
        try {
          signUpResult = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
            options: {
              shouldCreateUser: true,
              data: {
                full_name: fullName.trim(),
                phone: formattedPhone,
                email: email.trim(),
                role: 'cleaner',
                bio: bio.trim(),
                skills: selectedSkills,
                mobile_money_number: momoNumber.trim(),
                guarantor_name: guarantorName.trim(),
                guarantor_phone: formattedGuarantorPhone,
              },
            },
          });
          if (signUpResult.error) throw signUpResult.error;
        } catch (phoneErr: any) {
          console.warn('SMS OTP signup failed, falling back to Email OTP:', phoneErr.message);
          usedMethod = 'email';
          signUpResult = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              shouldCreateUser: true,
              data: {
                full_name: fullName.trim(),
                phone: formattedPhone,
                email: email.trim(),
                role: 'cleaner',
                bio: bio.trim(),
                skills: selectedSkills,
                mobile_money_number: momoNumber.trim(),
                guarantor_name: guarantorName.trim(),
                guarantor_phone: formattedGuarantorPhone,
              },
            },
          });
          if (signUpResult.error) throw signUpResult.error;

          Alert.alert(
            'SMS Verification Unavailable',
            'Your carrier is unsupported for SMS OTP. We have sent a verification code to your Email instead.'
          );
        }
      } else {
        signUpResult = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
            data: {
              full_name: fullName.trim(),
              phone: formattedPhone,
              email: email.trim(),
              role: 'cleaner',
              bio: bio.trim(),
              skills: selectedSkills,
              mobile_money_number: momoNumber.trim(),
              guarantor_name: guarantorName.trim(),
              guarantor_phone: formattedGuarantorPhone,
            },
          },
        });
        if (signUpResult.error) throw signUpResult.error;
      }

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          method: usedMethod,
          identifier: usedMethod === 'phone' ? formattedPhone : email.trim(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (BYPASS_AUTH) {
        await useAuthStore.getState().mockGoogleLogin();
        setIsLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'campuscleaners://auth/callback',
          queryParams: {
            role: 'cleaner',
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.divider}>
          <Text style={styles.dividerText}>or continue with</Text>
        </View>

        <Button
          mode="outlined"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          disabled={isLoading}
          icon="google"
          style={styles.googleBtn}
          contentStyle={styles.googleBtnContent}
        >
          Continue with Google
        </Button>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>or register with email/phone</Text>
        </View>

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
            placeholder="24 123 4567"
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

          <Text style={styles.sectionLabel} variant="labelMedium">
            Verification Method *
          </Text>
          <SegmentedButtons
            value={verificationMethod}
            onValueChange={(v) => setVerificationMethod(v as 'phone' | 'email')}
            buttons={[
              { value: 'email', label: '📧 Email OTP' },
              { value: 'phone', label: '📱 SMS OTP' },
            ]}
            style={styles.segment}
            theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
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
            placeholder="024 123 4567"
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
            Skills (Select at least one)
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
            placeholder="024 123 4567"
          />

          <Text style={styles.sectionLabel} variant="labelLarge">
            Required Documents
          </Text>

          {DOCUMENT_TYPES.map((doc) => (
            <View key={doc.key} style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel} variant="bodyMedium">
                  {doc.label}
                </Text>
                <Text style={styles.docHint} variant="bodySmall">
                  {doc.required ? 'Required' : 'Optional'}
                </Text>
              </View>
              <Button
                mode={documents[doc.key] ? 'contained' : 'outlined'}
                onPress={() => handleDocumentPick(doc.key)}
                loading={uploadingDoc === doc.key}
                disabled={uploadingDoc !== null && uploadingDoc !== doc.key}
                icon={documents[doc.key] ? 'check-circle' : 'file-upload'}
                style={styles.docBtn}
                contentStyle={styles.docBtnContent}
                buttonColor={documents[doc.key] ? colors.success : colors.primary}
              >
                {documents[doc.key] ? 'Uploaded' : 'Upload'}
              </Button>
            </View>
          ))}
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  googleBtn: {
    borderColor: colors.outline,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  googleBtnContent: {
    paddingVertical: 10,
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
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    color: colors.white,
  },
  docHint: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  docBtn: {
    borderRadius: 8,
    minWidth: 100,
  },
  docBtnContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
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
  segment: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});