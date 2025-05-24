-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    interests TEXT,
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserting by anyone (for signups)
CREATE POLICY "Allow public to insert waitlist entries" ON waitlist
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create policy to allow reading only by authenticated users with admin role
CREATE POLICY "Allow admins to read waitlist" ON waitlist
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create policy to allow deleting only by authenticated users with admin role
CREATE POLICY "Allow admins to delete waitlist entries" ON waitlist
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin'); 