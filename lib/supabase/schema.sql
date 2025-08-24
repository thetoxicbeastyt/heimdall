-- =============================================
-- Heimdall Debrid Media Manager Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

-- Debrid provider enum
CREATE TYPE debrid_provider AS ENUM (
  'real-debrid',
  'alldebrid', 
  'premiumize',
  'debrid-link'
);

-- Download status enum
CREATE TYPE download_status AS ENUM (
  'queued',
  'downloading', 
  'completed',
  'error',
  'paused',
  'cancelled'
);

-- Media type enum
CREATE TYPE media_type AS ENUM (
  'movie',
  'tv_show',
  'episode',
  'music',
  'game',
  'software',
  'book',
  'other'
);

-- =============================================
-- TABLES
-- =============================================

-- User debrid accounts table
CREATE TABLE user_debrid_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider debrid_provider NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted using pgcrypto
  username TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  traffic_left BIGINT DEFAULT 0, -- bytes
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider),
  CHECK (LENGTH(api_key) > 0)
);

-- User search history table
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  media_type media_type DEFAULT 'other',
  filters JSONB DEFAULT '{}', -- Store search filters as JSON
  provider debrid_provider,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (LENGTH(query) > 0),
  CHECK (results_count >= 0)
);

-- User downloads table  
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  magnet_hash TEXT NOT NULL,
  magnet_link TEXT,
  provider debrid_provider NOT NULL,
  status download_status DEFAULT 'queued',
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  file_size BIGINT DEFAULT 0, -- bytes
  download_speed BIGINT DEFAULT 0, -- bytes per second
  eta_seconds INTEGER DEFAULT 0, -- estimated time remaining
  torrent_id TEXT, -- Provider-specific torrent ID
  stream_link TEXT, -- Direct streaming URL
  download_link TEXT, -- Direct download URL
  quality TEXT, -- e.g., '1080p', '4K', '720p'
  media_type media_type DEFAULT 'other',
  year INTEGER,
  imdb_id TEXT,
  tmdb_id TEXT,
  season_number INTEGER,
  episode_number INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional metadata as JSON
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (LENGTH(title) > 0),
  CHECK (LENGTH(magnet_hash) = 40), -- SHA-1 hash length
  CHECK (progress >= 0 AND progress <= 100),
  CHECK (file_size >= 0),
  CHECK (download_speed >= 0),
  CHECK (eta_seconds >= 0),
  CHECK (year IS NULL OR (year >= 1800 AND year <= EXTRACT(YEAR FROM NOW()) + 10)),
  CHECK (season_number IS NULL OR season_number > 0),
  CHECK (episode_number IS NULL OR episode_number > 0)
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_quality TEXT DEFAULT '1080p',
  auto_select_files BOOLEAN DEFAULT true,
  preferred_provider debrid_provider,
  download_path TEXT DEFAULT '/downloads',
  notifications_enabled BOOLEAN DEFAULT true,
  auto_delete_completed BOOLEAN DEFAULT false,
  auto_delete_after_days INTEGER DEFAULT 30,
  max_concurrent_downloads INTEGER DEFAULT 5,
  bandwidth_limit_mbps INTEGER, -- NULL means unlimited
  preferred_language TEXT DEFAULT 'en',
  subtitle_language TEXT DEFAULT 'en',
  settings JSONB DEFAULT '{}', -- Additional settings as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK (auto_delete_after_days > 0),
  CHECK (max_concurrent_downloads > 0 AND max_concurrent_downloads <= 50),
  CHECK (bandwidth_limit_mbps IS NULL OR bandwidth_limit_mbps > 0)
);

-- Download files table (for multi-file torrents)
CREATE TABLE download_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  download_id UUID NOT NULL REFERENCES user_downloads(id) ON DELETE CASCADE,
  file_index INTEGER NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  stream_link TEXT,
  download_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(download_id, file_index),
  CHECK (file_index >= 0),
  CHECK (LENGTH(filename) > 0),
  CHECK (file_size >= 0)
);

-- API usage tracking table
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider debrid_provider NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (status_code >= 100 AND status_code < 600),
  CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

-- =============================================
-- INDEXES
-- =============================================

-- User debrid accounts indexes
CREATE INDEX idx_user_debrid_accounts_user_id ON user_debrid_accounts(user_id);
CREATE INDEX idx_user_debrid_accounts_provider ON user_debrid_accounts(provider);
CREATE INDEX idx_user_debrid_accounts_active ON user_debrid_accounts(is_active) WHERE is_active = true;

-- User search history indexes  
CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_searched_at ON user_search_history(searched_at DESC);
CREATE INDEX idx_user_search_history_query ON user_search_history USING gin(to_tsvector('english', query));

-- User downloads indexes
CREATE INDEX idx_user_downloads_user_id ON user_downloads(user_id);
CREATE INDEX idx_user_downloads_status ON user_downloads(status);
CREATE INDEX idx_user_downloads_provider ON user_downloads(provider);
CREATE INDEX idx_user_downloads_magnet_hash ON user_downloads(magnet_hash);
CREATE INDEX idx_user_downloads_created_at ON user_downloads(created_at DESC);
CREATE INDEX idx_user_downloads_media_type ON user_downloads(media_type);

-- Download files indexes
CREATE INDEX idx_download_files_download_id ON download_files(download_id);
CREATE INDEX idx_download_files_selected ON download_files(is_selected) WHERE is_selected = true;

-- API usage logs indexes
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_provider ON api_usage_logs(provider);
CREATE INDEX idx_api_usage_logs_timestamp ON api_usage_logs(request_timestamp DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_debrid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- User debrid accounts policies
CREATE POLICY "Users can view own debrid accounts" ON user_debrid_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debrid accounts" ON user_debrid_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debrid accounts" ON user_debrid_accounts  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debrid accounts" ON user_debrid_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- User search history policies
CREATE POLICY "Users can view own search history" ON user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON user_search_history
  FOR DELETE USING (auth.uid() = user_id);

-- User downloads policies
CREATE POLICY "Users can view own downloads" ON user_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON user_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own downloads" ON user_downloads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads" ON user_downloads
  FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Download files policies (inherit from parent download)
CREATE POLICY "Users can view own download files" ON download_files
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_downloads WHERE id = download_files.download_id
    )
  );

CREATE POLICY "Users can insert own download files" ON download_files
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_downloads WHERE id = download_files.download_id  
    )
  );

CREATE POLICY "Users can update own download files" ON download_files
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_downloads WHERE id = download_files.download_id
    )
  );

CREATE POLICY "Users can delete own download files" ON download_files
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_downloads WHERE id = download_files.download_id
    )
  );

-- API usage logs policies
CREATE POLICY "Users can view own API usage logs" ON api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API usage logs" ON api_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_debrid_accounts_updated_at
  BEFORE UPDATE ON user_debrid_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_downloads_updated_at
  BEFORE UPDATE ON user_downloads  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    encrypt(api_key::bytea, gen_random_bytes(32), 'aes'),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt API keys  
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT, encryption_key BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    decrypt(decode(encrypted_key, 'base64'), encryption_key, 'aes'),
    'UTF8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active debrid providers
CREATE OR REPLACE FUNCTION get_user_active_providers(p_user_id UUID)
RETURNS TABLE(provider debrid_provider, api_key TEXT, username TEXT, is_premium BOOLEAN) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uda.provider,
    uda.api_key,
    uda.username,
    uda.is_premium
  FROM user_debrid_accounts uda
  WHERE uda.user_id = p_user_id 
    AND uda.is_active = true
    AND (uda.premium_expires_at IS NULL OR uda.premium_expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old search history (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_search_history 
  WHERE searched_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old API logs (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_usage_logs 
  WHERE request_timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA AND SETUP
-- =============================================

-- Insert default user preferences for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user download statistics
CREATE VIEW user_download_stats AS
SELECT 
  user_id,
  COUNT(*) as total_downloads,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_downloads,
  COUNT(*) FILTER (WHERE status = 'downloading') as active_downloads,
  COUNT(*) FILTER (WHERE status = 'error') as failed_downloads,
  SUM(file_size) FILTER (WHERE status = 'completed') as total_downloaded_bytes,
  AVG(download_speed) FILTER (WHERE status = 'downloading' AND download_speed > 0) as avg_download_speed
FROM user_downloads
GROUP BY user_id;

-- View for provider usage statistics  
CREATE VIEW provider_usage_stats AS
SELECT 
  provider,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_downloads,
  AVG(file_size) as avg_file_size,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_downloads,
  COUNT(*) FILTER (WHERE status = 'error') as failed_downloads
FROM user_downloads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider;