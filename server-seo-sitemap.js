//  What to expect 
// Successful SEO response (HTML fragment) — server injects this directly into <head>

// example below 
/*
<title>Awesome Page — Example</title>
<meta name="description" content="Short summary for this page." />
<link rel="canonical" href="https://www.example.com/page" />
<meta property="og:title" content="Awesome Page — Example" />
<meta property="og:description" content="OG description for social cards." />
<meta property="og:image" content="https://www.example.com/assets/og-image.jpg" />
<link rel="alternate" href="https://m.example.com/page" />
*/

// Redirection happens on <link rel="alternate" href="<absolute_url>" hreflang="x-default" /> 


// Sitemap response — when the server requests /sitemap-foo.xml 
// it expects a valid XML sitemap (text/xml) and forwards it with Content-Type: application/xml.




// server-seo-sitemap.js (sanitized example)
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 6010;
const BUILD_DIR = path.join(__dirname, "build"); // CRA build output

// ---- 1) static assets handler
function isStaticAsset(url) {
    return path.extname(url) !== "";
}
app.get("*.*", (req, res) => {
    const filePath = path.join(BUILD_DIR, req.path);
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
    res.status(404).end();
});

// ---- 2) sitemap handler (proxy to SEO service)
app.get("/*.xml", async (req, res) => {
    try {
        const fileName = req.path.replace("/", "");
        const apiUrl = `https://YOUR_SEO_API.example.com/GetFileContent?fileName=${fileName}`;

        const resp = await axios.get(apiUrl, { validateStatus: () => true });
        if (resp.status === 200 && resp.data) {
            res.set("Content-Type", "application/xml");
            return res.send(resp.data);
        }
        res.status(404).send("Sitemap Not Found");
    } catch (err) {
        console.error("Sitemap error:", err.message);
        res.status(500).send("Failed to load sitemap");
    }
});

// ---- 3) fetch SEO meta tags (expects server returns HTML fragment)
async function fetchSEOTags(urlPath) {
    const apiUrl = `https://YOUR_SEO_API.example.com/GetSeoMetaTags?url=${encodeURIComponent(urlPath)}`;

    const defaultSEO = `
<!-- Default SEO -->
<title>Your Site — Default Title</title>
<meta name="description" content="Default description" />
<link rel="canonical" href="https://www.example.com${urlPath}" />
`;

    try {
        const resp = await axios.get(apiUrl, { validateStatus: () => true });
        if (resp.status === 200 && resp.data) return resp.data; // raw HTML meta tags
        return defaultSEO;
    } catch (err) {
        console.error("SEO API ERROR:", err.message);
        return defaultSEO;
    }
}

// ---- 4) remove CRA default meta tags so we can inject dynamic ones
function removeDefaultSEOTags(html) {
    return html
        .replace(/<title>[\s\S]*?<\/title>/i, "")
        .replace(/<meta[^>]*name=["']description["'][^>]*>/i, "")
        .replace(/<meta[^>]*name=["']robots["'][^>]*>/i, "")
        .replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, "")
        .replace(/<meta[^>]*property=["']og:[^"']+["'][^>]*>/gi, "")
        .replace(/<meta[^>]*name=["']twitter:[^"']+["'][^>]*>/gi, "");
}

// ---- 5) main HTML handler — inject SEO HTML + optional redirect script
app.get("*", async (req, res) => {
    const urlPath = req.path;
    if (isStaticAsset(urlPath)) {
        return res.sendFile(path.join(BUILD_DIR, urlPath), (err) => {
            if (err) res.status(404).end();
        });
    }

    const indexFile = path.join(BUILD_DIR, "index.html");
    const seoHTML = await fetchSEOTags(urlPath);

    // optional redirect if SEO provider included an <link rel="alternate" href="...">
    let redirectScript = "";
    if (seoHTML) {
        const altMatch = seoHTML.match(/<link\s+rel=["']alternate["']\s+href=["']([^"']+)["']/i);
        if (altMatch && altMatch[1]) {
            const alternateURL = altMatch[1].trim();
            redirectScript = `<script>(function(){ var alt="${alternateURL}"; var cur=window.location.href.replace(/\\/+$/,""); var tgt=alt.replace(/\\/+$/,""); if(alt && cur!==tgt) window.location.href=tgt; })();</script>`;
        }
    }

    fs.readFile(indexFile, "utf8", (err, html) => {
        if (err) return res.status(500).send("Internal Server Error");
        let cleanedHTML = removeDefaultSEOTags(html);
        const finalHTML = cleanedHTML.replace(/<\/head>/i, `\n${seoHTML}\n${redirectScript}\n</head>`);
        res.send(finalHTML);
    });
});

app.listen(PORT, () => {
    console.log(`SEO + Sitemap Server running on port ${PORT}`);
});
