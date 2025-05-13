export class GamificationFlow {
  constructor(name, steps = []) {
    this.name = name;
    this.steps = steps;
  }

  addStep(step) {
    this.steps.push(step);
  }

  getStep(index) {
    return this.steps[index];
  }

  get length() {
    return this.steps.length;
  }
}
