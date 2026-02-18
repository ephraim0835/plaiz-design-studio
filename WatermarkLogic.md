# Plaiz Design Studio - File Watermarking Logic

To protect workers' intellectual property and ensure platform security, Plaiz implements a multi-layered "Virtual Watermark" system. This system ensures that clients can review work in high quality but cannot use the files until final payment is confirmed.

## 1. Visual Watermark Layers (Preview Mode)
When a project is in the `review_samples` or `awaiting_final_payment` phase, the system applies the following visual overlays to all image deliverables:

*   **Geometric Mesh Overlay**: A repeating diagonal grid (mesh) is drawn over the entire image using CSS gradients. This makes it impossible to "clean" the background of the image with AI tools easily.
*   **High-Density Text Grid**: The text **"PROPERTY OF PLAIZ STUDIO"** is repeated across the image in a 10x12 grid, rotated at -25 degrees. This ensures no part of the design is usable for cropping.
*   **Soft Blur Filter**: A subtle hardware-accelerated blur (`0.5px`) is applied to the image. It's sharp enough for review but lacks the crispness required for professional use or printing.

## 2. Technical Protection (Anti-Save)
Beyond visual markers, the system blocks common ways of saving images:
*   **Disabled Context Menu**: Right-clicking on the image is disabled (`onContextMenu`).
*   **Transparent Shield**: A transparent, invisible HTML layer is placed on top of the image. When a user tries to "Save Image As" or "Drag" the file, they are interacting with the invisible shield instead of the design itself.
*   **Pointer Block**: Direct interaction with the image element is disabled until the project is completed.

## 3. Dynamic Unlocking Logic
The watermark is **not** permanent; it is a "live" layer controlled by the project status.

*   **Trigger**: The moment the 60% balance payment is confirmed via Paystack, the project status changes to `completed`.
*   **Automatic Removal**: The React component detects the status change and immediately stops rendering the watermark layers and the "invisible shield."
*   **Download Activation**: The "Download" button appears, allowing the client to fetch the original, un-watermarked high-resolution file directly from the secure storage.

## 4. Non-Image Deliverables
For files that cannot be previewed in the browser (e.g., .ZIP, .AI, .PSD, .PDF):
*   These files are hidden entirely from the client until the final payment is confirmed.
*   The system only shows a "File Icon" with the extension name, ensuring the source files remain secure until the project is closed.

---
*This system provides 100% protection for the designer's work while allowing the client to verify every detail of the design before they pay the balance.*
