# AntiGravity AI - Official Orchestration Manual (FINAL)

This document is the **final definitive logic** for AntiGravity AI. It governs all project workflows for Plaiz Design Studio.

## 1. Printing & Physical Projects
*   **Payment**: **100% Upfront payment** is mandatory before any work or production begins.
*   **Fees**: The **10% Platform Fee** is deducted from the **worker’s profit**, not added to the client price.
*   **Logistics**: Workers are prompted to manually add a **Delivery/Logistics fee** to their total quote.
*   **Milestone**: Project status is only moved to `completed` once the client clicks **"Confirm Receipt"** for the physical product.

## 2. Reassignment & Negotiation Flows
*   **The Workflow**: 
    1.  Worker sends Proposal.
    2.  Client: `Accept`, `Revision`, or `Reassign`.
    3.  Worker: `Accept` or `Decline` (if budget/terms are unfit).
*   **Loop Protection**: The system tracks reassignment attempts. If a consensus isn't reached after **3 reassignments**, the project is flagged for **Admin mediation**.
*   **Abuse Prevention**: Clients who frequently reassign or reject proposals have their **Priority Score** lowered. The AI may enforce a **Mandatory Budget Selection** for their future projects to ensure intent.

## 3. Hybrid Matching & Dynamic Learning
*   **Learned Skills**: Worker profiles are dynamically updated by the AI based on:
    *   Initial self-declarations.
    *   Successful project completions in new niches.
    *   Reasons for "Cannot Do This" (identifying current skill boundaries).
*   **Hybrid Logic**: For projects requiring multiple skill sets, the AI matches workers whose **Combined Learned Profile** fits all project requirements.

## 4. Work Protection & Labels
All digital previews (images, websites, docs) must display:
> **"Preview Mode — Files unlock after final payment"**

*   Files remain locked with watermarks/blur until the specific payment milestone for that project type is met.

## 5. Manual Payout Control
*   **Calculation**: The system provides a breakdown for the Admin: **Total Amount**, **Worker Share**, and **Platform Share**.
*   **The Action**: All payouts are **Manual**. No funds move until the Admin clicks **"Paid"**.
*   **Closure**: Clicking "Paid" closes the project and triggers a real-time notification to the worker.

## 6. Notification & Device Alerts
Real-time, device-level notifications are enforced for:
*   **Workers**: Assignment, window-expiry reminders, revisions, and "Paid" status.
*   **Clients**: Proposal readiness, revision updates, and payment/completion reminders.
*   **Admins**: Pending payouts, flagged ratings, and stuck negotiations.

## 7. Cloud-Managed Free AI Architecture (24/7 Operation)
To ensure the system works even when your computer is **off**, we use Cloud APIs with permanent free tiers. No local hardware is required.

*   **Primary Logic & Analysis**: **Google Gemini 1.5 Flash** (via Google AI Studio).
    *   **Cost**: Free (15 Requests Per Minute).
    *   **Capability**: Analyzes project briefs, hybrid skills, and moderators.
*   **Fast Chat & Summarization**: **Llama 3 (8B/70B)** via **Groq Cloud**.
    *   **Cost**: Free (within rate limits).
    *   **Capability**: Instant response generation for chat and proposal summaries.
*   **Deployment**: These are called via **Supabase Edge Functions**, ensuring the studio's brain stays online 24/7.

---
*Confirmed and Adopted by AntiGravity AI.*
