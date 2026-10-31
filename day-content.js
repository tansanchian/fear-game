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
    // Day 2 has its own evidence and incidental objects.
    inspectionLimit: null,
    evidence: {
      murderArticle: { pass: 1, group: 'murderArticle', title: 'Newspaper article', description: 'A newspaper report on the execution of Adrian Lim and his accomplices.', location: 'Stop 2 · On the corridor floor' },
      neighbourConversation: { pass: 1, group: 'neighbourConversation', title: 'A new neighbour', description: 'A newly arrived resident has invited a feng shui master to help arrange her home before she settles in.', location: 'Stop 4 · At the neighbour’s door' },
    },
    hotspots: {
      'day2-plant': 1, 'day2-shoe-cabinet-stop2': 1,
      'day2-red-furnace': 2, 'day2-plants-stop4': 2,
      'day2-shoe-cabinet-stop3': 3, 'day2-railing-pots': 3,
      'day2-murder-article': 'murderArticle',
      'day2-neighbour-door': 'neighbourConversation',
    },
  },
};
