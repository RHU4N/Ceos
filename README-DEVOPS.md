# DevOps Configuration

This document describes the CI/CD setup for the Ceos project, including automated builds and deployments to Vercel.

## Overview

The project uses GitHub Actions to automatically:
- Install dependencies
- Run linting (if configured)
- Run tests
- Build the production bundle
- Deploy to Vercel

## Required GitHub Secrets

To enable automatic deployments, the following secrets must be configured in the GitHub repository settings (Settings → Secrets and variables → Actions):

### Required Secrets

1. **VERCEL_TOKEN**
   - Your Vercel authentication token
   - Get it from: https://vercel.com/account/tokens
   - Create a new token with appropriate permissions

2. **VERCEL_ORG_ID**
   - Your Vercel organization/team ID
   - Find it in your Vercel project settings or `.vercel/project.json` after linking locally

3. **VERCEL_PROJECT_ID**
   - Your Vercel project ID
   - Find it in your Vercel project settings or `.vercel/project.json` after linking locally

## Getting Vercel IDs

To obtain your `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`:

1. Install Vercel CLI: `npm install -g vercel`
2. Link your project: `vercel link` (follow the prompts)
3. Check the generated `.vercel/project.json` file for the IDs
4. Add these IDs as GitHub secrets
5. **Important**: Add `.vercel` to your `.gitignore` to avoid committing these IDs

## Workflow Details

### Trigger Events

- **Push to main branch**: Runs full CI pipeline and deploys to production
- **Pull requests to main**: Runs full CI pipeline and creates a preview deployment

### CI Steps

1. **Install dependencies**: `npm ci` (clean install from lock file)
2. **Lint**: `npm run lint` (if lint script exists in package.json)
3. **Test**: `npm test` with `--passWithNoTests` flag
4. **Build**: `npm run build` creates production bundle

### Deployment

- Production deployments use `vercel --prod`
- Preview deployments (PRs) use `vercel` without `--prod` flag
- All deployments use the `--confirm` flag to skip interactive prompts

## Configuration Files

### `.vercelignore`
Excludes unnecessary files from Vercel deployment (dependencies, build artifacts, secrets).

### `vercel.json`
Configures Vercel build settings:
- Build command: `npm run build`
- Output directory: `build`
- Framework: Create React App
- Includes route rewrites for single-page application (SPA) routing

### `.github/workflows/vercel-deploy.yml`
GitHub Actions workflow definition with CI/CD pipeline.

## Vercel Project Setup

If your project is not yet connected to Vercel:

1. Go to https://vercel.com
2. Import your GitHub repository
3. Vercel will automatically detect the Create React App framework
4. Configure environment variables if needed
5. Deploy!

Alternatively, you can link locally:
```bash
npm install -g vercel
vercel link
vercel deploy --prod
```

## Customization

If your project uses different npm scripts, update the workflow file:
- Lint command: Line with `npm run lint`
- Test command: Line with `npm test`
- Build command: Line with `npm run build`

## Troubleshooting

### Build Failures
- Check the Actions tab in GitHub for detailed error logs
- Ensure all dependencies are listed in `package.json`
- Verify the build works locally: `npm ci && npm run build`

### Deployment Failures
- Verify all three secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID) are set
- Check that the Vercel token has not expired
- Ensure the Vercel project exists and is linked to the correct repository

### Test Failures
- The workflow runs tests with `--passWithNoTests` to allow projects without tests
- To enforce tests, remove this flag from the workflow file
- Run tests locally: `CI=true npm test`

## Security Notes

- Never commit the `.vercel` directory or any files containing tokens/secrets
- Keep your VERCEL_TOKEN secure and rotate it periodically
- Use GitHub's encrypted secrets for sensitive data
- Review and approve pull requests before merging to avoid malicious deployments

## Support

For issues with:
- **GitHub Actions**: Check the Actions tab in your repository
- **Vercel deployment**: Check Vercel dashboard and logs
- **Project build**: Run `npm run build` locally for debugging

For more information:
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
