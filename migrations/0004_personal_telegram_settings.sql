-- Add personal Telegram settings to user_preferences
-- This allows each user to have their own Telegram bot and settings

-- Add new columns if they don't exist
ALTER TABLE user_preferences ADD COLUMN telegram_bot_token TEXT;
ALTER TABLE user_preferences ADD COLUMN telegram_chat_id TEXT;
ALTER TABLE user_preferences ADD COLUMN auto_scheduler_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN risk_allocation_high INTEGER DEFAULT 20;
ALTER TABLE user_preferences ADD COLUMN risk_allocation_medium INTEGER DEFAULT 30;
ALTER TABLE user_preferences ADD COLUMN risk_allocation_low INTEGER DEFAULT 50;

-- Update existing users to have personal Telegram disabled by default
UPDATE user_preferences SET telegram_notifications = FALSE WHERE telegram_notifications IS NULL;
UPDATE user_preferences SET auto_scheduler_enabled = FALSE WHERE auto_scheduler_enabled IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_telegram ON user_preferences(user_id, telegram_notifications, auto_scheduler_enabled);