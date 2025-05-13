export class GamificationStep {
  constructor({
    text,
    highlightElement = null,
    allowInteraction = false,
    showBackground = true,
    modalPosition = 'center',
    validation = null,
    prepare = null,
    completed = null,
    stepData = {},
  }) {
    this.text = text;
    this.highlightElement = highlightElement;
    this.allowInteraction = allowInteraction;
    this.showBackground = showBackground;
    this.modal_position = modalPosition;
    this.validation = validation;
    this.prepare = prepare;
    this.completed = completed;
    this.step_data = stepData;
  }
}
