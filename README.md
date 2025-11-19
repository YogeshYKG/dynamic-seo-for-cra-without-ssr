# 🚀 dynamic-seo-for-cra-without-ssr || express-seo-injector-cra

A high-impact case study demonstrating how to add **dynamic SEO meta tags** and **sitemap support** to a large, existing Create React App (CRA) or any Single Page Application (SPA), without requiring a costly migration to Next.js or full Server-Side Rendering (SSR).

This repository contains the **sanitized source code** for the lightweight Express proxy server used in the solution.

## 🎯 The Problem

Create React App (CRA) builds a single, static `index.html`. For applications with thousands of dynamic routes (e.g., `/products/123`, `/articles/xyz`), the default `<head>` content is the same for every page.

* **Result:** Poor Search Engine Optimization (SEO), lack of correct social media previews (Open Graph tags), and difficulty managing sitemaps for large, dynamic content sets.

## ✨ The Solution: Proxy and Inject

We placed a small **Express.js proxy layer** in front of the static CRA build. This layer intercepts all non-static requests, fetches the page-specific SEO metadata (as an HTML fragment) from a central SEO service, injects it into the original `index.html`, and sends the optimized HTML to the client/crawler.

### **Key Features**

* **Dynamic Meta Tag Injection:** Fetches `<title>`, `<meta>`, and Open Graph tags per URL.
* **Sitemap Proxying:** Handles requests for `/*.xml` files by proxying to the SEO service.
* **Safe Redirects:** Handles canonical and optional redirects via client-side script injection.
* **Fallback:** Uses a `defaultSEO` block for API failures (to prevent blank pages).

### **Architecture Diagram (End-to-End Flow)**

This visual summarizes the entire request flow for both static and dynamic content.



*For the full explanation, code review, and implementation details, including performance metrics and security checks, see the complete case study:* **[Link to Your Full Dev.to / Hashnode Article Here]**

---

## 💻 Sanitized Server Code (`server-seo-sitemap.js`)

The core logic is contained in a single Express file. It handles static asset requests, sitemap proxying, SEO fetching, and final HTML injection.

> **Note:** Real domains and environment secrets have been replaced with placeholders like `YOUR_SEO_API.example.com` to preserve the logic without exposing sensitive details.

```javascript
// server-seo-sitemap.js (sanitized example)
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 6010;
const BUILD_DIR = path.join(__dirname, "build"); 

// ---- 1) static assets handler
function isStaticAsset(url) {
    return path.extname(url) !== "";
}
// ... (rest of static asset handler) ...

// ---- 2) sitemap handler (proxy to SEO service)
app.get("/*.xml", async (req, res) => {
// ... (rest of sitemap handler logic using axios) ...
});

// ---- 3) fetch SEO meta tags
async function fetchSEOTags(urlPath) {
// ... (rest of fetchSEOTags logic) ...
}

// ---- 4) remove CRA default meta tags
function removeDefaultSEOTags(html) {
// ... (rest of regex removal logic) ...
}

// ---- 5) main HTML handler — inject SEO HTML + optional redirect script
app.get("*", async (req, res) => {
// ... (full request handling, injection, and response logic) ...
});

app.listen(PORT, () => {
    console.log(`SEO + Sitemap Server running on port ${PORT}`);
});
```

## **Architecture Diagram (End-to-End Flow)**

### **Prerequisites**
You must have **Node.js** and **npm** installed.

### **Clone the repo**
```
git clone https://github.com/YogeshYKG/dynamic-seo-for-cra-without-ssr.git
```
### **Install dependencies**
```
npm install
```

### **Configure environment** variables: Create a file named .env in the root directory based on the provided .env.example.
```
cp .env.example .env
```

### **Start the server**
```
npm start
```


The server will run on the port specified in your .env file (default: http://localhost:6010).

## **🚦 Security & Performance Checklist. **

This proxy pattern requires robust checks:

✅ Caching: Highly recommended to cache SEO API responses (e.g., using Redis or an in-memory store) to minimize latency on every request.
✅ Timeouts: Use short timeouts (1–2s) on API calls to prevent slow SEO services from blocking the HTML response.
✅ Sanitization: Strict validation/sanitization of the returned HTML fragment is crucial to prevent XSS (only allow expected <title>, <meta>, <link> tags).
✅ Monitoring: Log cache hit ratio, API latency, and error rates.