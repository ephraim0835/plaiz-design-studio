# Plaiz Design Studio - Price Negotiation & Completion Logic

This document outlines the step-by-step logic from the moment a chat opens to the final project completion and payout.

## 1. Negotiation Phase (Open Chat)
*   **Initial Contact**: Once a worker is assigned, the chat opens. No price is locked yet.
*   **The Proposal**: The worker uses the **Price Proposal** tool in the chat. They define:
    *   **Total Amount**: (e.g., ₦50,000)
    *   **Timeline**: (e.g., 5 Days)
    *   **Deliverables**: A specific list of what will be provided.
*   **Review**: The client receives a proposal card. They can:
    *   **Decline**: If the price is too high or terms aren't right. The worker must then send a revised proposal.
    *   **Accept**: If satisfied with the terms.

## 2. Locking the Agreement
*   **Mutual Consent**: Both the Client and the Worker must click "Agree/Confirm" on the proposal card.
*   **The Lock**: Once both parties agree, the system triggers the `confirm_agreement` logic. This "locks" the price and deliverables, making them official for the project.
*   **Status Update**: The project status shifts to `pending_down_payment`.

## 3. The 40/60 Escrow Model
Plaiz uses a split-payment system to ensure security for both parties.
*   **Down Payment (40%)**: The client pays 40% of the total agreed amount immediately.
    *   *Example*: For a ₦50k project, the client pays ₦20k first.
*   **Work Commences**: Once the 40% is confirmed via Paystack, the project status moves to `in_progress`. The worker is notified that it is safe to start working.

## 4. Delivery & Review
*   **Progress Tracking**: The worker shares updates and samples through the chat.
*   **Revisions**: The client can request revisions if the work doesn't match the agreed deliverables.
*   **Submission**: Once finalized, the worker uploads the final files and marks the project as "Finished."

## 5. Completion & Final Payout
*   **Final Balance (60%)**: Upon approval of the work, the client is prompted to pay the remaining 60% balance.
    *   *Example*: The client pays the final ₦30k.
*   **Project Completion**: Once the final payment is confirmed:
    1.  **Status**: Project moves to `completed`.
    2.  **File Unlock**: High-quality files are released to the client.
    3.  **Automatic Payout (80/20)**: 
        *   The system calculates the worker's 80% share of the **total** project amount.
        *   This amount is automatically logged for payout to the worker's bank account.
        *   The 20% platform fee is retained by Plaiz.
    4.  **Auto-Gallery**: The project is automatically added to the Studio Portfolio (if enabled).

---
*This logic ensures that projects only start with a clear agreement and that workers are guaranteed payment upon successful delivery.*
