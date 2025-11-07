# Security & Performance Guide

## Quick Reference

This guide covers the security (CSP) and performance (Web Vitals) features implemented in Phase 4.

---

## Content Security Policy (CSP)

### What is CSP?

Content Security Policy is a security standard that helps prevent Cross-Site Scripting (XSS), clickjacking, and other code injection attacks by defining which sources of content are allowed to be loaded.

### How it Works

CSP is implemented in three layers:
1. **Meta tag** in `index.html` (backup)
2. **HTTP headers** in `nginx.conf` (global)
3. **HTTP headers** in `nginx-site.conf` (site-specific)

### Configuration

CSP is automatically enabled. To disable (not recommended):

```bash
# .env
VITE_ENABLE_CSP=false
```

### Current Policy

**Development:**
- Allows `unsafe-eval` and `unsafe-inline` for Vite HMR
- Allows WebSocket connections to localhost

**Production:**
- Strict policy with minimal unsafe directives
- Only allows trusted sources
- Forces HTTPS upgrades

### Viewing CSP Violations

Open browser console and look for CSP violation warnings. They will also be logged by the app.

### Common Issues

**Issue:** Inline script blocked
- **Solution:** Move script to external file or add nonce

**Issue:** External resource blocked
- **Solution:** Add source to CSP whitelist in `src/shared/lib/security/csp.ts`

**Issue:** Google OAuth not working
- **Solution:** Ensure `https://accounts.google.com` is in `script-src` and `frame-src`

---

## Web Vitals Monitoring

### What are Web Vitals?

Web Vitals are a set of metrics that measure real-world user experience. They help identify performance bottlenecks.

### Core Metrics

#### 1. LCP (Largest Contentful Paint)
**What it measures:** Loading performance
- ✅ Good: <2.5s
- ⚠️ Needs Improvement: 2.5-4s
- ❌ Poor: >4s

**How to improve:**
- Optimize images (compress, lazy load)
- Reduce server response time
- Use CDN for static assets
- Minimize render-blocking resources

#### 2. INP (Interaction to Next Paint)
**What it measures:** Responsiveness to user interactions
- ✅ Good: <200ms
- ⚠️ Needs Improvement: 200-500ms
- ❌ Poor: >500ms

**How to improve:**
- Minimize JavaScript execution time
- Use React.memo() for expensive components
- Debounce/throttle event handlers
- Split long tasks into smaller chunks

#### 3. CLS (Cumulative Layout Shift)
**What it measures:** Visual stability (unexpected layout shifts)
- ✅ Good: <0.1
- ⚠️ Needs Improvement: 0.1-0.25
- ❌ Poor: >0.25

**How to improve:**
- Set explicit width/height for images
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS aspect-ratio

### Viewing Metrics

**Development:**
Metrics are automatically logged to console with ratings:
```
✅ Web Vital: LCP = 1.8s (good)
⚠️ Web Vital: INP = 350ms (needs-improvement)
❌ Web Vital: CLS = 0.15 (poor)
```

**Production:**
Metrics are ready to be sent to backend analytics endpoint (TODO).

### Programmatic Access

```typescript
import { getWebVitalsSummary, areWebVitalsHealthy } from '@/shared/lib/monitoring';

// Get current metrics
const metrics = await getWebVitalsSummary();
console.log('LCP:', metrics.LCP);
console.log('INP:', metrics.INP);
console.log('CLS:', metrics.CLS);

// Check if performance is good
const isHealthy = await areWebVitalsHealthy();
if (!isHealthy) {
  console.warn('Performance needs improvement!');
}
```

### Configuration

```bash
# .env
VITE_ENABLE_WEB_VITALS=true  # Enable tracking
```

---

## Best Practices

### Security

1. **Always use HTTPS in production**
   - CSP includes `upgrade-insecure-requests` directive

2. **Review CSP violations regularly**
   - Check console in development
   - Monitor violations in production logs

3. **Minimize use of 'unsafe-inline'**
   - Use nonces for inline scripts/styles
   - Move inline code to external files

4. **Keep dependencies updated**
   - Security vulnerabilities are often fixed in updates

### Performance

1. **Monitor Core Web Vitals**
   - Check console in development
   - Set up alerts for production

2. **Optimize images**
   - Use WebP format
   - Compress images
   - Use lazy loading

3. **Code splitting**
   - Already implemented via route-based splitting
   - Review bundle sizes with `npm run build:analyze`

4. **Minimize JavaScript**
   - Remove unused dependencies
   - Use tree-shaking
   - Defer non-critical scripts

5. **Use React best practices**
   - Memoize expensive computations
   - Use React.lazy() for code splitting
   - Avoid unnecessary re-renders

---

## Debugging

### CSP Issues

**Check CSP policy:**
```typescript
import { getCSPDirectives, generateCSPHeader } from '@/shared/lib/security/csp';

const directives = getCSPDirectives();
console.log(directives);

const header = generateCSPHeader(directives);
console.log(header);
```

**Listen for violations:**
CSP violations are automatically logged. Check the browser console.

### Performance Issues

**Check specific metric:**
```typescript
import { getWebVitalsSummary } from '@/shared/lib/monitoring';

const metrics = await getWebVitalsSummary();
const lcp = metrics.LCP;

console.log('LCP value:', lcp.value);
console.log('LCP rating:', lcp.rating);
console.log('LCP threshold:', lcp.threshold);
```

**Use Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run audit for Performance
4. Review Core Web Vitals section

---

## Environment Variables

```bash
# .env

# Enable CSP (default: true)
VITE_ENABLE_CSP=true

# Enable Web Vitals tracking (default: true)
VITE_ENABLE_WEB_VITALS=true
```

---

## Files Reference

### CSP
- **Implementation:** `src/shared/lib/security/csp.ts`
- **Meta tag:** `index.html`
- **HTTP headers:** `nginx.conf`, `nginx-site.conf`
- **Exports:** `src/shared/lib/security/index.ts`

### Web Vitals
- **Implementation:** `src/shared/lib/monitoring/webVitals.ts`
- **Exports:** `src/shared/lib/monitoring/index.ts`
- **Initialization:** `src/main.tsx`

---

## Resources

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web.dev CSP](https://web.dev/csp/)
- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/vitals-measurement-getting-started/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## FAQ

**Q: Why do we need CSP?**
A: CSP prevents XSS attacks by restricting which scripts can run and where resources can be loaded from.

**Q: Why is 'unsafe-inline' needed?**
A: Google OAuth requires inline scripts, and TailwindCSS uses inline styles. Future improvement: use nonces.

**Q: What if Web Vitals shows poor performance?**
A: Check the specific metric and follow the improvement suggestions. Use Chrome DevTools Lighthouse for detailed analysis.

**Q: Can I disable CSP or Web Vitals?**
A: Yes, via environment variables, but not recommended for production.

**Q: How do I send Web Vitals to backend?**
A: Update `sendMetricToAnalytics()` in `src/shared/lib/monitoring/webVitals.ts` to send to your analytics endpoint.

**Q: What's the difference between FID and INP?**
A: FID is deprecated. INP is the new metric that better captures interactivity across the entire page lifetime.
