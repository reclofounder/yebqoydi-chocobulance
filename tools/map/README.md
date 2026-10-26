# How the service area is made

`src/map/service-area.json` is Tashkent city's official border (OpenStreetMap relation 2216724) on the west and
north, cut inside the city along the real streets and waterways nearest to a line the client drew. These scripts
are the ones used on 2026-10-26, kept so the area can be redrawn the same way. Run them in order from a scratch
folder, with Python, Pillow, numpy, scipy, shapely, networkx and scikit-image.

1. Download the border: `curl -A "<who you are>" https://api.openstreetmap.org/api/0.6/relation/2216724/full.json -o city-full.json`.
   Put the client's screenshot (any map showing the red city border and their blue line) in `SCREENSHOT_DIR`
   as `13.jpg`, and run `1-city-and-strokes.py`: the city polygon (`city.geojson`), and the red and blue
   strokes of the screenshot. Mask anything else red on it (pins, logos) in the script.
2. `2-georeference.py`: fits the city border onto the red stroke (scale and offset, iterated nearest-point
   matching; Web Mercator, so square pixels). It prints the fit (about 1.6 px median here, 19 m per px).
3. `3-drawn-line.py`: the blue line as a polygon in coordinates, and the stretch of it more than 500 m from
   the city border (the part that runs inside the city).
4. Download roads, waterways and railways around that stretch from the Overpass API into `feat.json`
   (`way[highway~motorway|trunk|primary|secondary|tertiary|*_link|unclassified]`, `way[waterway~river|canal]`,
   `way[railway=rail]`, `out geom`), then run `4-route-and-cut.py`: the cheapest path along them that stays
   close to the drawn stretch (cost = length x (1 + (distance / 180 m)^2), nothing beyond 1.2 km), extended
   to the border at both ends, cuts the city; the western piece is the service area.

Then simplify to about 10 m (the area moved by 0.001%) and write the GeoJSON with its `source` note, as in the
current file. Check the result over the screenshot before shipping it.
