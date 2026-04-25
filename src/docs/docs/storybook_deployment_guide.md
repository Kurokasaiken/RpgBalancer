# Storybook Deployment Guide

## 🚀 Deployment Options

### Static Build Deployment

The RPG Balancer Storybook can be deployed as a static site to various platforms.

## 📦 Build Process

### Local Build

```bash
# Build static Storybook
npm run build-storybook

# Output directory:storybook-static
```

### Build Configuration

The build is configured in `.storybook/main.ts`:

```typescript
export default {
  // Build output directory
  outputDir: 'storybook-static',
  
  // TypeScript configuration
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  
  // Documentation generation
  docs: {
    autodocs: 'tag',
  },
};
```

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **vercel.json Configuration**
   ```json
   {
     "buildCommand": "npm run build-storybook",
     "outputDirectory": "storybook-static",
     "installCommand": "npm install",
     "framework": null
   }
   ```

### Netlify

1. **Build Settings**
   - Build command: `npm run build-storybook`
   - Publish directory: `storybook-static`
   - Node version: `20.19.6`

2. **netlify.toml**
   ```toml
   [build]
     command = "npm run build-storybook"
     publish = "storybook-static"
   
   [build.environment]
     NODE_VERSION = "20.19.6"
   ```

### GitHub Pages

1. **GitHub Actions Workflow**
   ```yaml
   name: Deploy Storybook
   on:
     push:
       branches: [main]
       paths: ['src/ui/**', '.storybook/**']
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20.19.6'
         - run: npm ci
         - run: npm run build-storybook
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./storybook-static
   ```

### AWS S3

1. **Deploy Script**
   ```bash
   # Build and deploy to S3
   npm run build-storybook
   aws s3 sync storybook-static s3://your-bucket-name --delete
   ```

2. **CloudFront Invalidation**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## 🔧 Environment Configuration

### Production Build

For production deployments, use optimized build:

```bash
# Production build with optimizations
NODE_ENV=production npm run build-storybook
```

### Environment Variables

Configure these environment variables for deployment:

```bash
# Node.js version
NODE_VERSION=20.19.6

# Build optimization
NODE_ENV=production

# Storybook configuration
STORYBOOK_ENV=production
```

## 📊 Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build-storybook -- --webpack-stats-json
npx webpack-bundle-analyzer storybook-static/webpack-stats.json
```

### Optimization Tips

1. **Code Splitting**: Stories are automatically split
2. **Image Optimization**: Use optimized images in stories
3. **Bundle Size**: Monitor and reduce bundle size
4. **Caching**: Enable browser caching headers

## 🔍 Accessibility Testing in CI

### Automated Testing

Add accessibility tests to CI pipeline:

```yaml
# .github/workflows/storybook.yml
- name: Run Accessibility Tests
  run: |
    npm run test-storybook -- --maxWorkers=1
    # Upload test results
    upload-artifact: accessibility-results
```

### Test Configuration

Configure test runner for CI:

```typescript
// .storybook/test-runner.ts
const config: TestRunnerConfig = {
  // CI-specific configuration
  maxWorkers: 1,
  timeout: 60000,
  
  // Accessibility testing
  async postVisit(page, _context) {
    await checkA11y(page, {
      detailedReport: true,
      verbose: true,
    });
  },
};
```

## 🛡️ Security Considerations

### Content Security Policy

Configure CSP headers for Storybook:

```html
<!-- storybook-static/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline';">
```

### Access Control

For private deployments:

1. **Authentication**: Use platform-specific auth
2. **IP Restrictions**: Limit access to specific IPs
3. **VPN**: Require VPN for internal access

## 📈 Monitoring and Analytics

### Usage Analytics

Track Storybook usage:

```javascript
// .storybook/preview.js
import { addons } from '@storybook/addons';

addons.setConfig({
  // Custom analytics configuration
  enableShortcuts: true,
  showToolbar: true,
});
```

### Performance Monitoring

Monitor build and runtime performance:

```bash
# Build performance
time npm run build-storybook

# Runtime performance
npm run storybook -- --no-open
```

## 🔗 Integration with Development Workflow

### Pre-commit Hooks

Add accessibility checks to pre-commit:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test-storybook -- --maxWorkers=1"
    }
  }
}
```

### Pull Request Checks

Automate Storybook deployment for PRs:

```yaml
# Deploy preview for each PR
- name: Deploy Storybook Preview
  if: github.event_name == 'pull_request'
  run: |
    npm run build-storybook
    # Deploy to preview environment
```

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Accessibility tests pass
- [ ] Bundle size is acceptable (<10MB)
- [ ] All stories render correctly
- [ ] Performance metrics are good
- [ ] Security headers are configured
- [ ] Error tracking is enabled
- [ ] Backup strategy is in place
- [ ] Rollback plan is documented

## 🔄 Maintenance

### Regular Updates

- **Storybook Version**: Keep Storybook updated
- **Addon Updates**: Update accessibility and testing addons
- **Node Version**: Use supported Node.js version
- **Dependencies**: Regular security updates

### Monitoring

- **Build Success**: Monitor build success rate
- **Performance**: Track load times and bundle size
- **Accessibility**: Monitor a11y test results
- **Usage**: Track developer engagement

---

This deployment guide ensures reliable, secure, and performant Storybook deployments for the RPG Balancer project.
