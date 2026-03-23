import { Component, Element, Method } from '@stencil/core';
import type { LeOption } from '../../types/options';
import { parseOptionFromItemElement } from '../../utils/utils';

@Component({
  tag: 'le-item',
  shadow: true,
})
export class LeItem {
  @Element() el!: HTMLElement;

  @Method()
  async getOption() {
    return parseOptionFromItemElement(this.el) as LeOption;
  }

  render() {
    return null;
  }
}
