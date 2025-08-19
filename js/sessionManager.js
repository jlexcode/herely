// sessionManager.js - Works with Supabase's built-in session management

export function initSessionMonitoring(supabase) {
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Session refreshed automatically by Supabase');
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
  });

  // Check session status periodically (optional)
  setInterval(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found');
      // Supabase will handle the redirect automatically
    }
  }, 60000); // Check every minute
}

// Manual session check
export async function checkSessionStatus(supabase) {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    isAuthenticated: !!session,
    expiresAt: session?.expires_at,
    timeUntilExpiry: session ? new Date(session.expires_at * 1000) - new Date() : 0
  };
}
