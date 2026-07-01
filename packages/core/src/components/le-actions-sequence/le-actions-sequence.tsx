import { Component, Element, Method, Prop, State, Watch, Event, EventEmitter, Build, h, Listen } from '@stencil/core';

export interface ActionStep {
  /** Selector of the target element, searched strictly within the component's children. */
  target: string;
  /** Action type to execute */
  action: 'click' | 'method' | 'property' | 'attribute' | 'class' | 'event';
  /** Name of the method, property, attribute, class, or event */
  name?: string;
  /** Value for properties/attributes, arguments array for methods, detail for events */
  value?: any;
  /** Delay in milliseconds BEFORE this step is executed */
  delay?: number;
}

/**
 * A non-visual component that runs a sequence of timed actions on its children.
 * Designed for creating automated interaction loops and interactive demos.
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-actions-sequence',
  styleUrl: 'le-actions-sequence.css',
  shadow: false,
})
export class LeActionsSequence {
  @Element() el!: HTMLElement;

  /** Array of ActionStep objects or a JSON string representation. */
  @Prop() steps: ActionStep[] | string = [];

  /** Playback triggers: 'init' (starts immediately), 'in-view' (scrolled into viewport), 'manual'. */
  @Prop() startOn: 'init' | 'in-view' | 'manual' = 'init';

  /** Visibility threshold ratio (0.0 to 1.0) before triggering in-view. */
  @Prop() inViewThreshold: number = 0.5;

  /** Repeat the sequence when finished. */
  @Prop() loop: boolean = false;

  /** Loop delay in milliseconds before restarting the sequence. */
  @Prop() loopDelay: number = 0;

  /** Playback direction. */
  @Prop() direction: 'forward' | 'reverse' | 'alternate' = 'forward';

  /** Output debug logs to console. */
  @Prop() debug: boolean = false;

  /** Pause the sequence when the user hovers over the element. Resumes on mouseleave. */
  @Prop() pauseOnHover: boolean = false;

  /** Pause the sequence when the user interacts (click/focus/drag) inside the element. */
  @Prop() pauseOnInteraction: boolean = false;

  @State() private isPlaying: boolean = false;
  @State() private currentStepIndex: number = 0;

  /** Emitted when the sequence starts playing */
  @Event() leStart!: EventEmitter<void>;
  /** Emitted when a step starts executing */
  @Event() leStep!: EventEmitter<{ index: number; step: ActionStep; target: HTMLElement }>;
  /** Emitted when the sequence finishes */
  @Event() leFinish!: EventEmitter<void>;

  private parsedSteps: ActionStep[] = [];
  private playDirection: 'forward' | 'backward' = 'forward';
  private timeoutId?: any;
  private intersectionObserver?: IntersectionObserver;
  private wasPlayingBeforeHover: boolean = false;

  @Watch('steps')
  parseSteps() {
    if (typeof this.steps === 'string') {
      try {
        this.parsedSteps = JSON.parse(this.steps);
      } catch (e) {
        console.error('[le-actions-sequence] Failed to parse steps JSON:', e);
        this.parsedSteps = [];
      }
    } else if (Array.isArray(this.steps)) {
      this.parsedSteps = this.steps;
    } else {
      this.parsedSteps = [];
    }
  }

  componentWillLoad() {
    this.parseSteps();
    this.resetState();
  }

  componentDidLoad() {
    this.initStartCondition();
  }

  disconnectedCallback() {
    this.clearPlayTimeout();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  /** Start or resume playback of the sequence. */
  @Method()
  async play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.leStart.emit();
    if (this.debug) console.log('[le-actions-sequence] Play started/resumed.');
    this.executeNextStep();
  }

  /** Pause playback at the current step. */
  @Method()
  async pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.clearPlayTimeout();
    if (this.debug) console.log('[le-actions-sequence] Paused at step index:', this.currentStepIndex);
  }

  /** Stop playback and reset to the beginning. */
  @Method()
  async stop() {
    this.isPlaying = false;
    this.clearPlayTimeout();
    this.resetState();
    if (this.debug) console.log('[le-actions-sequence] Stopped and reset.');
  }

  /** Returns status information of the runner. */
  @Method()
  async getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentStepIndex: this.currentStepIndex,
      currentStep: this.parsedSteps[this.currentStepIndex] || null,
      stepsCount: this.parsedSteps.length,
    };
  }

  private resetState() {
    if (this.direction === 'reverse') {
      this.currentStepIndex = Math.max(0, this.parsedSteps.length - 1);
      this.playDirection = 'backward';
    } else {
      this.currentStepIndex = 0;
      this.playDirection = 'forward';
    }
  }

  private initStartCondition() {
    if (this.startOn === 'init') {
      this.play();
    } else if (this.startOn === 'in-view') {
      this.setupIntersectionObserver();
    }
  }

  private setupIntersectionObserver() {
    if (!Build.isBrowser || typeof IntersectionObserver === 'undefined') {
      this.play();
      return;
    }

    const watchElement = this.el;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (this.debug) console.log('[le-actions-sequence] Scrolled in view. Playing.');
            this.play();
          } else {
            if (this.debug) console.log('[le-actions-sequence] Scrolled out of view. Pausing.');
            this.pause();
          }
        });
      },
      { threshold: this.inViewThreshold }
    );

    this.intersectionObserver.observe(watchElement);
  }

  private clearPlayTimeout() {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  private queryTarget(selector: string): HTMLElement | null {
    if (!selector) return null;
    if (selector === 'this' || selector === ':host') return this.el;

    // Search target strictly inside own children (light DOM)
    return this.el.querySelector(selector);
  }

  private async executeNextStep() {
    if (!this.isPlaying) return;

    const n = this.parsedSteps.length;
    if (n === 0) {
      this.isPlaying = false;
      return;
    }

    let outOfBounds = false;
    if (this.playDirection === 'forward') {
      if (this.currentStepIndex >= n) outOfBounds = true;
    } else {
      if (this.currentStepIndex < 0) outOfBounds = true;
    }

    if (outOfBounds) {
      this.leFinish.emit();
      if (this.loop) {
        if (this.debug) console.log(`[le-actions-sequence] Loop triggered. Delaying next iteration by ${this.loopDelay}ms.`);
        
        if (this.direction === 'alternate') {
          if (this.playDirection === 'forward') {
            this.playDirection = 'backward';
            this.currentStepIndex = Math.max(0, n - 2);
          } else {
            this.playDirection = 'forward';
            this.currentStepIndex = Math.min(n - 1, 1);
          }
        } else if (this.direction === 'reverse') {
          this.playDirection = 'backward';
          this.currentStepIndex = n - 1;
        } else {
          this.playDirection = 'forward';
          this.currentStepIndex = 0;
        }

        if (this.loopDelay > 0) {
          this.timeoutId = setTimeout(() => this.executeNextStep(), this.loopDelay);
          return;
        }
      } else {
        if (this.debug) console.log('[le-actions-sequence] Playback finished.');
        this.isPlaying = false;
        return;
      }
    }

    const step = this.parsedSteps[this.currentStepIndex];
    const delay = step.delay ?? 0;

    if (this.debug) {
      console.log(`[le-actions-sequence] Scheduling step ${this.currentStepIndex} in ${delay}ms:`, step);
    }

    this.timeoutId = setTimeout(async () => {
      if (!this.isPlaying) return;

      try {
        await this.runStep(step);
      } catch (e) {
        console.error(`[le-actions-sequence] Error executing step ${this.currentStepIndex}:`, e);
      }

      if (this.playDirection === 'forward') {
        this.currentStepIndex++;
      } else {
        this.currentStepIndex--;
      }

      this.executeNextStep();
    }, delay);
  }

  private async runStep(step: ActionStep) {
    const target = this.queryTarget(step.target);
    if (!target) {
      if (this.debug) console.warn(`[le-actions-sequence] Target element not found: "${step.target}"`);
      return;
    }

    this.leStep.emit({ index: this.currentStepIndex, step, target });

    switch (step.action) {
      case 'click':
        if (typeof target.click === 'function') {
          target.click();
        } else {
          throw new Error('Target has no click() method');
        }
        break;

      case 'method':
        if (!step.name) throw new Error("Method action requires 'name'");
        if (typeof (target as any)[step.name] === 'function') {
          const args = Array.isArray(step.value) ? step.value : (step.value !== undefined ? [step.value] : []);
          await (target as any)[step.name](...args);
        } else {
          throw new Error(`Method "${step.name}" not found on target`);
        }
        break;

      case 'property':
        if (!step.name) throw new Error("Property action requires 'name'");
        (target as any)[step.name] = step.value;
        break;

      case 'attribute':
        if (!step.name) throw new Error("Attribute action requires 'name'");
        if (step.value === null || step.value === undefined) {
          target.removeAttribute(step.name);
        } else {
          target.setAttribute(step.name, String(step.value));
        }
        break;

      case 'class':
        if (!step.name) throw new Error("Class action requires 'name'");
        const mode = step.value || 'toggle';
        if (mode === 'add') {
          target.classList.add(step.name);
        } else if (mode === 'remove') {
          target.classList.remove(step.name);
        } else {
          target.classList.toggle(step.name);
        }
        break;

      case 'event':
        if (!step.name) throw new Error("Event action requires 'name'");
        target.dispatchEvent(
          new CustomEvent(step.name, {
            detail: step.value,
            bubbles: true,
            composed: true,
          })
        );
        break;

      default:
        throw new Error(`Unsupported action type: "${step.action}"`);
    }
  }

  @Listen('mouseenter')
  handleMouseEnter() {
    if (this.pauseOnHover && this.isPlaying) {
      this.pause();
      this.wasPlayingBeforeHover = true;
    }
  }

  @Listen('mouseleave')
  handleMouseLeave() {
    if (this.pauseOnHover && this.wasPlayingBeforeHover) {
      this.play();
      this.wasPlayingBeforeHover = false;
    }
  }

  @Listen('pointerdown')
  handlePointerDown(event: PointerEvent) {
    if (this.pauseOnInteraction && this.isPlaying) {
      this.pause();
      if (this.debug) {
        console.log('[le-actions-sequence] Paused due to user pointerdown interaction on target:', event.target);
      }
    }
  }

  render() {
    return <slot />;
  }
}
