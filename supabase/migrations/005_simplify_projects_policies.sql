-- Simplify projects table RLS policies to work with application-level authorization

-- Drop existing project policies
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;

-- Recreate with simplified policies
-- Allow users to view projects (app already filters by project_members)
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);  -- App filters by project membership

-- Allow authenticated users to create projects
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());  -- User must be the creator

-- Allow authenticated users to update projects
-- (App enforces owner-only updates)
CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete projects
-- (App enforces owner-only deletes)
CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);
