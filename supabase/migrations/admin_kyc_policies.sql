-- Admin KYC Policies

-- Let's define a helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to view all user profiles
CREATE POLICY "Admins can view all user profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

-- Allow admins to update all user profiles (for approving/rejecting KYC)
CREATE POLICY "Admins can update all user profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin());

-- RPC to update user metadata (since normal users/admins can't directly update auth.users metadata securely from the client)
-- This function allows an admin to update a user's kyc_status in their auth metadata.
CREATE OR REPLACE FUNCTION public.admin_update_kyc_status(p_user_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can perform this action';
  END IF;

  -- Update the raw_user_meta_data in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{kyc_status}',
    to_jsonb(p_status)
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
