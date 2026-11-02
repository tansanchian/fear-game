// Media and dialogue shared by the playable scenes and both notebook views.
// Shared by the playable conversation and its notebook transcript.
const NEIGHBOUR_CONVERSATION = [
  { speaker: 'You', character: null, text: 'Hello, aunty. Have you just moved in?' },
  { speaker: 'Neighbour', character: 'resident', text: 'Yes, only a few days ago. There are still boxes everywhere. Are you here to view a flat?' },
  { speaker: 'You', character: null, text: 'Yes, further down the corridor. Are you having some work done here?' },
  { speaker: 'Neighbour', character: 'resident', text: 'This is the feng shui master I invited. Before I settle everything, I wanted him to look at the place and help me put things right.' },
  { speaker: 'Feng shui master', character: 'master', text: 'I’m looking at the entrance first. There’s a heaviness on the side facing the unit next door… though this flat itself seems quite ordinary.' },
  { speaker: 'You', character: null, text: 'Was there something about the flat that worried you?' },
  { speaker: 'Neighbour', character: 'resident', text: 'I haven’t felt quite settled yet. Maybe it’s just because everything is unfamiliar. I thought making a few changes might help.' },
  { speaker: 'Feng shui master', character: 'master', text: 'For now, I’ve suggested moving her resting area away from that wall. A place can feel unsettled long after the people who lived there have gone. I wouldn’t say more without knowing its history.' },
  { speaker: 'Neighbour', character: 'resident', text: 'Once it’s all arranged, perhaps it will start to feel like home.' },
  { speaker: 'You', character: null, text: 'Thank you, aunty. I’ll leave you both to settle things.' },
];

// These papers belong to the imagined sequence, not either day's inspection budget.
const IMAGINED_EVIDENCE = {
  memoryArticle1: { day: 'imagined', section: 'Imagined corridor', group: 'memoryArticle1', title: 'An old newspaper clipping', description: 'A clipping about Adrian Lim’s execution, encountered in the imagined corridor.', location: 'Stop 2 · On the floor' },
  memoryArticle2: { day: 'imagined', section: 'Imagined corridor', group: 'memoryArticle2', title: 'A page from the trial reporting', description: 'A newspaper page containing a report from the ritual killings trial, encountered in the imagined corridor.', location: 'Stop 5 · On the floor' },
  memoryArticle2Close: { day: 'imagined', section: 'Imagined corridor', group: 'memoryArticle2', title: 'Trial report close-up', description: 'A closer look at the trial report near the bottom of the newspaper page.', location: 'Stop 5 · Newspaper detail' },
};

const ARTIFACT_CONTENT = {
  memoryArticle1: { image: 'assets/hallucination_artifact1.png', title: 'An old newspaper clipping', alt: 'Newspaper clipping reporting Adrian Lim’s execution' },
  memoryArticle2: { image: 'assets/hallucination_artifact2.png', title: 'A page from the trial reporting', alt: 'Newspaper page with a report on the ritual killings trial near the bottom' },
  memoryArticle2Close: { image: 'assets/hallucination_artifact2_zoomed.png', title: 'Trial report close-up', alt: 'Close-up of the newspaper report headed All three of sound mind at the killings' },
  doorChant: {
    type: 'observation', image: 'assets/hdb_door.jpg',
    title: 'Sounds behind the door', alt: 'The viewing unit’s gate, where you heard chanting and decided to stay outside', position: 4,
  },
  neighbourConversation: {
    type: 'conversation', image: 'assets/convo1.png', alt: 'The neighbour who has just moved in',
    transcript: NEIGHBOUR_CONVERSATION, position: 3,
  },
  map: {
    image: 'assets/floor_plan_view.jpg',
    title: 'Floor plan',
    alt: 'Floor plan sign with the block and floor label blurred',
    position: 0,
  },
  flyer: {
    image: 'assets/nearby-listing-flyer.svg',
    title: 'Nearby listing',
    alt: 'For sale flyer for a nearby three-room flat with an asking price of $688,000',
    position: 1,
  },
  murderArticle: {
    image: 'assets/day2-torn-newspaper.png',
    title: 'Torn newspaper fragment',
    alt: 'A worn, torn newspaper fragment with the headline Cops find body of battered boy and a subheading about a ritual killing theory after religious objects were recovered; names remain redacted',
    position: 1,
  },
  flat: {
    image: 'assets/hdb_door.jpg',
    title: 'Flat entrance',
    alt: 'Entrance gate of the flat',
    position: 4,
  },
  filmRequest: {
    image: 'assets/film_request.jpg',
    title: 'Paper on the door',
    alt: 'Letter requesting the use of a home as a filming location',
    position: 4,
  },
  power: {
    image: 'assets/power_box.jpg',
    title: 'Power box',
    alt: 'Power box outside the unit',
    position: 4,
  },
  powerClose: {
    image: 'assets/close_up_power_box.jpg',
    title: 'Meter number',
    alt: 'Close-up of the meter display and serial number',
    position: 4,
  },
};
