# Concrete Memories

An interactive story that starts with a flat listing, continues through a conversation with the agent, and leads into a lift arrival, floor plan, and five-stop corridor explorer.

## Run locally

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

The pages follow this order: `index.html` → `act-1.html` → `agent.html` → `visit.html`. The landing, listing, and agent pages use `styles.css`; the corridor explorer uses `corridor.css` and `scene.css`.

## Corridor controls

The visit begins with a still viewpoint inside the lift. Select “Step out of the lift” to move to the lobby, then “View floor plan” to open the map. Select “Continue to corridor” to start walking. Use the on-screen forward arrow or the up/down arrow keys to move; the lower-left arrow moves back. Drag the view, use left/right arrows to look around, and use the side controls to zoom or reset the view. You can reopen the floor plan at the first stop or choose “See the flat” at the final stop. Each image has a return button; Escape also returns.

`assets/hdb_corridor.MOV` and `assets/hdb_door.jpg` are the corridor and entrance uploads. `assets/stop-01.jpg` through `assets/stop-05.jpg` are the corridor frames. `assets/lift-inside.jpg` and `assets/lift-lobby.jpg` are viewpoints extracted from the lift footage. `assets/floor_plan_view.jpg` is the cropped, blurred floor plan used by the site; `assets/floor_map.jpg` is also blurred so the raw block and floor label is not in the served assets.
