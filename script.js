const dialogueBox = document.querySelector("#dialogue-box");
const speaker = document.querySelector("#speaker");
const dialogueText = document.querySelector("#dialogue-text");
const continueText = document.querySelector("#continue-text");

const conversation = [
  {
    speaker: "Agent",
    text: "Hello! Another person is viewing the property with you today.",
  },
  {
    speaker: "Agent",
    text: "Eh, wait—he just left suddenly.",
  },
  {
    speaker: "You",
    text: "That was strange. Which floor is the unit on?",
  },
  {
    speaker: "Agent",
    text: "It is on the 13th floor. I'll show you the unit upstairs.",
  },
  {
    speaker: "You",
    text: "The 13th floor? Is there some feng shui issue?",
  },
  {
    speaker: "Agent",
    text: "13th floor is just superstition only lah.",
  },
  {
    speaker: "You",
    text: "Did anything happen in this flat before?",
  },
  {
    speaker: "Agent",
    text: "Old flat—every old flat also got something happen before.",
  },
  {
    speaker: "Agent",
    text: "The owner is moving out soon and wants a quick sale. This is an exclusive price for you, but let me know within five days.",
  },
  {
    speaker: "Agent",
    text: "Let's go visit the flat.",
    destination: "visit.html",
  },
];

let messageIndex = 0;
let activeDestination = null;

if (dialogueBox && speaker && dialogueText && continueText) {
  dialogueBox.addEventListener("click", () => {
    if (activeDestination) {
      window.location.href = activeDestination;
      return;
    }

    if (messageIndex >= conversation.length) return;

    const message = conversation[messageIndex];
    speaker.textContent = message.speaker;
    dialogueText.textContent = message.text;
    dialogueBox.classList.toggle("dialogue-agent", message.speaker === "Agent");
    dialogueBox.classList.toggle("dialogue-user", message.speaker !== "Agent");
    messageIndex += 1;

    if (message.destination) {
      activeDestination = message.destination;
      dialogueBox.classList.add("final-dialogue");
      continueText.textContent = "Click to visit →";
    }
  });
}
