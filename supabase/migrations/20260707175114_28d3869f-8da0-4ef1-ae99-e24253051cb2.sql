
-- Restrict SELECT on operational tables to staff roles
DROP POLICY IF EXISTS "bat read" ON public.batches;
CREATE POLICY "batches read staff" ON public.batches FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'compliance_officer'::app_role)
  OR public.has_role(auth.uid(), 'agronomist'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "farmers read authed" ON public.farmers;
CREATE POLICY "farmers read staff" ON public.farmers FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'compliance_officer'::app_role)
  OR public.has_role(auth.uid(), 'agronomist'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "inc read" ON public.incidents;
CREATE POLICY "incidents read staff" ON public.incidents FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'compliance_officer'::app_role)
  OR public.has_role(auth.uid(), 'agronomist'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "insp read" ON public.inspections;
CREATE POLICY "inspections read staff" ON public.inspections FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'compliance_officer'::app_role)
  OR public.has_role(auth.uid(), 'agronomist'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Restrict profile reads to owner or admin
DROP POLICY IF EXISTS "profiles read all authed" ON public.profiles;
CREATE POLICY "profiles read own or admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));
