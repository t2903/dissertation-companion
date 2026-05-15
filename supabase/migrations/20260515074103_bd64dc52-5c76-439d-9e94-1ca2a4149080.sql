
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin','manager','compliance_officer','agronomist','farmer','inspector');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-create profile + default farmer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'compliance_officer');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Domain tables
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  hectarage NUMERIC NOT NULL DEFAULT 0,
  contract_no TEXT NOT NULL,
  phone TEXT,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmers read authed" ON public.farmers FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmers write staff" ON public.farmers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  notes TEXT,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insp read" ON public.inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "insp write" ON public.inspections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'agronomist') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'agronomist') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  corrective_action TEXT,
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inc read" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "inc write" ON public.incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  barn TEXT NOT NULL,
  moisture NUMERIC NOT NULL,
  grade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'curing',
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bat read" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "bat write" ON public.batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'agronomist') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'compliance_officer') OR public.has_role(auth.uid(),'agronomist') OR public.has_role(auth.uid(),'admin'));
