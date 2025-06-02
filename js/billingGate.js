export async function checkCourseAccess(supabase, userId, courseId, opts = {}) {
  const { throw: asThrow = false, onDeny } = opts;

  const [{ data: u, error: ue }, { data: c, error: ce }] = await Promise.all([
    supabase
      .from('users')
      .select('audience_type, subscription_active')
      .eq('id', userId)
      .single(),
    supabase
      .from('courses')
      .select('billing_type')
      .eq('id', courseId)
      .single()
  ]);

  if (ue || ce || !u || !c) {
    const msg = "Unable to verify billing permissions.";
    if (asThrow) throw new Error(msg);
    alert(msg);
    (onDeny || (() => (window.location.href = '/profile.html')))();
    return false;
  }

  const allowed =
        u.audience_type === 'academic'                      // academics are free
     || c.billing_type === 'free'                           // defensive: course flagged free
     || c.billing_type === 'one_off'                        // prepaid credit
     || (c.billing_type === 'subscription' && u.subscription_active);

  if (!allowed) {
    const msg = "Your plan or credit does not cover this action.";
    if (asThrow) throw new Error(msg);
    alert(msg);
    (onDeny || (() => (window.location.href = '/profile.html')))();
    return false;
  }
  return true; 
}