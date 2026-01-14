// Environment configuration helper
// This provides runtime environment variables for Docker deployments
// and falls back to Vite's build-time env vars for development

interface RuntimeEnv {
    VITE_API_BASE_URL?: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
}

declare global {
    interface Window {
        ENV?: RuntimeEnv;
    }
}

/**
 * Get environment variable with runtime override support
 * Priority: window.ENV (runtime) > import.meta.env (build-time) > default
 */
export function getEnv(key: keyof RuntimeEnv, defaultValue: string = ""): string {
    // First check runtime config (Docker)
    const runtimeValue = window.ENV?.[key];
    if (runtimeValue && !runtimeValue.startsWith("__")) {
        return runtimeValue;
    }

    // Fall back to Vite build-time env
    const buildTimeValue = import.meta.env[key];
    if (buildTimeValue) {
        return buildTimeValue;
    }

    // Use default
    return defaultValue;
}

// Pre-defined getters for common env vars
export const ENV = {
    get API_BASE_URL() {
        return getEnv("VITE_API_BASE_URL", "http://localhost:8000");
    },
    get SUPABASE_URL() {
        return getEnv("VITE_SUPABASE_URL", "");
    },
    get SUPABASE_ANON_KEY() {
        return getEnv("VITE_SUPABASE_ANON_KEY", "");
    }
};
