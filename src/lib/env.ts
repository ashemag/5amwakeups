function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ouraClientId: requireEnv("OURA_CLIENT_ID"),
  ouraClientSecret: requireEnv("OURA_CLIENT_SECRET"),
  ouraRedirectUri:
    process.env.OURA_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/oura/callback`,
  supabaseProjectId: process.env.SUPABASE_PROJECT_ID ?? "",
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    `https://${requireEnv("SUPABASE_PROJECT_ID")}.supabase.co`,
  supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: requireEnv("SUPABASE_SECRET_KEY"),
};
