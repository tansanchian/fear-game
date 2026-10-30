// Artifact IDs must be unique across days so archived notebook entries stay intact.
// Navigation (the lift, floor plan and flat entrance) is shared between days.
const DAY_CONTENT = {
  1: {
    inspectionLimit: 8,
    evidence: {
      power: { pass: 1, group: 'power', title: 'Power box', description: 'The power box outside the flat.', location: 'Stop 5 · Outside the unit' },
      powerClose: { pass: 1, group: 'power', title: 'Meter number', description: 'A closer view of the meter display and serial number.', location: 'Stop 5 · Outside the unit' },
      flyer: { pass: 2, group: 'flyer', title: 'Nearby listing', description: 'A three-room flat advertised for $688,000.', location: 'Stop 2 · On the door' },
      filmRequest: { pass: 3, group: 'filmRequest', title: 'Filming request', description: 'A letter seeking a home to use as a filming location.', location: 'Stop 5 · Flat entrance' },
    },
    hotspots: {
      'view-shoe-cabinet': 1, 'view-stop-two-plants': 1, 'view-wheelchair': 1,
      'view-wooden-blocks': 2, 'view-trolley': 2,
      'view-door-sign': 3, 'view-hanging-clothes': 3,
      'view-listing-flyer': 'flyer', 'view-power-box': 'power', 'view-film-request': 'filmRequest',
    },
  },
  2: {
    // Supply the new day's assets and interactions here; Day 1 never carries over.
    inspectionLimit: null,
    evidence: {},
    hotspots: {},
  },
};
