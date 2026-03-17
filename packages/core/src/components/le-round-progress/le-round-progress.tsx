import { Component, Element, h, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'le-round-progress',
  styleUrl: 'le-round-progress.css',
  shadow: true,
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

  // padding value coming from an attribute
  @Prop() padding: number = 0;
  @Watch('padding')
  updatePadding(newValue: string) {
    this.padding = parseFloat(newValue);
    this.calcParams();
  }

  // the progress backgrounds can be as many as needed
  // but it should be JSON format: double quotes and strict commas
  @Prop() paths: string;
  @Watch('paths')
  updateProgressBackgrounds(newValue: string) {
    this.progressPaths = JSON.parse(newValue);
  }
  progressPaths: any[];

  @State() params: {
    width: number;
    diameter: number;
    circumference: number;
  };

  /**
   * Component lifecycles
   *
   * Before the component is loaded, we need to calculate and update params
   * using the component size (width of the round progress)
   * and progress width (max of )
   */
  componentWillLoad() {
    if (typeof this.paths === 'string') {
      this.updateProgressBackgrounds(this.paths);
    }
    this.calcParams();
  }

  calcParams() {
    // get element width
    const width = this.el.getBoundingClientRect().width;
    const diameter = width - this.padding;
    // calc circumference — we'll need it later to calc the stroke paths
    const circumference = Math.PI * diameter;

    this.params = { width, diameter, circumference };
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
    return (
      'M' +
      this.params.width / 2 +
      ' ' +
      (this.params.width - this.params.diameter) / 2 +
      ' a ' +
      this.params.diameter / 2 +
      ' ' +
      this.params.diameter / 2 +
      ' 0 0 1 0 ' +
      this.params.diameter +
      ' a ' +
      this.params.diameter / 2 +
      ' ' +
      this.params.diameter / 2 +
      ' 0 0 1 0 -' +
      this.params.diameter
    );
  }

  getStrokeDashArray() {
    return (this.value / 100) * this.params.circumference + ', ' + this.params.circumference;
  }

  getPaths() {
    if (!this.progressPaths || !this.progressPaths.length) {
      return null;
    }
    let paths = [];
    this.progressPaths.forEach(bg => {
      paths.push(<path class="round-progress--path" d={this.getPath()} stroke={bg.color} stroke-width={bg.width} stroke-dasharray={bg.dasharray} stroke-linecap={bg.linecap} />);
    });
    return (
      <svg viewBox={this.getViewBox()} class="round-progress">
        {paths}
      </svg>
    );
  }

  render() {
    return (
      <div class="round-progress--container">
        {this.getPaths()}
        <svg viewBox={this.getViewBox()} class="round-progress round-progress--progress">
          <path class="round-progress--circle" stroke-dasharray={this.getStrokeDashArray()} d={this.getPath()} />
        </svg>
        <slot />
      </div>
    );
  }
}
