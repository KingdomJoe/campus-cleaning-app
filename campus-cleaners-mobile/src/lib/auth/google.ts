import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Performs the Google OAuth flow on native/web platforms.
 * Opens the in-app WebBrowser, triggers OAuth, and establishes the Supabase session on return.
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    const redirectUrl = Linking.createURL('/(auth)/oauth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No authentication URL returned from Supabase.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const { access_token, refresh_token } = parsed.queryParams || {};

      if (access_token && refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });
        if (sessionErr) throw sessionErr;
        return true;
      }

      // Check URL fragment (hash) which Supabase often uses for OAuth redirects
      const hash = result.url.split('#')[1] || result.url.split('?')[1];
      if (hash) {
        const params = Object.fromEntries(
          hash.split('&').map((pair) => pair.split('='))
        );
        if (params.access_token && params.refresh_token) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionErr) throw sessionErr;
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Error during Google sign-in:', err);
    throw err;
  }
  return false;
}
