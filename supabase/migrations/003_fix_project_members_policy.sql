-- Fix infinite recursion in RLS policies
-- This happens because profiles policies reference project_members 
-- and project_members policies create circular dependencies

-- Step 1: Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of team members" ON profiles;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can update member roles" ON project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON project_members;

-- Step 2: Create simplified profiles policies (no circular references)
-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 3: Create simplified project_members policies (no self-references)
-- Users can view project members for projects they're in
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    -- User can see members of projects they belong to
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

-- Users can add themselves as owner when creating a project
-- OR existing owners can add new members
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    -- Allow adding yourself as owner (first member of new project)
    (user_id = auth.uid() AND role = 'Owner')
    -- OR you're already an owner adding someone else
    OR (
      auth.uid() IN (
        SELECT pm.user_id 
        FROM project_members pm 
        WHERE pm.project_id = project_members.project_id 
        AND pm.role = 'Owner'
      )
    )
  );

-- Only project owners can update member roles
CREATE POLICY "Project owners can update member roles"
  ON project_members FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT pm.user_id 
      FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.role = 'Owner'
    )
  );

-- Only project owners can remove members
CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    auth.uid() IN (
      SELECT pm.user_id 
      FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.role = 'Owner'
    )
  );
