# Supabase Database Setup

This directory contains SQL migration files for setting up the Supabase database schema.

## How to Apply Migrations

You need to run these SQL files in your Supabase project. There are two ways to do this:

### Option 1: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard at https://dyyrhiomuxahyvujwvnx.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `001_initial_schema.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Repeat for `002_rls_policies.sql`

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dyyrhiomuxahyvujwvnx

# Run migrations
supabase db push
```

## Migration Files

1. **001_initial_schema.sql** - Creates all tables, indexes, and triggers
2. **002_rls_policies.sql** - Sets up Row Level Security policies

## What Gets Created

### Tables
- `profiles` - User profiles
- `projects` - Projects
- `project_members` - Team membership
- `milestones` - Project milestones
- `tasks` - Project tasks
- `comments` - Task comments
- `attachments` - Comment attachments

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Role-based access control (Owner, Member, Viewer)
