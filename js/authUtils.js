// authUtils.js

export async function requireAuth(supabase, opts = {}) {
  const { onDeny, throw: shouldThrow = false } = opts;

  const { data, error } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) {
    const msg = "Please log in.";
    if (shouldThrow) throw new Error(msg);
    alert(msg);
    (onDeny || (() => (window.location.href = "/login.html")))();
    return null;
  }
  return user; 
}