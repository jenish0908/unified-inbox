-- Add isRead field to Message table
-- This migration adds unread message tracking functionality

-- Add the isRead column with default false
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

-- Create index on isRead for better query performance
CREATE INDEX IF NOT EXISTS "Message_isRead_idx" ON "Message"("isRead");

-- Set all existing messages as read (optional - you can comment this out if you want existing messages to be unread)
-- UPDATE "Message" SET "isRead" = true WHERE "direction" = 'outbound';

