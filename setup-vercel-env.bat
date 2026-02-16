@echo off
echo Setting up Vercel Environment Variables...
echo.

REM Set VITE_SUPABASE_URL for all environments
vercel env add VITE_SUPABASE_URL production preview development --force
echo https://fxdzfxvoowioiisnuwbn.supabase.co

REM Set VITE_SUPABASE_ANON_KEY for all environments
vercel env add VITE_SUPABASE_ANON_KEY production preview development --force
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZHpmeHZvb3dpb2lpc251d2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjI5NTUsImV4cCI6MjA4MjQzODk1NX0.kPjPQMBN-Nu4Jz2TFREE7Dc4YKie4ow0t5S8ZNCvdm0

echo.
echo Done! Environment variables have been set for Production, Preview, and Development.
echo Now redeploy your project with: npx vercel --prod
pause
