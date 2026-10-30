# Concrete Memories

An interactive story that starts with a flat listing, continues through a conversation with the agent, and leads into a lift arrival, floor plan, and five-stop corridor explorer.

## Run locally

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

The pages follow this order: `index.html` → `act-1.html` → `agent.html` → `visit.html`. The landing, listing, and agent pages use `styles.css`; the corridor explorer uses `corridor.css` and `scene.css`.

## Imagined corridor

`hallucination.html` is the abandoned-block sequence, styled by `hallucination.css` and controlled by `hallucination.js`. For now, “Follow the thought” appears at the final Day 2 stop after the return walks. It is a temporary bridge while the phone search and stories are still to be added. Those scenes can later lead to `hallucination.html?start=1`, which starts the sequence afresh. Opening `hallucination.html` without that parameter resumes its saved viewpoint.

The original lift-door opening plays and pauses. “Step out of the lift” transitions to an unfamiliar lift lobby, where a short prompt points out the change. The floor display is clickable and plays `hallucination_lift_close.mp4`. “Walk into the corridor” leads through five distinct stills with quick walking transitions, forward/back buttons and up/down arrow keys.

| Viewpoint | Side scene |
| --- | --- |
| Lift lobby | Floor display close-up video |
| Corridor stop 1 | Courtyard seat video, through the outdoor opening |
| Corridor stop 3 | Void deck photograph, through the outdoor opening |
| Corridor stop 5 | Closed gate photograph, by the yellow gate sign |

Each side scene has Back and Escape support. Videos have native playback controls and pause when closed. The final stop offers a return to the real corridor; the return link is also available throughout. Day progress, evidence and inspection allowance are unaffected. This imagined sequence uses a separate session-storage key, cleared by New game. Reduced-motion mode skips automatic video playback and shortens transitions. Images retain their full framing so mobile users can reach the same hotspots.

`hallucination-stop-01.jpg` through `hallucination-stop-05.jpg` were extracted from `hallucination_corridor.mp4` at 0.5, 5, 9.5, 14 and 16.8 seconds. The final frame precedes the passerby visible later in the source. `hallucination-lobby.jpg` comes from `hallucination_lift.mp4` at 1.5 seconds. The two detail-video posters are first-frame extracts. The source clips and the gate/void-deck uploads are preserved. Hotspot locations and side-scene mappings are in `hallucination.js`.

## Corridor controls

### Days and inspection limit

Day 1 allows **eight distinct inspections**. Dummy object notes and newly opened evidence images each count once, including the meter close-up. Walking, the floor plan, the flat entrance, repeat inspections and notebook review are free. An unsuccessful image load spends nothing. With two inspections remaining, the game gives a subtle evening warning.

After the eighth inspection, the player can finish reading. Closing the last note or leaving the evidence image opens the end-of-day reflection. “Head home” leads to a short home scene that mentions only collected evidence. “Return the next morning” fades into a fresh lift opening for Day 2. The story cards can later be replaced by fuller transition scenes.

Day 2 starts with fresh inspections, reveal progress and camera state. **Day 1 artifacts are no longer interactable**, whether collected or missed. The notebook retains collected Day 1 entries with day labels; missed evidence is never added. The floor plan and flat entrance remain shared navigation. Physical objects already in the base photographs stay visible.

The separate artifact sets and inspection limits are configured in `day-content.js`. Day 2 currently has six dummy objects and no cutoff; its important evidence is still to be added. To add an artifact, give it a unique ID in that day's `evidence`, register its button and reveal pass in `hotspots`, and add its image/view and hotspot coordinates in `app.js` and `visit.html`. Dummy objects only need a numeric hotspot rule and a scene hotspot. Never reuse a Day 1 evidence ID for different Day 2 content: notebook images must remain accurate.

The active day, story phase, inspection history, warning and notebook survive refreshes in the same tab. Refresh during the final image keeps it readable; refresh during a story card returns to that card. Older saves retain their discoveries and count already recorded evidence as inspected. “New game” resets both days and the notebook.

### Discovery passes and notebook

The explorer unlocks interactions across three walks. A pass advances only after reaching the opposite end and starting back: stop 5 → 4 starts pass 2; stop 1 → 2 starts pass 3. Short backtracking, opening images, and reviewing the notebook do not advance progress. Unlocked objects remain available.

| Pass | Newly available interactions |
| --- | --- |
| 1 | Shoe cabinet, plants, wheelchair, power box and meter close-up |
| 2 | Wooden blocks, trolley, nearby listing flyer |
| 3 | Unit 491 sign, hanging clothes, filming request at the flat entrance |

The floor plan and flat entrance are always accessible. Existing photographed objects stay visible; their hotspots activate on the specified pass. Added props such as the flyer and unit sign appear when unlocked. Edit the day's `hotspots` and `evidence` in `day-content.js` to change the schedule or add notebook evidence. The table above describes Day 1; all interactions are subject to that day's inspection allowance.

Day 2's incidental objects use the same hover cues and dismissible text notes, without adding notebook entries:

| Pass | Newly available Day 2 objects |
| --- | --- |
| 1 | Plant (stop 1), shoe cabinet (stop 2) |
| 2 | Red furnace (stop 1), plants (stop 4) |
| 3 | Shoe cabinet (stop 3), potted objects along the railing (stop 4) |

The red furnace hotspot covers the small red burner beside the cabinet at stop 1. At stop 4, the foliage and the pots/rack below it have separate targets. Day 2 uses adjusted mobile framing at stops 1, 3 and 4 to keep these objects reachable.

Opening an important image records it automatically after a successful load. The notebook groups the meter close-up with the power box, and shows only images already inspected. Dummy objects do not create entries. Notebook image enlargement and review do not change the corridor camera or position. Players can open the notebook at any time. The first arrival at the corridor's end shows one dismissible hint that another walk may reveal new items. The game does not display pass counts or announce later unlocks; subsequent exploration is left to the player.

`sessionStorage` saves passes, direction, discoveries, unread badges, position, camera/artifact view and whether the hint has appeared for this tab. Refresh resumes the visit without repeating the hint; “New game” in the notebook clears the run and restarts the lift. If browser storage is unavailable, exploration and the notebook still work in memory. `discovery.css` styles the notebook and hint.

The visit begins with a short lift-door video that pauses when the doors open. The “Step out of the lift” prompt then moves to the lobby, followed by “View floor plan” to open the map. Select “Continue to corridor” to start walking. Use the on-screen forward arrow or the up/down arrow keys to move; the lower-left arrow moves back. Drag the view, use left/right arrows to look around, and use the side controls to zoom or reset the view. Corridor objects reveal hover cues and dismissible text notes: shoe cabinet and wooden blocks (stop 1), plants (stop 2), trolley (stop 3), wheelchair and unit 491 sign (stop 4), and hanging clothes (stop 5). The flyer on the Stop 2 door opens a full nearby listing for $688,000; Back returns to the corridor. You can reopen the floor plan at the first stop. At the final stop, click the unit door to reveal “See the flat,” or click the power box. The paper on the flat entrance opens the filming request; Back returns to the entrance, then the corridor. The power box view has a “View number close-up” action; Back returns to the full box, then the corridor. Escape follows the same return paths.

`assets/hdb_corridor.MOV` and `assets/hdb_door.jpg` are the corridor and entrance uploads. `assets/stop-01.jpg` through `assets/stop-05.jpg` are the corridor frames. `assets/lift-opening.mp4` is the short door-opening clip; `assets/lift-inside.jpg` is its poster, and `assets/lift-lobby.jpg` is the next viewpoint. `assets/nearby-listing-flyer.svg` is the fictional flyer; `assets/film_request.jpg` is the paper on the entrance; `assets/power_box.jpg` and `assets/close_up_power_box.jpg` are the power box artifact images. `assets/floor_plan_view.jpg` is the cropped, blurred floor plan used by the site; `assets/floor_map.jpg` is also blurred so the raw block and floor label is not in the served assets.
