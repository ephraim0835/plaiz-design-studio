# Plaiz Design Studio - Special Workflows & Advanced Logic

This document covers the "unhappy paths," edge cases, and automated background logic that keeps the platform running smoothly.

## 1. Revision & Feedback Logic
*   **The Request**: If a client isn't satisfied with a sample, they trigger a "Revision Request."
*   **Status Reset**: The project status is automatically moved back to `work_started`.
*   **The Loop**: This allows the worker to upload new samples without closing the project.
*   **Note**: Revision limits are currently managed via communication; the system allows multiple revisions to ensure client satisfaction.

## 2. Proposal Rejection Workflow
If the client declines a Price Proposal:
*   **RPC Trigger**: The `reject_price_proposal` function is called.
*   **Cleanup**: The current agreement is marked as `rejected`.
*   **Reset**: The project status returns to `assigned`.
*   **Worker Action**: The worker is notified via a system message to submit a new proposal with adjusted terms.

## 3. The "Matching" Algorithm (Idle-Longest-First)
Plaiz uses a fair rotation system to distribute work:
*   **Pool Selection**: The system looks at all active workers with the required skill (e.g., Graphic Design).
*   **Sorting**: It sorts by `last_assigned_at` (Ascending). 
*   **Priority**: The worker who has been "idle" the longest gets the first opportunity to work on a new project.
*   **Failsafe**: If multiple workers have the same idle time, it picks randomly between them.

## 4. Payout Eligibility & Security
*   **Verified Accounts Only**: The system will **never** log a payout for a worker whose bank account is not marked as `is_verified`. 
*   **Audit Trail**: Every payout is logged in the `payout_logs` table with a breakdown of:
    *   **Total Amount** (Agreed price)
    *   **Business Cut** (20% Platform fee)
    *   **Worker Cut** (80% Designer share)
*   **Status Tracking**: Payouts start as `ready_for_transfer` and are marked as `processed` only after manual/automated bank confirmation.

## 5. Cancellation & Disputes
*   **Manual Intervention**: Currently, project cancellations and refunds are handled manually by the **Admin**.
*   **Protection**: Because of the 40/60 split, the platform can mediate disputes by holding the balance or negotiating partial refunds if work was partially delivered.

---
*These advanced logics ensure that the platform is not just a chat app, but a managed marketplace with fair work distribution and financial security.*
