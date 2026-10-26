# Corridor Walk

A Street View style corridor walk made from five still frames across the supplied video. Each move uses a short zoom and dissolve to reach a new recorded viewpoint. The first stop opens a floor plan with its block and floor label blurred. At the final stop, “See the flat” turns left to the supplied doorway photo. Both image views have a Back to corridor action.

## Run locally

From this directory, run `python3 -m http.server 8000` and open `http://localhost:8000`.

Use the on-screen forward arrow or the up/down arrow keys to move. The lower-left arrow moves back. Drag the view, use left/right arrows to look around, and use the side controls to zoom or reset the view. Choose “View floor plan” at the start or “See the flat” at the final stop. Each image has a Back to corridor button; Escape also returns.

`assets/hdb_corridor.MOV` and `assets/hdb_door.jpg` are the original corridor and entrance uploads. `assets/stop-01.jpg` through `assets/stop-05.jpg` are the corridor frames. `assets/floor_plan_view.jpg` is the cropped, blurred floor plan used by the site; `assets/floor_map.jpg` is also blurred so the raw label is not in the served assets.
