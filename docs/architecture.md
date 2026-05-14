# Embed Guide

How to add the Tayo360 AI Assistant widget to your existing website.

---

## TL;DR

Paste this before `</body>` in your site:

```html
<script src="https://your-cdn.example.com/tayo360-widget.js" defer></script>
```

The widget self-injects into the page. A floating launcher appears in the bottom-right corner.

---

## Step-by-Step

### 1. Host the widget file

You have three options:

#### Option A — host on your own site (recommended)

1. Copy `widget/tayo360-widget.js` to a public folder on your site (e.g. `/assets/js/`).
2. Reference it by its public URL: `<script src="/assets/js/tayo360-widget.js" defer></script>`.

#### Option B — host on a CDN

Upload `tayo360-widget.js` to any CDN (Cloudflare R2, AWS S3 + CloudFront, jsDelivr from a public GitHub repo, etc.) and reference its public URL.

#### Option C — paste inline

If you can't host the file, paste the entire contents of `tayo360-widget.js` between `<script>` and `</script>` tags directly in your HTML. Not recommended for caching reasons.

### 2. Add the script tag

Place the tag **before the closing `</body>` tag** in your site template:

```html
<!-- … your site … -->

  <script src="/assets/js/tayo360-widget.js" defer></script>
</body>
</html>
```

If you use WordPress, paste it into your theme's `footer.php`, or use a plugin like _Insert Headers and Footers_.

If you use Webflow, paste it into the project's _Custom Code → Before `</body>` tag_ field.

If you use Squarespace, paste it into _Settings → Advanced → Code Injection → Footer_.

If you use a static site generator (Hugo, Jekyll, 11ty), place it in the base layout template.

### 3. (Optional) Configure the widget

Add a config script **before** the widget script:

```html
<script>
  window.Tayo360Config = {
    webhookUrl: 'https://your-n8n.example.com/webhook/tayo360-lead',
    brandName: 'Tayo360',
    botName: 'Tayo360 Assistant',
    primaryColor: '#0a2540',
    accentColor: '#1a73a8'
  };
</script>
<script src="/assets/js/tayo360-widget.js" defer></script>
```

The order matters — `Tayo360Config` must exist before the widget script runs.

### 4. (Optional) Trigger from existing buttons

Add the `data-tayo360-open` attribute to any existing element on your site:

```html
<button data-tayo360-open>Talk to our AI assistant</button>
<a href="#" data-tayo360-open>Chat with us</a>
```

Clicking it opens the widget panel.

### 5. (Optional) Control from JavaScript

After the widget loads, a global `Tayo360` object is available:

```js
Tayo360.open();
Tayo360.close();
Tayo360.toggle();
```

---

## Verifying the install

1. Reload your site.
2. You should see a floating chat button in the bottom-right corner with a subtle pulse animation.
3. Click it. A panel slides up with a greeting from the Tayo360 Assistant.
4. Click any quick-action button and step through the conversation.
5. Complete the lead-capture flow.
6. Open your browser's DevTools → Console. You'll see a structured `Lead captured` table.

If `webhookUrl` is configured, the lead is also POSTed to your n8n endpoint.

---

## Common issues

### The widget doesn't appear

- Verify the script tag is **inside `<body>`** (not inside `<head>` without `defer`).
- Check the browser console for 404 errors on the script URL.
- Make sure no Content Security Policy is blocking inline styles. The widget injects styles via `<style>` — most CSPs allow this, but a strict `style-src 'self'` policy will block it. Add `'unsafe-inline'` to your `style-src` directive, or extract the CSS to a separate file.

### The widget appears but the launcher is hidden behind other elements

The widget uses `z-index: 2147483646` (effectively max). If something on your site is still on top, you have a `position: fixed` element with `z-index: 2147483647` — adjust it.

### The conversation doesn't progress

Open DevTools → Console and look for JavaScript errors. The widget logs all lead captures, so if you see the captured-lead table, the flow worked correctly.

### Leads aren't reaching n8n

- Confirm `webhookUrl` is set correctly in `Tayo360Config`.
- Confirm the n8n workflow is **Active** (not just saved).
- Check the n8n execution log for failed runs.
- Test the webhook directly with `curl`:

  ```bash
  curl -X POST https://your-n8n.example.com/webhook/tayo360-lead \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","email":"test@example.com"}'
  ```

---

## CSP-friendly install (advanced)

If your site enforces a strict Content Security Policy, extract the injected CSS into a separate file and serve it with the rest of your styles:

1. Open `widget/tayo360-widget.js`.
2. Copy the `CSS` template literal contents.
3. Save them to `tayo360-widget.css`.
4. Remove the `injectStyles()` call.
5. Add `<link rel="stylesheet" href="tayo360-widget.css">` to your site.

The widget will then run cleanly under a `style-src 'self'` policy.

---

## Uninstalling

Remove the `<script>` tag from your template. The widget leaves no persistent storage, no cookies, and no service workers behind.