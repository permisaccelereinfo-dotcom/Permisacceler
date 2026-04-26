-- ============================================
-- Permis Accéléré - Supabase Database Setup
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- 1. USERS TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'auto_ecole', 'admin')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. AUTO-ECOLES TABLE
-- ============================================
CREATE TABLE public.auto_ecoles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    license_types TEXT[] DEFAULT ARRAY['B']::TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    commission_rate DECIMAL(4,2) DEFAULT 10.00,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_auto_ecoles_updated_at
    BEFORE UPDATE ON public.auto_ecoles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. STAGES (Intensive Courses) TABLE
-- ============================================
CREATE TABLE public.stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auto_ecole_id UUID NOT NULL REFERENCES public.auto_ecoles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    license_type TEXT NOT NULL DEFAULT 'B',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 7,
    max_students INTEGER NOT NULL DEFAULT 6,
    enrolled_students INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    is_available BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_stages_updated_at
    BEFORE UPDATE ON public.stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price DECIMAL(10,2) NOT NULL,
    deposit_paid DECIMAL(10,2) DEFAULT 0.00,
    balance_due DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending_deposit' CHECK (payment_status IN ('pending_deposit', 'deposit_paid', 'fully_paid')),
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stage_id) -- Prevent duplicate bookings
);

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. REVIEWS TABLE
-- ============================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    auto_ecole_id UUID NOT NULL REFERENCES public.auto_ecoles(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, booking_id) -- One review per booking
);

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ALERTS TABLE (For "notify me when available")
-- ============================================
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    phone TEXT,
    name TEXT NOT NULL,
    city TEXT,
    license_type TEXT DEFAULT 'B',
    preferred_start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- Auto-ecoles indexes
CREATE INDEX idx_auto_ecoles_city ON public.auto_ecoles(city);
CREATE INDEX idx_auto_ecoles_postal_code ON public.auto_ecoles(postal_code);
CREATE INDEX idx_auto_ecoles_user_id ON public.auto_ecoles(user_id);
CREATE INDEX idx_auto_ecoles_verified ON public.auto_ecoles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_auto_ecoles_location ON public.auto_ecoles(latitude, longitude);

-- Stages indexes
CREATE INDEX idx_stages_auto_ecole_id ON public.stages(auto_ecole_id);
CREATE INDEX idx_stages_dates ON public.stages(start_date, end_date);
CREATE INDEX idx_stages_license_type ON public.stages(license_type);
CREATE INDEX idx_stages_available ON public.stages(is_available, status) WHERE is_available = TRUE AND status = 'active';

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_stage_id ON public.bookings(stage_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Reviews indexes
CREATE INDEX idx_reviews_auto_ecole_id ON public.reviews(auto_ecole_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_ecoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Auto-ecoles can read student profiles for their bookings" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.stages s ON b.stage_id = s.id
            JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
            WHERE b.user_id = users.id AND ae.user_id = auth.uid()
        )
    );

-- AUTO-ECOLES policies
CREATE POLICY "Auto-ecoles public read" ON public.auto_ecoles
    FOR SELECT USING (true);

CREATE POLICY "Auto-ecole owners can manage their profile" ON public.auto_ecoles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create auto-ecole profile" ON public.auto_ecoles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- STAGES policies
CREATE POLICY "Stages public read" ON public.stages
    FOR SELECT USING (is_available = TRUE AND status = 'active');

CREATE POLICY "Auto-ecole owners can manage their stages" ON public.stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auto_ecoles ae
            WHERE ae.id = stages.auto_ecole_id AND ae.user_id = auth.uid()
        )
    );

-- BOOKINGS policies
CREATE POLICY "Students can read own bookings" ON public.bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own bookings" ON public.bookings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Auto-ecoles can read bookings for their stages" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stages s
            JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
            WHERE s.id = bookings.stage_id AND ae.user_id = auth.uid()
        )
    );

CREATE POLICY "Auto-ecoles can update bookings for their stages" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stages s
            JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
            WHERE s.id = bookings.stage_id AND ae.user_id = auth.uid()
        )
    );

-- REVIEWS policies
CREATE POLICY "Reviews public read" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Students can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = reviews.booking_id 
            AND b.user_id = auth.uid()
            AND b.status = 'completed'
        )
    );

CREATE POLICY "Students can update own reviews" ON public.reviews
    FOR UPDATE USING (user_id = auth.uid());

-- ALERTS policies
CREATE POLICY "Anyone can create alerts" ON public.alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read alerts" ON public.alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update enrolled_students count when booking is confirmed
CREATE OR REPLACE FUNCTION update_stage_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE public.stages 
        SET enrolled_students = enrolled_students + 1
        WHERE id = NEW.stage_id;
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        UPDATE public.stages 
        SET enrolled_students = enrolled_students - 1
        WHERE id = NEW.stage_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stage_enrollment_on_booking
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_stage_enrollment();

-- Function to auto-cancel stage when full
CREATE OR REPLACE FUNCTION check_stage_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.enrolled_students >= NEW.max_students THEN
        NEW.is_available := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_stage_availability_trigger
    BEFORE UPDATE ON public.stages
    FOR EACH ROW
    EXECUTE FUNCTION check_stage_availability();

-- ============================================
-- SEED DATA (Sample Data)
-- ============================================

-- Note: Run this after creating users in auth.users
-- Sample auto-ecoles (you'll need to create auth users first)

-- INSERT INTO public.users (id, email, name, phone, role) VALUES
--     (uuid_generate_v4(), 'autoecole1@example.com', 'Auto-École Paris Centre', '01 23 45 67 89', 'auto_ecole'),
--     (uuid_generate_v4(), 'autoecole2@example.com', 'Auto-École Lyon Sud', '04 56 78 90 12', 'auto_ecole');

-- Then create their auto_ecoles profiles:
-- INSERT INTO public.auto_ecoles (user_id, name, description, address, city, postal_code, phone, email, license_types)
-- SELECT id, name, 'Formation accélérée permis B', '123 Rue de Paris', 'Paris', '75001', phone, email, ARRAY['B']
-- FROM public.users WHERE email = 'autoecole1@example.com';

-- ============================================
-- SEARCH FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION search_stages(
    search_city TEXT DEFAULT NULL,
    search_license_type TEXT DEFAULT 'B',
    search_start_date DATE DEFAULT NULL,
    search_end_date DATE DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    stage_id UUID,
    stage_title TEXT,
    stage_description TEXT,
    license_type TEXT,
    start_date DATE,
    end_date DATE,
    price DECIMAL,
    max_students INTEGER,
    enrolled_students INTEGER,
    available_spots INTEGER,
    auto_ecole_id UUID,
    auto_ecole_name TEXT,
    auto_ecole_city TEXT,
    auto_ecole_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as stage_id,
        s.title as stage_title,
        s.description as stage_description,
        s.license_type,
        s.start_date,
        s.end_date,
        s.price,
        s.max_students,
        s.enrolled_students,
        (s.max_students - s.enrolled_students) as available_spots,
        ae.id as auto_ecole_id,
        ae.name as auto_ecole_name,
        ae.city as auto_ecole_city,
        COALESCE(
            (SELECT AVG(r.rating) FROM public.reviews r WHERE r.auto_ecole_id = ae.id),
            0
        )::DECIMAL(3,2) as auto_ecole_rating
    FROM public.stages s
    JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
    WHERE s.is_available = TRUE
      AND s.status = 'active'
      AND (search_city IS NULL OR ae.city ILIKE '%' || search_city || '%')
      AND (search_license_type IS NULL OR s.license_type = search_license_type)
      AND (search_start_date IS NULL OR s.start_date >= search_start_date)
      AND (search_end_date IS NULL OR s.end_date <= search_end_date)
      AND (max_price IS NULL OR s.price <= max_price)
      AND (s.max_students - s.enrolled_students) > 0
    ORDER BY s.start_date ASC, s.price ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF SETUP
-- ============================================
