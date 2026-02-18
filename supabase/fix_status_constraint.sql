-- FIX: PROJECT STATUS CONSTRAINT ALIGNMENT
-- This script synchronizes the database check constraint with the definitive status list.

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (
    'pending',
    'queued',
    'matching',
    'assigned',
    'waiting_for_client',
    'awaiting_down_payment',
    'active',
    'in_progress',
    'work_started',
    'review_samples',
    'ready_for_review',
    'review',
    'approved',
    'awaiting_payout',
    'awaiting_final_payment',
    'pending_agreement',
    'pending_down_payment',
    'chat_negotiation',
    'stuck_in_negotiation',
    'completed',
    'cancelled',
    'flagged'
));

-- Optional: If any projects were stuck with invalid statuses, this helps them recover
UPDATE projects SET status = 'matching' WHERE status NOT IN (
    'pending', 'queued', 'matching', 'assigned', 'waiting_for_client', 'awaiting_down_payment',
    'active', 'in_progress', 'work_started', 'review_samples', 'ready_for_review', 'review',
    'approved', 'awaiting_payout', 'awaiting_final_payment', 'pending_agreement',
    'pending_down_payment', 'chat_negotiation', 'stuck_in_negotiation', 'completed',
    'cancelled', 'flagged'
);
