# Plaiz Design Studio Website

A modern, professional Design Studio website built with React, Vite, and Supabase.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Configuration

1.  **Set up Environment Variables**:
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
      *(Or manually create a `.env` file based on `.env.example`)*
    - Fill in the required values in `.env`:
        - `VITE_SUPABASE_URL`: Your Supabase project URL.
        - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
        - `VITE_RESEND_API_KEY`: API key for Resend email service.
        - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!).

### Running the Project

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the build using:

```bash
npm run preview
```

## Tech Stack

-   **Frontend**: React, Vite, TypeScript
-   **Styling**: Tailwind CSS
-   **Backend**: Supabase
-   **Icons**: Lucide React
