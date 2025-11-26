-- Create project_invitations table for in-app invitation system
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Member', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, invited_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invited_user_id ON project_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON project_invitations(status);

-- Apply updated_at trigger
CREATE TRIGGER update_project_invitations_updated_at BEFORE UPDATE ON project_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for projects they own or invitations sent to them
CREATE POLICY "Users can view relevant invitations"
  ON project_invitations FOR SELECT
  USING (
    invited_user_id = auth.uid() 
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = project_invitations.project_id 
        AND project_members.user_id = auth.uid() 
        AND project_members.role = 'Owner'
    )
  );

-- Policy: Only project owners can create invitations
CREATE POLICY "Project owners can create invitations"
  ON project_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = project_invitations.project_id 
        AND project_members.user_id = auth.uid() 
        AND project_members.role = 'Owner'
    )
  );

-- Policy: Invited users can update their own invitations (accept/decline)
CREATE POLICY "Invited users can update their invitations"
  ON project_invitations FOR UPDATE
  USING (invited_user_id = auth.uid());

-- Policy: Project owners and invited users can delete invitations
CREATE POLICY "Owners and invitees can delete invitations"
  ON project_invitations FOR DELETE
  USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = project_invitations.project_id 
        AND project_members.user_id = auth.uid() 
        AND project_members.role = 'Owner'
    )
  );
