-- ============================================================================
-- VIBE STACK - PostgreSQL Database Schema
-- ============================================================================
-- Production-ready schema for board state management
-- Version: 1.0.0
-- ============================================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BOARDS TABLE
-- ============================================================================
-- Stores board metadata and configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'default',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster board lookups
CREATE INDEX idx_boards_name ON boards(name);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
-- Stores all task data with full audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    lane VARCHAR(50) NOT NULL DEFAULT 'backlog',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    estimated_hours DECIMAL(10, 2) DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints for data integrity
    CONSTRAINT tasks_lane_check CHECK (lane IN ('backlog', 'todo', 'in_progress', 'done', 'recovery')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT tasks_title_length CHECK (LENGTH(title) BETWEEN 1 AND 200),
    CONSTRAINT tasks_estimated_hours_check CHECK (estimated_hours >= 0 AND estimated_hours <= 1000)
);

-- Create indexes for common query patterns
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_lane ON tasks(lane);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at DESC);

-- GIN index for JSONB tag searches
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
-- Tracks all changes to tasks for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT audit_log_action_check CHECK (action IN ('create', 'update', 'move', 'delete'))
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_log_task_id ON audit_log(task_id);
CREATE INDEX idx_audit_log_board_id ON audit_log(board_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for boards table
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log task changes to audit_log
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    action VARCHAR(50);
BEGIN
    -- Build action and old_values based on operation
    IF (TG_OP = 'INSERT') THEN
        action := 'create';
        new_values := to_jsonb(NEW);
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Check if lane changed
        IF OLD.lane IS DISTINCT FROM NEW.lane THEN
            action := 'move';
        ELSE
            action := 'update';
        END IF;
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        action := 'delete';
        old_values := to_jsonb(OLD);
    END IF;

    -- Insert audit log entry
    INSERT INTO audit_log (task_id, board_id, action, old_values, new_values)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.board_id, OLD.board_id),
        action,
        old_values,
        new_values
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic audit logging
DROP TRIGGER IF EXISTS log_task_changes_trigger ON tasks;
CREATE TRIGGER log_task_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_changes();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for task statistics by lane
CREATE OR REPLACE VIEW task_stats_by_lane AS
SELECT
    board_id,
    lane,
    COUNT(*) as task_count,
    SUM(estimated_hours) as total_estimated_hours,
    AVG(estimated_hours) as avg_estimated_hours
FROM tasks
GROUP BY board_id, lane;

-- View for task statistics by priority
CREATE OR REPLACE VIEW task_stats_by_priority AS
SELECT
    board_id,
    priority,
    COUNT(*) as task_count,
    SUM(estimated_hours) as total_estimated_hours
FROM tasks
GROUP BY board_id, priority;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Create default board if it doesn't exist
INSERT INTO boards (id, name, description)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'default',
    'Default Vibe Stack board'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GRANTS (adjust as needed for your security model)
-- ============================================================================

-- Grant necessary permissions to the application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vibeuser;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vibeuser;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vibeuser;

-- ============================================================================
-- PERFORMANCE: VACUUM ANALYZE
-- ============================================================================
-- Update statistics for query optimizer
VACUUM ANALYZE;
