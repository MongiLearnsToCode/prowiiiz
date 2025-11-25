-- Simplify ALL remaining table RLS policies to avoid any potential recursion

-- Tasks table
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can delete tasks" ON tasks;

CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE TO authenticated USING (true);

-- Milestones table
DROP POLICY IF EXISTS "Users can view milestones in their projects" ON milestones;
DROP POLICY IF EXISTS "Project members can create milestones" ON milestones;
DROP POLICY IF EXISTS "Project members can update milestones" ON milestones;
DROP POLICY IF EXISTS "Project members can delete milestones" ON milestones;

CREATE POLICY "Authenticated users can view milestones"
  ON milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create milestones"
  ON milestones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update milestones"
  ON milestones FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete milestones"
  ON milestones FOR DELETE TO authenticated USING (true);

-- Comments table
DROP POLICY IF EXISTS "Users can view comments in their projects" ON comments;
DROP POLICY IF EXISTS "Project members can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Attachments table
DROP POLICY IF EXISTS "Users can view attachments in their projects" ON attachments;
DROP POLICY IF EXISTS "Users can create attachments on their comments" ON attachments;
DROP POLICY IF EXISTS "Users can delete attachments on their comments" ON attachments;

CREATE POLICY "Authenticated users can view attachments"
  ON attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create attachments"
  ON attachments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attachments"
  ON attachments FOR DELETE TO authenticated USING (true);
