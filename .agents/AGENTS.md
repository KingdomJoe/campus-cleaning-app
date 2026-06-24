# Workspace Agent Rules

This file documents local agent rules and best practices for the Campus Cleaning App codebase.

## Auth & Deep Linking Guidelines

### Supabase OAuth Hash Parsing
When modifying or creating auth callback routes (e.g., `callback.tsx`, `oauth-callback.tsx`):
1. **Never rely solely on `useLocalSearchParams`**: It does not parse hash fragments (`#access_token=...`), which is where Supabase returns OAuth tokens on native redirects.
2. **Always extract tokens from the raw URL**: Use `Linking.useURL()` and manually parse the hash/query parameters using:
   ```typescript
   const url = Linking.useURL();
   let accessToken = params.access_token;
   let refreshToken = params.refresh_token;

   if ((!accessToken || !refreshToken) && url) {
     const hash = url.split('#')[1] || url.split('?')[1];
     if (hash) {
       const parsedParams = Object.fromEntries(
         hash.split('&').map((pair) => pair.split('='))
       );
       accessToken = parsedParams.access_token;
       refreshToken = parsedParams.refresh_token;
     }
   }
   ```
3. **Always Synchronize Onboarding Roles**: When a user completes registration or signs in for the first time via Google, allow them to choose or switch their role (Client vs Cleaner) during phone number confirmation, and redirect them straight to their respective workspace.
