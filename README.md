# Concrete Memories

An interactive story that starts with a flat listing, continues through a conversation with the agent, and leads into a lift arrival, floor plan, and five-stop corridor explorer.

## Run locally

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

The pages follow this order: `index.html` → `act-1.html` → `agent.html` → `visit.html`. The landing, listing, and agent pages use `styles.css`; the corridor explorer uses `corridor.css` and `scene.css`.

## Corridor controls

### Discovery passes and notebook

The explorer unlocks interactions across three walks. A pass advances only after reaching the opposite end and starting back: stop 5 → 4 starts pass 2; stop 1 → 2 starts pass 3. Short backtracking, opening images, and reviewing the notebook do not advance progress. Unlocked objects remain available.

| Pass | Newly available interactions |
| --- | --- |
| 1 | Shoe cabinet, plants, wheelchair, power box and meter close-up |
| 2 | Wooden blocks, trolley, nearby listing flyer |
| 3 | Unit 491 sign, hanging clothes, filming request at the flat entrance |

The floor plan and flat entrance are always accessible. Existing photographed objects stay visible; their hotspots activate on the specified pass. Added props such as the flyer and unit sign appear when unlocked. Edit `hotspotRules` and the `evidence` metadata in `discovery.js` to change the schedule or add notebook evidence.

Opening an important image records it automatically after a successful load. The notebook groups the meter close-up with the power box, and shows only images already inspected. Dummy objects do not create entries. Notebook image enlargement and review do not change the corridor camera or position. Players can open the notebook at any time. The first arrival at the corridor's end shows one dismissible hint that another walk may reveal new items. The game does not display pass counts or announce later unlocks; subsequent exploration is left to the player.

`sessionStorage` saves passes, direction, discoveries, unread badges, position, camera/artifact view and whether the hint has appeared for this tab. Refresh resumes the visit without repeating the hint; “New game” in the notebook clears the run and restarts the lift. If browser storage is unavailable, exploration and the notebook still work in memory. `discovery.css` styles the notebook and hint.

The visit begins with a short lift-door video that pauses when the doors open. The “Step out of the lift” prompt then moves to the lobby, followed by “View floor plan” to open the map. Select “Continue to corridor” to start walking. Use the on-screen forward arrow or the up/down arrow keys to move; the lower-left arrow moves back. Drag the view, use left/right arrows to look around, and use the side controls to zoom or reset the view. Corridor objects reveal hover cues and dismissible text notes: shoe cabinet and wooden blocks (stop 1), plants (stop 2), trolley (stop 3), wheelchair and unit 491 sign (stop 4), and hanging clothes (stop 5). The flyer on the Stop 2 door opens a full nearby listing for $688,000; Back returns to the corridor. You can reopen the floor plan at the first stop. At the final stop, click the unit door to reveal “See the flat,” or click the power box. The paper on the flat entrance opens the filming request; Back returns to the entrance, then the corridor. The power box view has a “View number close-up” action; Back returns to the full box, then the corridor. Escape follows the same return paths.

`assets/hdb_corridor.MOV` and `assets/hdb_door.jpg` are the corridor and entrance uploads. `assets/stop-01.jpg` through `assets/stop-05.jpg` are the corridor frames. `assets/lift-opening.mp4` is the short door-opening clip; `assets/lift-inside.jpg` is its poster, and `assets/lift-lobby.jpg` is the next viewpoint. `assets/nearby-listing-flyer.svg` is the fictional flyer; `assets/film_request.jpg` is the paper on the entrance; `assets/power_box.jpg` and `assets/close_up_power_box.jpg` are the power box artifact images. `assets/floor_plan_view.jpg` is the cropped, blurred floor plan used by the site; `assets/floor_map.jpg` is also blurred so the raw block and floor label is not in the served assets.
