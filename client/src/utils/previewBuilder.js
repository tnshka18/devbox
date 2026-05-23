/**
 * Builds an iframe srcdoc string from the project's files.
 * Inlines CSS and JS, resolves relative src/href references.
 */
export function buildPreviewDoc(files, packages = []) {
  const entryFile = files.find(f => f.name === 'index.html' && f.type === 'file');
  if (!entryFile) {
    return `<html><body style="font-family:sans-serif;padding:2rem;color:#888">
      <h2>No index.html found</h2>
      <p>Create an <strong>index.html</strong> file to see the preview.</p>
    </body></html>`;
  }

  let html = entryFile.content;

  // Inject installed packages as CDN script tags before closing </head>
  if (packages.length > 0) {
    const pkgTags = packages
      .map(p => `<script src="https://unpkg.com/${p.name}@${p.version}"></script>`)
      .join('\n  ');
    html = html.replace('</head>', `  <!-- DevBox Packages -->\n  ${pkgTags}\n</head>`);
  }

  // Inline CSS files (replace <link rel="stylesheet" href="...">)
  html = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, href) => {
      const cssFile = findFile(files, href);
      if (cssFile) return `<style data-src="${href}">\n${cssFile.content}\n</style>`;
      return match;
    }
  );

  // Also handle <link href="..." rel="stylesheet">
  html = html.replace(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*\/?>/gi,
    (match, href) => {
      const cssFile = findFile(files, href);
      if (cssFile) return `<style data-src="${href}">\n${cssFile.content}\n</style>`;
      return match;
    }
  );

  // Inline JS files (replace <script src="...">)
  html = html.replace(
    /<script([^>]*)\ssrc=["'](?!https?:\/\/)([^"']+)["'][^>]*><\/script>/gi,
    (match, attrs, src) => {
      const jsFile = findFile(files, src);
      if (jsFile) return `<script${attrs}>\n${jsFile.content}\n</script>`;
      return match;
    }
  );

  // Inline JSX/Babel files similarly
  html = html.replace(
    /<script([^>]*)\ssrc=["'](?!https?:\/\/)([^"']+\.jsx)["'][^>]*><\/script>/gi,
    (match, attrs, src) => {
      const jsxFile = findFile(files, src);
      if (jsxFile) {
        const babelAttrs = attrs.includes('text/babel') ? attrs : ' type="text/babel"';
        return `<script${babelAttrs}>\n${jsxFile.content}\n</script>`;
      }
      return match;
    }
  );

  // Add devbox error overlay
  const errorOverlay = `
<script>
window.onerror = function(msg, src, line, col, err) {
  var overlay = document.getElementById('__devbox_error__');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__devbox_error__';
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#ff4444;color:#fff;padding:12px 16px;font-family:monospace;font-size:13px;z-index:99999;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = '⚠️ <strong>Error</strong> (line ' + line + '): ' + msg;
};
window.addEventListener('unhandledrejection', function(e) {
  window.onerror(e.reason?.message || String(e.reason), '', 0, 0, e.reason);
});
</script>`;

  html = html.replace('</body>', errorOverlay + '\n</body>');

  return html;
}

function findFile(files, href) {
  // Normalize: remove leading ./ or /
  const normalized = href.replace(/^\.?\//, '');
  return files.find(f => {
    if (f.type !== 'file') return false;
    const fname = f.path.replace(/^\//, '');
    return fname === normalized || f.name === normalized;
  });
}
