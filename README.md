# Concrete Memories

An interactive story that starts with an introduction and a flat listing, continues through a conversation with the agent, and leads into a lift arrival, floor plan, and five-stop corridor explorer.

## Run locally

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

The visit page uses a shared version query on its scripts and styles to avoid mixing cached discovery rules with a newer scene. Bump that version in `visit.html` when changing these files together. Reloading keeps the tab's saved progress. The ⓘ panel reports the actual day and corridor stop to help distinguish Day 1 revisits from Day 2; the neighbour conversation is available only on Day 2 at stop 4.

The pages follow this order: `index.html` → `intro.html` → `act-1.html` → `agent.html` → `visit.html`. The introduction establishes the two-day decision and explains movement, interactive objects and the notebook. The landing, introduction, listing, and agent pages use `styles.css`; the corridor explorer uses `corridor.css` and `scene.css`.

## Imagined corridor

After **six distinct Day 2 inspections**, the player finishes their current note, image or conversation before a clickable Reddit post preview appears. Repeat inspections, walking and notebook review do not count. With two Day 2 inspections remaining, a subtle thought about searching online appears; there is no visible counter.

The phone sequence is now a single post preview: click the supplied `assets/hallucination_reddit.png` image to read the full post and `assets/reddit1.jpg`–`assets/reddit3.jpg` comments. The phone-search video is no longer part of the flow; its source file is preserved. Images preload, with loading/retry states, keyboard/touch scrolling and thread enlargement. “Put phone away” or Escape from the opened thread starts the return walk.

`memory-return.html`, `memory-return.js` and `memory-return.css` guide the player back from their actual Day 2 stop, using the real corridor stills in reverse order. There are no new inspections or forward controls during this story transition. Each completed step briefly blends in its imagined counterpart, with stronger impressions nearer the lift. These are single, soft glimpses rather than repeated flashes. Reduced-motion mode omits the overlay and shortens movement; hiding the tab stops active effects. The text connects the comments to the player picturing the block empty. At stop 1, the next step returns to the real lift lobby, then inside the lift. “Wait for the doors to open” starts the existing lift opening on `hallucination.html`; stepping out reveals the unfamiliar lobby.

`memory-journey.js` shares progress using `concrete-memories.memory-journey.v1`: idle → preview → post → retreat → walk → ending → complete. Old prompt/phone saves migrate to the preview. `concrete-memories.return.v1` saves the return position and lift stage; refresh resumes the last completed step. Reopening the visit resumes the active sequence, and entering the hallucination URL early routes back to the return walk. Browser navigation is not blocked. New game clears all sequence progress. The return walk preserves the notebook and does not change the Day 2 inspection count.

`hallucination.html` is the abandoned-block sequence, styled by `hallucination.css` and controlled by `hallucination.js`. The return-to-lift handoff starts it at the lift; later visits resume its saved viewpoint. Direct entry without an active sequence returns to the real visit.

The original lift-door opening plays and pauses. “Step out of the lift” transitions to an unfamiliar lift lobby, where a short prompt points out the change. The floor display is clickable and plays `hallucination_lift_close.mp4`. “Walk into the corridor” leads through five distinct stills with quick walking transitions, forward/back buttons and up/down arrow keys.

| Viewpoint | Side scene |
| --- | --- |
| Lift lobby | Floor display close-up video |
| Corridor stop 1 | Courtyard seat video, through the outdoor opening |
| Corridor stop 2 | Newspaper clipping on the floor |
| Corridor stop 3 | Void deck photograph, through the outdoor opening |
| Corridor stop 4 | Closed gate photograph, by the yellow gate sign |
| Corridor stop 5 | Newspaper page with a trial-report close-up; continue to the ending when ready |

Each side scene has Back and Escape support. Click or tap the marker on the photograph, or use the labeled side-view button at the top right. Hotspots sit in a separate layer from the animated photograph and have at least 48-pixel touch targets. The gate inspection is at stop 4 so the final phone call cannot interrupt it. Videos have native playback controls and pause when closed. After visiting all five viewpoints, “Continue to the end” at stop 5 starts the final phone call. This gives the player time to inspect the newspaper or backtrack; collecting either paper is optional. There is no return to Day 2. Players may backtrack and inspect side scenes before reaching the end; their Back buttons close only that detail. This imagined sequence uses a separate session-storage key, cleared by New game. Reduced-motion mode skips automatic video playback and shortens transitions. Images retain their full framing so mobile users can reach the same hotspots.

`hallucination-stop-01.jpg` through `hallucination-stop-05.jpg` were extracted from `hallucination_corridor.mp4` at 0.5, 5, 9.5, 14 and 16.8 seconds. The final frame precedes the passerby visible later in the source. `hallucination-lobby.jpg` comes from `hallucination_lift.mp4` at 1.5 seconds. The two detail-video posters are first-frame extracts. The source clips and the gate/void-deck uploads are preserved. Hotspot locations and side-scene mappings are in `hallucination.js`.

## Final phone call and decision

After choosing “Continue to the end” at the final imagined viewpoint, a short cellphone ringtone accompanies a popup: the player's wife is calling, snapping them out of the hallucination. “Answer the call” stops the sound and reveals her question about buying the home. The player chooses “I would buy it” or “I would not buy it”, optionally writes up to 1,200 characters of thoughts, and selects “Finish the story”. Neither answer is preselected or treated as correct. The closing screen shows their choice and reflection, with a “Play again” button that starts a fresh game from the landing page.

`game-ending.js` controls the call, decision and closing screen. Draft responses and completed choices are stored only in this tab under `concrete-memories.ending.v1`; nothing is sent to a server. Refresh restores the current screen and text without replaying the ringtone. “Review notebook” is available during the house decision and on the closing screen. It shows only collected evidence, including image enlargement, collected meter variants and the neighbour conversation transcript. Newspapers found during the imagined walk appear under “Imagined corridor”, separately from Day 1 and Day 2. Closing it returns to the same decision and typed reflection, without changing discoveries, inspection counts or sound history. Empty runs show an empty notebook. The notebook data remains in storage until a new game. Reopening `visit.html` after the ending starts resumes the ending rather than reopening Day 2. Older walk saves at stop 5 can inspect the new newspaper before choosing to continue; saves already in the ending resume the call or decision.

`assets/phone-ring.mp3` is an original synthesized 3.6-second chime, played once at 45% volume when the ending begins, respecting the corridor sound preference. Answering, hiding the tab or leaving the page stops it. If playback is blocked, “Play ringtone” allows a manual retry; answering remains available even if audio cannot load. The call and decision block corridor navigation, including keyboard movement and Escape, while keeping normal browser navigation available. New game clears the ending and discovery state.

## Corridor controls

### Days and inspection limit

Day 1 allows **eight distinct inspections**. Dummy object notes and newly opened evidence images each count once, including the meter close-up. Walking, the floor plan, the flat entrance, repeat inspections and notebook review are free. An unsuccessful image load spends nothing. With two inspections remaining, the game gives a subtle evening warning.

After the eighth inspection, the player can finish reading. Closing the last note or leaving the evidence image opens the end-of-day reflection. “Head home” leads to a short home scene that mentions only collected evidence. “Return the next morning” fades into a fresh lift opening for Day 2. The story cards can later be replaced by fuller transition scenes.

Day 2 starts with fresh inspections, reveal progress and camera state. **Day 1 artifacts are no longer interactable**, whether collected or missed. The notebook retains collected Day 1 entries with day labels; missed evidence is never added. The floor plan and flat entrance remain shared navigation. Physical objects already in the base photographs stay visible.

The separate artifact sets and inspection limits are configured in `day-content.js`. Day 2 currently has eight dummy objects, a newspaper article, a neighbour conversation and an observation at the viewing unit’s gate. Its `inspectionLimit: 6` starts the phone/imagined-corridor sequence, which leads to the final decision and ends the game. To add an artifact, give it a unique ID in that day's `evidence`, register its button and reveal pass in `hotspots`, and add its image/view and hotspot coordinates in `app.js` and `visit.html`. Dummy objects only need a numeric hotspot rule and a scene hotspot. Never reuse a Day 1 evidence ID for different Day 2 content: notebook images must remain accurate.

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
| 1 | Plant (stop 1), shoe cabinet (stop 2), trolley (stop 3) |
| 2 | Red furnace (stop 1), plants (stop 4), hanging clothes (stop 5) |
| 3 | Shoe cabinet (stop 3), potted objects along the railing (stop 4) |

The red furnace hotspot covers the small red burner beside the cabinet at stop 1. At stop 4, the foliage and the pots/rack below it have separate targets. Day 2 uses adjusted mobile framing at stops 1 and 3. Stop 4 shows the full photograph on mobile so both the near-left conversation gate and the railing plants stay reachable.

Day 2 also has a newspaper lying on the corridor floor at stop 2, available on the first walk. Clicking it opens the supplied `assets/ritual_newspaper.png` with zoom and Back controls and records it in the notebook. Reading stays silent. Once collected, the first walk away from or past that unit triggers faint children's laughter once. Later passes in either direction do not repeat it. The cue can finish as the player continues walking. Opening an artifact or notebook, muting, hiding the tab or leaving the page stops it. Closing an image, zooming, refreshing and notebook review never trigger playback. A failed corridor image load also does not trigger it.

`corridor-effects.js` chooses effects after completed movement; `corridor-audio.js` plays them through one shared channel, so location sounds replace rather than overlap one another. Collection, successfully played cues and the sound preference survive refreshes. Each location sound plays only once per run, on the first qualifying movement after its clue is collected. Muted or failed playback does not consume the cue; it remains available for a later passage. If browser playback is blocked, the speaker offers a retry for that passage; subsequent movement or opening an image clears that pending retry. New game clears the article, so the player must discover it again. Existing saves retain their recorded effect history. Previously recurring laughter and buzz were not tracked, so an older run may hear them once after this update before their played flags are saved.

`assets/children-laughter.mp3` is adapted from Joseph SARDIN's [Laughter of children, sound 1660](https://bigsoundbank.com/laughter-of-children-s1660.html), published by BigSoundBank under CC0 (public domain). The [source MP3](https://bigsoundbank.com/UPLOAD/mp3/1660.mp3) was slowed to 88% speed with a corresponding pitch shift, filtered to 300–2400 Hz, and given three soft echoes (190, 390 and 610 ms) with gradual fades. The roughly six-second cue plays at 12% volume. Replace the local MP3 to use a different recording.

### Neighbour conversation

On Day 2, stop 4, the dark metal gate with the oval scrollwork beside the wheelchair is clickable from the first walk. A small “Talk to neighbour” cue marks the gate until the conversation is collected; afterward the label appears on hover. This interaction belongs to the normal Day 2 corridor, not the hallucination sequence. Clicking opens an agent-style dialogue with the new resident (`assets/convo1.png`) and the feng shui master (`assets/convo2.png`). The supplied images are used without changing the source files. The fictional conversation covers moving in, feeling unsettled and inviting the master to help arrange the flat.

Click the dialogue box, or focus it and press Enter/Space, to continue. Previous line revisits earlier dialogue; Back and Escape return to the same stop and camera view. Corridor audio and navigation pause while the dialogue is open. Refresh resumes the current line. If an image fails to load, Back remains available and no discovery is recorded.

“Save conversation & return” on the final line records **A new neighbour** once in the notebook. Leaving early does not collect it. Its notebook entry contains the complete speaker-labelled transcript rather than an enlarged image, and review does not replay audio, move the camera or add inspections. It counts as one important clue for the Day 2 colour treatment. New game clears it. Edit `NEIGHBOUR_CONVERSATION` in `artifact-content.js` to change the dialogue; the playable scene and notebook use the same text. Styling is in `neighbour-conversation.css`, and the door coordinates are in `app.js`.

### Day 2 atmosphere

Day 1 notebook discoveries unlock these Day 2 reactions; missed clues do not. They do not change artifact availability or spend inspections.

| Memory | Reaction | Repetition |
| --- | --- | --- |
| Power box or meter close-up | Approaching stop 5 plays a low electrical buzz; the photograph gently dims and recovers over 2.8 seconds. | Buzz and dimming each occur once per run. |
| Filming request | Leaving stop 5 for stop 4 plays indistinct voices from behind the player, followed by a soft shutter-like click. | Once after successful playback; muted or blocked attempts do not consume it. |
| At least two distinct important clues | Corridor photographs gradually lose warmth and saturation over later walks. | Strength depends on collected clue groups and the first eight completed Day 2 movements. |

Colour strength is `min(1, max(0, clueGroups - 1) / 3) * min(day2Steps, 8) / 8`. The power box and meter close-up count as one clue group. At maximum, saturation is 65%, brightness 94%, and a cool overlay reaches 10% opacity. Changes ease over six seconds. Only the photograph layer is graded; controls, hotspot labels, notebook images, the lift and the hallucination sequence retain their existing appearance. There is no visible fear or progress meter.

`discovery.js` saves `effectsSeen` and `day2Steps` alongside the notebook. Refreshing does not replay cues; New game clears all effect history. Reading, notebook review, muting or hiding the page stops sound. Reading, opening the notebook, leaving the viewpoint or hiding the page cancels the temporary dimming. Reduced-motion mode skips the dip and uses a static colour grade. The speaker controls all corridor cues; muting still allows the visual effects.

`assets/electrical-buzz.mp3` is an original synthesized five-and-a-half-second hum with 100, 150 and 300 Hz components and gradual fades, played at 22% volume. `assets/behind-door-voices.mp3` uses a short excerpt of [Small Restaurant Conversations, sound 3542](https://bigsoundbank.com/small-restaurant-conversations-s3542.html) by Joseph SARDIN & Axeline T., released under CC0 by BigSoundBank ([source MP3](https://bigsoundbank.com/UPLOAD/mp3/3542.mp3)). The excerpt starts at 35 seconds, is filtered to 180–650 Hz with light echo and fades, and is followed by an original synthesized soft click. The resulting 6.2-second cue plays at 28% volume. These processed local files are served without runtime requests to an external audio provider. Cue paths, captions and volumes are in `corridor-effects.js`.

Opening an important image records it automatically after a successful load. The notebook groups the meter close-up with the power box, and shows only images already inspected. Dummy objects do not create entries. Notebook image enlargement and review do not change the corridor camera or position. Players can open the notebook at any time. The first arrival at the corridor's end shows one dismissible hint that another walk may reveal new items. The game does not display pass counts or announce later unlocks; subsequent exploration is left to the player.

`sessionStorage` saves passes, direction, discoveries, unread badges, position, camera/artifact view and whether the hint has appeared for this tab. Refresh resumes the visit without repeating the hint; “New game” in the notebook clears the run and restarts the lift. If browser storage is unavailable, exploration and the notebook still work in memory. `discovery.css` styles the notebook and hint. `notebook-view.js` renders the shared read-only viewer; `artifact-content.js` supplies the media and dialogue for both the corridor and ending so evidence stays consistent.

The visit begins with a short lift-door video that pauses when the doors open. The “Step out of the lift” prompt then moves to the lobby, followed by “View floor plan” to open the map. Select “Continue to corridor” to start walking. Use the on-screen forward arrow or the up/down arrow keys to move; the lower-left arrow moves back. Drag the view, use left/right arrows to look around, and use the side controls to zoom or reset the view. Corridor objects reveal hover cues and dismissible text notes: shoe cabinet and wooden blocks (stop 1), plants (stop 2), trolley (stop 3), wheelchair and unit 491 sign (stop 4), and hanging clothes (stop 5). The flyer on the Stop 2 door opens a full nearby listing for $688,000; Back returns to the corridor. You can reopen the floor plan at the first stop. At the final stop, click the unit door to reveal “See the flat,” or click the power box. The paper on the flat entrance opens the filming request; Back returns to the entrance, then the corridor. The power box view has a “View number close-up” action; Back returns to the full box, then the corridor. Escape follows the same return paths.

`assets/hdb_corridor.MOV` and `assets/hdb_door.jpg` are the corridor and entrance uploads. `assets/stop-01.jpg` through `assets/stop-05.jpg` are the corridor frames. `assets/lift-opening.mp4` is the short door-opening clip; `assets/lift-inside.jpg` is its poster, and `assets/lift-lobby.jpg` is the next viewpoint. `assets/nearby-listing-flyer.svg` is the fictional flyer; `assets/film_request.jpg` is the paper on the entrance; `assets/power_box.jpg` and `assets/close_up_power_box.jpg` are the power box artifact images. `assets/floor_plan_view.jpg` is the cropped, blurred floor plan used by the site; `assets/floor_map.jpg` is also blurred so the raw block and floor label is not in the served assets.

### Viewing-unit door encounter

On Day 2, open the flat entrance at stop 5, then hover over or tap the metal gate to peek inside. A small lean towards the photograph accompanies low, wordless chanting, muffled like a television or radio further inside. The written observation appears after a brief pause: the player steps back and decides not to enter. No interior scene opens. Reduced-motion mode omits the lean.

This adds **Sounds behind the door** to the notebook and counts as one inspection. If it is inspection six, the Reddit preview waits until “Stay outside” or Escape closes the encounter. Leaving before the observation appears does not collect it. Reopening the gate, reloading a completed encounter and reading its notebook entry are silent and cost no additional inspection. The entry, with the gate photograph and the complete observation, is also available from the final decision notebook.

`door-encounter.js` manages this encounter separately from movement-triggered corridor cues. `assets/door-chant.mp3` is an original synthesized, wordless vocal effect, filtered and echoed to resemble sound through a closed door, played once at 38% volume. It respects the shared sound preference, offers a manual playback retry if blocked, and stops when dismissed, when the tab is hidden or on page exit. The same written description is available with sound off or if the audio fails; it still records the observation. An unfinished encounter is not automatically replayed on refresh.

### Newspapers and atmosphere in the imagined corridor

Stop 2 has `assets/hallucination_artifact1.png`; stop 5 has `assets/hallucination_artifact2.png`. Both appear as papers on the floor with hover/focus cues, generous touch targets and a matching top-right reading button. The second newspaper has “View article close-up” for `assets/hallucination_artifact2_zoomed.png`. Enlarge/Fit and scroll work for all three images. Back and Escape return from the close-up to the full page, then to the same corridor stop. Loading errors offer a retry and never add a discovery.

Successful inspection records the paper in the notebook. The close-up belongs to the second paper and is included only after it has been viewed. Notes appear during the walk and in the ending notebook with an “Imagined corridor” label; they do not consume Day 1/Day 2 inspections or rewrite the original clues. The extended `concrete-memories.imagined.v1` state saves collected image IDs and successfully played effect IDs alongside scene/visited stops. Refresh restores these without playing sounds. New game clears them with the rest of the imagined sequence.

`memory-atmosphere.js` adds short, original synthesized cues: `assets/memory-radio.mp3` is a pronounced paper crackle followed by a swelling radio-like murmur and a distinct static burst (4 seconds, 52–55% volume); `assets/memory-footsteps.mp3` has three deliberately spaced heel-and-sole impacts with longer corridor echoes (4.6 seconds, 60–65% volume). Both files have stronger masters with peak headroom and clearer midrange for smaller speakers. Each paper gives one discovery cue, and the first movement past its location after reading can give one footstep cue. Later passes and notebook/repeat-image review remain silent. A blocked cue is not consumed and can be retried with “Play sound”; moving away or closing the reader cancels the pending retry. Muted walking cues remain available on a later passage.

The first qualifying passage also gently dims the photograph over 2.6 seconds; each newspaper slightly reduces corridor saturation and brightness. Article images, controls and notebook pages remain unchanged. Reduced-motion mode omits the dimming and uses a static colour grade. Sound respects the shared mute preference, with controls both in the corridor and article reader. Audible footsteps finish across subsequent walking steps; failed or pending playback retries still expire on movement. Cues stop on reader open/close, opening the notebook, muting, tab hiding, page exit and the final phone call; sounds never overlap the ending ringtone. No rapid flashes, looping audio or forced reading timer are used.
