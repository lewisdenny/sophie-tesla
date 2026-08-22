const player = document.querySelector("[data-player]");
const statusPanel = document.querySelector(".playback-status");
const statusText = document.querySelector("[data-status]");
const soundButtons = [...document.querySelectorAll("[data-sound]")];

let activeButton = null;
let playbackRequest = 0;

function updateStatus(message, isPlaying = false) {
  statusText.textContent = message;
  statusPanel.classList.toggle("is-playing", isPlaying);
}

function clearActiveButton() {
  if (!activeButton) {
    return;
  }

  activeButton.classList.remove("is-playing");
  activeButton.removeAttribute("aria-pressed");
  activeButton = null;
}

async function playSound(button) {
  const request = ++playbackRequest;
  const label = button.dataset.label;

  player.pause();
  player.currentTime = 0;
  clearActiveButton();

  activeButton = button;
  activeButton.classList.add("is-playing");
  activeButton.setAttribute("aria-pressed", "true");
  updateStatus(`Playing ${label}`, true);

  player.src = button.dataset.sound;
  player.load();

  try {
    await player.play();
  } catch (error) {
    if (request !== playbackRequest) {
      return;
    }

    clearActiveButton();
    updateStatus("Sound couldn't play — tap again");
    console.error("Audio playback failed", error);
  }
}

soundButtons.forEach((button) => {
  button.addEventListener("click", () => playSound(button));
});

player.addEventListener("ended", () => {
  clearActiveButton();
  updateStatus("Ready for another one");
});

player.addEventListener("error", () => {
  clearActiveButton();
  updateStatus("Sound couldn't load — tap again");
});
