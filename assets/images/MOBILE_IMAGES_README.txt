Place mobile-optimized hero images here to reduce download size for phones.

Filenames (used by CSS):
- home-hero-mobile.png    -> used for the site homepage hero on small screens
- join-hero-mobile.png    -> used for the join CTA hero on small screens

Recommended sizes and guidance:
- Width: 720–1200px (use 800–1000px for most phones, higher if you expect large-screen phones)
- Height: crop to a pleasing focal area (e.g. 800x1000 or 1000x700 depending on layout)
- Compression: export as optimized PNG or WebP (preferred) with quality settings to keep file size small (< 150KB preferred)
- Optionally provide WebP/SVG variants and update CSS or use <picture> with srcset for better performance.

How to use:
- Add images with the exact filenames above into this folder.
- The site CSS will automatically use those mobile files when viewport width is <= 768px.

If you want, I can add a `picture`-based HTML approach and `srcset` examples to your templates so browsers pick the best image automatically.