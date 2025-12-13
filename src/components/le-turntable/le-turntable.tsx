import { Component, Element, Prop, Listen, h, Watch } from '@stencil/core';

@Component({
  tag: 'le-turntable',
  styleUrl: 'le-turntable.css',
  shadow: true,
})
export class LeTurntable {
  // host element
  @Element() el: HTMLElement;

  // transform origin
  // gets the same values as transform-origin css property
  @Prop() center: string = 'center';

  // transform rotate
  @Prop() value: number = 0;

  @Watch('value')
  updateValue(newValue) {
    if (!this.rotating) {
      this.currentAngle = parseFloat(newValue);
      this.setAngle(this.currentAngle);
    }
  }

  /**
   * Internal state
   *
   * using properties instead of @State decoratorm
   * because we are only changing styles of the element and don't
   * need the element to be rerendered
   */

  // indicates is the element being manually rotated right now
  rotating = false;

  // coordinates of the transform origin in pixels
  centerX: number;
  centerY: number;

  // element page (body?) offset in pixels
  pageX: number;
  pageY: number;

  currentAngle: number = 0;
  // angle at the start of the drag
  startAngle: number;

  /**
   * Event listeners
   */
  handleMouseDown(evt: MouseEvent) {
    // set rotating mode on
    this.rotating = true;

    // get start angle
    //   getting pageX/Y, because when the element is transformed
    //   relative values are useless
    this.startAngle = this.getAngle(evt.pageX, evt.pageY);

    // cancel the event to prevent text selection
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  }

  /**
   * Fires when the mouse moves
   * checks is the element rotating right now and if it is
   * then calc the current angle and rotate the element
   *
   * TODO: attach events only after the dragStart?
   */
  @Listen('mousemove', { target: 'window' })
  handleMouseMove(evt: MouseEvent) {
    if (this.rotating) {
      // calc angle update and rotate element
      this.setAngle(this.currentAngle + (this.getAngle(evt.pageX, evt.pageY) - this.startAngle));
      return false;
    }
  }

  @Listen('mouseup', { target: 'window' })
  handleMouseUp(evt: MouseEvent) {
    if (this.rotating) {
      const angle = this.currentAngle + (this.getAngle(evt.pageX, evt.pageY) - this.startAngle);
      this.setAngle(angle);
      this.currentAngle = angle;
      this.rotating = false;
      return false;
    }
  }

  // on window resize the center should be recalculated
  @Listen('resize', { target: 'window' })
  handleWindowResize() {
    this.getTransformOrigin();
  }

  /**
   * Component lifecycles
   */
  componentDidLoad() {
    this.el.style.transformOrigin = this.center;
    this.currentAngle = this.value;

    this.getTransformOrigin();
    this.setAngle(this.currentAngle);
  }

  componentDidUpdate() {
    this.getTransformOrigin();
  }

  /**
   * Calculates the transform origin of the component
   * and the page offset in pixels
   *
   * We'll need these values to calculate the angle of pointer event
   */
  getTransformOrigin() {
    // transform origin
    [this.centerX, this.centerY] = window
      .getComputedStyle(this.el, null)
      .transformOrigin.split(' ')
      .map(val => Math.round(parseFloat(val)));
    // page offset
    let t = null;
    const scrollContainer = ((t = document.documentElement) || (t = document.body.parentNode)) && typeof t.scrollLeft === 'number' ? t : document.body;
    const clientRects = this.el.getBoundingClientRect();
    this.pageX = Math.round(clientRects.left + scrollContainer.scrollLeft);
    this.pageY = Math.round(clientRects.top + scrollContainer.scrollTop);
  }

  /**
   * Calculates current angle
   *
   * @param {number} posX  horizontal mouse position
   * @param {number} posY  vertical mouse position
   */
  getAngle(posX: number, posY: number) {
    const x = posX - this.pageX - this.centerX;
    const y = posY - this.pageY - this.centerY;
    const angle = Math.round(((Math.atan2(y, x) * 180) / Math.PI) * 100) / 100;
    return angle;
  }

  setAngle(angle) {
    this.el.style.transform = `rotate(${angle}deg)`;
  }

  render() {
    return (
      <div class="turntable" onMouseDown={this.handleMouseDown.bind(this)}>
        <slot />
      </div>
    );
  }
}
