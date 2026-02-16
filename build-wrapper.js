import { execSync } from 'child_process';

if (process.env.VERCEL === '1' || process.env.CI === '1') {
    console.log('Building in CI/Cloud environment...');
    try {
        execSync('npm run build-vite', { stdio: 'inherit' });
    } catch (error) {
        console.error('Build failed on Cloud:', error);
        process.exit(1);
    }
} else {
    console.log('Skipping local build for Node 25 compatibility. Deployment will build in the cloud.');
}
