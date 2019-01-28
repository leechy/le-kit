import { Component, Element, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'le-round-progress',
  styleUrl: 'le-round-progress.css',
  shadow: true
})
export class LeRoundProgress {
  // host element
  @Element() el: HTMLElement;

  // progress value coming from an attribute
  @Prop() value: number = 0;

  @Watch('value')
  updateValue(newValue: string) {
    this.value = parseFloat(newValue);
  }

  @State() params: {
    width: number;
    diameter: number;
    circumference: number;
  }

  /**
   * Component lifecycles
   *
   * Before the component is loaded, we need to calculate and update params
   * using the component size (width of the round progress)
   * and progress width (max of )
   */
  componentWillLoad() {
    // get element width
    const width = this.el.getBoundingClientRect().width;
    // find the thickest stroke and calc diameter of the circle based on it

    const strokeWidth: any = this.valToPx(this.getCSSVar('--progress-width') || '0');
    const pathWidth: any = this.valToPx(this.getCSSVar('--progress-path-width') || '0');
    const path2Width: any = this.valToPx(this.getCSSVar('--progress-path2-width') || '0');
    const diameter = width - Math.max(strokeWidth, pathWidth, path2Width);
    // calc circumference — we'll need it later to calc the stroke paths
    const circumference = Math.PI * diameter;

    this.params = {
      width,
      diameter,
      circumference
    }
  }

  /**
   * Returns the value of the css variable if it exists
   *
   * @param {string} valName  name of the css variable (with double dash in front)
   */
  getCSSVar(valName: string) {
    return this.el.style.getPropertyValue(valName);
  }

  /**
   * Converts different css value units to pixels
   *
   * @param {string} val  css value
   */
  valToPx(val: string) {
    const parsedVal = val.match(/(\d*\.*\d+)([a-z]+|%)?/i);
    const value = parseFloat(parsedVal[1]) || 4;
    switch (parsedVal[2]) {
      case '%':
        return value / 100 * this.params.width;
      case 'em':
        return value * parseFloat(getComputedStyle(this.el).fontSize);
      case 'rem':
        return value * parseFloat(getComputedStyle(document.documentElement).fontSize);
      case 'px':
      default:
        return value;
    }
  }

  /**
   * Returns the viewPath attribute value for the SVG
   * based on the width of the parent element
   */
  getViewBox() {
    return '0 0 ' + this.params.width + ' ' + this.params.width;
  }

  /**
   * Returns the circular path for the progress stroke
   * and additional paths in the background
   */
  getPath() {
    return 'M' + (this.params.width / 2) + ' ' + ((this.params.width - this.params.diameter) / 2) +
      ' a ' + (this.params.diameter / 2) + ' ' + (this.params.diameter / 2) +
      ' 0 0 1 0 ' + this.params.diameter +
      ' a ' + (this.params.diameter / 2) + ' ' + (this.params.diameter / 2) +
      ' 0 0 1 0 -' + this.params.diameter;
  }

  getStrokeDashArray() {
    return (this.value / 100 * this.params.circumference) + ', ' + this.params.circumference
  }

  getPaths() {
    let paths = [];
    if (this.el.style.getPropertyValue('--progress-path-color')) {
      paths.push(<path class="round-progress--path" d={ this.getPath() }/>);
    }
    if (this.el.style.getPropertyValue('--progress-path2-color')) {
      paths.push(<path class="round-progress--path2" d={ this.getPath() }/>);
    }
    return (
      <svg viewBox={ this.getViewBox() } class="round-progress">
        { paths }
      </svg>
    );
  }

  render() {
    return <div class="round-progress--container">
      { this.getPaths() }
      <svg viewBox={ this.getViewBox() } class="round-progress round-progress--progress">
        <path class="round-progress--circle"
          stroke-dasharray={ this.getStrokeDashArray() }
          d={ this.getPath() }
        />
      </svg>
      <div class="round-progress--contents">
        <slot />
      </div>
    </div>;
  }
}
