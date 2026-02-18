# Plaiz Design Studio - System Flow Guide

This document explains the end-to-end lifecycle of a project on the Plaiz platform, from the initial client request to final payment and worker payout.

## 1. Project Initiation
- **Service Selection**: The client selects a service (Graphic Design, Web Design, etc.) on the landing page or dashboard.
- **Availability Check**: The system runs a real-time check (`check_service_availability`) to ensure there is at least one verified and available worker for that category.
- **Submission**: The client provides project details (title, description, budget) and submits the project.

## 2. Intelligent Matching Engine
If auto-assignment is enabled, the system immediately attempts to find the best worker using a weighted scoring algorithm.

### Scoring Factors (Weights)
1. **Skill Match (40%)**: Does the worker specialize in this exact project type?
2. **Rating (25%)**: What is the worker's historical performance (average rating)?
3. **Experience (15%)**: How many projects has the worker successfully completed?
4. **Workload (20%)**: Does the worker have current capacity (active projects vs. max limit)?

### Assignment Logic
- The system identifies the top 3 highest-scoring workers.
- It **randomly selects one** from those top 3 to ensure fairness and distribution of work.
- **Queueing**: If no worker is available, the project is placed in a `queued` status. When a worker toggles their status to "Available," the oldest queued project is automatically assigned to them.

## 3. Collaboration & Chat
- **Instant Connection**: Once a worker is assigned, the project status moves to `in_progress`.
- **System Message**: An automatic welcome message is sent from the worker to the client to start the conversation.
- **Real-time Chat**: Both parties communicate through the integrated chat system to refine the project requirements.

## 4. Payment Flow (Escrow System)
Plaiz uses a split-payment model to protect both the client and the worker.

- **Down Payment (40%)**: Before work starts in earnest, the client pays a 40% deposit via Paystack.
- **Verification**: A secure Edge Function verifies the transaction reference with Paystack before updating the database.
- **Funds Held**: The deposit is held in the system.

## 5. Delivery & Completion
- **Deliverables**: The worker uploads files and assets to the project dashboard.
- **Review**: The client reviews the work and can request revisions.
- **Marking as Finished**: When the worker is ready, they mark the project as "Finished" (`awaiting_final_payment`).

## 6. Final Payment & Payouts
- **Final Balance (60%)**: The client pays the remaining 60% balance.
- **Automatic Split**: Once the final payment is confirmed, the system automatically calculates the split:
    - **Worker Share (80%)**: Disbursed automatically to the worker's bank account via Paystack Payouts.
    - **Platform Fee (20%)**: Retained by Plaiz.
- **Unlocking Files**: Upon final payment, the high-quality files are unlocked for the client to download.
- **Completion**: The project is officially moved to `completed`.

---
*This system ensures high-quality matching, secure payments, and a seamless workflow for both clients and design professionals.*
