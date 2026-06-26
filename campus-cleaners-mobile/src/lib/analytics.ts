import PostHog from 'posthog-react-native';

// In production, these would be retrieved from Expo Constants / process.env
const POSTHOG_API_KEY = 'phc_CampusCleanersGhanaMVP2026MockKey';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
});

/**
 * Capture a custom event.
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    posthog.capture(event, properties);
    console.log(`[Analytics] Tracked: "${event}"`, properties ?? '');
  } catch (err) {
    console.error('[Analytics] Capture error:', err);
  }
}

/**
 * Identify a user with metadata.
 */
export function identifyUser(userId: string, email?: string, name?: string) {
  try {
    const traits: Record<string, any> = {};
    if (email !== undefined) traits.email = email;
    if (name !== undefined) traits.name = name;

    posthog.identify(userId, traits);
    console.log(`[Analytics] Identified: "${userId}" (${email ?? 'no email'})`);
  } catch (err) {
    console.error('[Analytics] Identify error:', err);
  }
}

/**
 * Reset analytics session on logout.
 */
export function resetAnalytics() {
  try {
    posthog.reset();
    console.log('[Analytics] Reset session');
  } catch (err) {
    console.error('[Analytics] Reset error:', err);
  }
}
