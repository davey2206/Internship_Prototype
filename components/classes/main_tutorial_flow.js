import { GamificationFlow } from './gamification_flow.js';
import { GamificationStep } from './gamification_step.js';

export class MainTutorialFlow extends GamificationFlow {
  constructor({ updateUserMenu, closeAnimalInfoWindow, animals }) {
    super('main-tutorial');
    this.dependencies = { updateUserMenu, closeAnimalInfoWindow, animals };
    this.initializeSteps();
  }

  initializeSteps() {
    // Welcome step
    this.addStep(
      new GamificationStep({
        text: 'Welcome to the Animal Tracker! Let’s start with a quick tour.',
        modalPosition: 'center',
        prepare: async () => {
          this.dependencies.updateUserMenu(false);
          this.dependencies.closeAnimalInfoWindow();
        },
      })
    );

    // Menu button step
    this.addStep(
      new GamificationStep({
        text: 'Click the menu button to see your animals and manage your Kukus.',
        highlightElement: '#menu-button',
        allowInteraction: true,
        modalPosition: 'top',
        validation: async () => {
          const element = document.querySelector('#animal-select-panel');
          if (!element) return false;
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.display !== 'none';
        },
      })
    );

    // Animal overview step
    this.addStep(
      new GamificationStep({
        text: 'Here you see all animals available for adoption, including those that you are already tracking.',
        modalPosition: 'bottom',
      })
    );

    // Adopt button step
    this.addStep(
      new GamificationStep({
        text: 'When you want to adopt a new animal, click the button.',
        highlightElement: '.animal-buy-now-button',
        modalPosition: 'center',
      })
    );

    // Kuku balance step
    this.addStep(
      new GamificationStep({
        text: 'Here is your Kuku balance, these coins are used for adopting new animals. Every day you scan your Kukudushi, you will earn Kukus',
        highlightElement: '.kukus-container',
        modalPosition: 'bottom',
      })
    );

    // Close menu step
    this.addStep(
      new GamificationStep({
        text: 'Close the animal care center',
        highlightElement: '#menu-button',
        allowInteraction: true,
        modalPosition: 'top',
        validation: async () => {
          return (
            document.querySelector('#animal-select-panel')?.style.display ===
            'none'
          );
        },
      })
    );

    // Animal portrait step
    this.addStep(
      new GamificationStep({
        text: 'Click on the highlighted turtle’s portrait to fly to its current track.',
        highlightElement: '[data-clickable-marker="true"]',
        allowInteraction: true,
        modalPosition: 'top',
        validation: async () => {
          var infoBox = document.getElementById('custom-infobox-container');
          return infoBox != null;
        },
        prepare: async () => {
          const turtleAnimal = this.dependencies.animals.find((animal) =>
            animal.species.toLowerCase().includes('turtle')
          );
          console.log('Found turtle animal:', turtleAnimal);

          if (turtleAnimal) {
            const stepData = {
              used_animal_original: { ...turtleAnimal },
              used_animal_id: turtleAnimal.id,
            };

            turtleAnimal.is_owned = true;

            return stepData;
          }
        },
        completed: async (stepData) => {
          if (stepData?.used_animal_id && stepData?.used_animal_original) {
            const animal = this.dependencies.animals.find(
              (a) => a.id === stepData.used_animal_id
            );
            if (animal) {
              Object.assign(animal, stepData.used_animal_original);
            }
          }
        },
      })
    );

    // Animal info step
    this.addStep(
      new GamificationStep({
        text: 'Each animal has detailed information telling you about its life’s journey.',
        highlightElement: '#custom-infobox-container',
        modalPosition: 'top',
      })
    );

    // Close info step
    this.addStep(
      new GamificationStep({
        text: 'Close the animal information panel',
        highlightElement: '.side-bar-close',
        allowInteraction: true,
        modalPosition: 'top',
        validation: async () => {
          const animalInfoWindow = document.querySelector(
            '#custom-infobox-container'
          );
          return !animalInfoWindow;
        },
      })
    );

    // Navigation instruction steps
    this.addStep(
      new GamificationStep({
        text: 'With gestures you navigate the globe. To move around, tap and hold a finger on the globe, then move your finger in any direction.',
        allowInteraction: true,
        modalPosition: 'top',
      })
    );

    this.addStep(
      new GamificationStep({
        text: 'You can zoom by pinching your fingers on the globe. Move the fingers away from eachother to zoom in. When you move them towards each other, you zoom out.',
        allowInteraction: true,
        modalPosition: 'top',
      })
    );

    this.addStep(
      new GamificationStep({
        text: 'You can pan by resting two fingers on the screen and dragging them up or down to change the perspective of the globe.',
        allowInteraction: true,
        modalPosition: 'top',
      })
    );

    // Reset globe step
    this.addStep(
      new GamificationStep({
        text: 'You can use this button to reset the globe to its default perspective.',
        highlightElement: '#center-globe-button',
        allowInteraction: true,
        modalPosition: 'top',
      })
    );
  }
}
