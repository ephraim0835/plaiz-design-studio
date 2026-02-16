@echo off
echo ==========================================
echo Plaiz Studio - Payout Feature Setup
echo ==========================================
echo.
echo This script will set your Paystack Secret and deploy the Edge Function.
echo You may be asked to log in to Supabase via browser.
echo.

:ask_key
set /p PAYSTACK_KEY="Paste your Paystack Secret Key (sk_test_...): "
if "%PAYSTACK_KEY%"=="" goto ask_key

echo.
echo [1/2] Setting secret (PAYSTACK_SECRET_KEY)...
call npx supabase secrets set PAYSTACK_SECRET_KEY=%PAYSTACK_KEY%

echo.
echo [2/2] Deploying 'verify-bank-account' function...
call npx supabase functions deploy verify-bank-account --no-verify-jwt

echo.
echo ==========================================
echo Deployment Finished!
echo.
echo IMPORTANT: Don't forget to run the SQL migration in your Supabase Dashboard!
echo File: supabase/payouts_schema_migration.sql
echo ==========================================
pause
