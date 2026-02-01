-- ============================================================================
-- VIBE STACK - Credentials Table Migration
-- ============================================================================
-- Secure storage for user credentials (GitHub tokens, Git credentials, etc.)
-- ============================================================================

-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default',
  type VARCHAR(50) NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  auth_tag VARCHAR(32) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique credential per user and type
  CONSTRAINT unique_user_credential UNIQUE (user_id, type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credentials_user_type ON credentials(user_id, type);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);

-- Add comment
COMMENT ON TABLE credentials IS 'Encrypted user credentials for GitHub, Git, and other services';
COMMENT ON COLUMN credentials.user_id IS 'User identifier (default for single-user setups)';
COMMENT ON COLUMN credentials.type IS 'Credential type: github_token, git_credentials, etc.';
COMMENT ON COLUMN credentials.encrypted_value IS 'AES-256-GCM encrypted value';
COMMENT ON COLUMN credentials.iv IS 'Initialization vector for decryption';
COMMENT ON COLUMN credentials.auth_tag IS 'Authentication tag for GCM mode';
