-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

-- Allow users to view profiles of project members
CREATE POLICY "Users can view profiles of team members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm1
      WHERE pm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM project_members pm2
        WHERE pm2.user_id = profiles.id
        AND pm2.project_id = pm1.project_id
      )
    )
  );

-- Projects policies
-- Users can view projects they are members of
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Users can create projects (they will be added as owner via trigger/application logic)
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only project owners can update projects
CREATE POLICY "Project owners can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'Owner'
    )
  );

-- Only project owners can delete projects
CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'Owner'
    )
  );

-- Project members policies
-- Users can view project members for projects they're in
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Only project owners can add members
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_members.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'Owner'
    )
  );

-- Only project owners can update member roles
CREATE POLICY "Project owners can update member roles"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'Owner'
    )
  );

-- Only project owners can remove members
CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'Owner'
    )
  );

-- Milestones policies
-- Users can view milestones in their projects
CREATE POLICY "Users can view milestones in their projects"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project owners and members can create milestones
CREATE POLICY "Project members can create milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Project owners and members can update milestones
CREATE POLICY "Project members can update milestones"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Project owners and members can delete milestones
CREATE POLICY "Project members can delete milestones"
  ON milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Tasks policies
-- Users can view tasks in their projects
CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project owners and members can create tasks
CREATE POLICY "Project members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Project owners and members can update tasks
CREATE POLICY "Project members can update tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Project owners and members can delete tasks
CREATE POLICY "Project members can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('Owner', 'Member')
    )
  );

-- Comments policies
-- Users can view comments on tasks in their projects
CREATE POLICY "Users can view comments in their projects"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE tasks.id = comments.task_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can create comments
CREATE POLICY "Project members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE tasks.id = comments.task_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Attachments policies
-- Users can view attachments on comments in their projects
CREATE POLICY "Users can view attachments in their projects"
  ON attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM comments
      JOIN tasks ON tasks.id = comments.task_id
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE comments.id = attachments.comment_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Users can create attachments on their own comments
CREATE POLICY "Users can create attachments on their comments"
  ON attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = attachments.comment_id
      AND comments.user_id = auth.uid()
    )
  );

-- Users can delete attachments on their own comments
CREATE POLICY "Users can delete attachments on their comments"
  ON attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = attachments.comment_id
      AND comments.user_id = auth.uid()
    )
  );
