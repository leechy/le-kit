import { Component, Element, Method } from '@stencil/core';

@Component({
  tag: 'le-item',
  shadow: true,
})
export class LeItem {
  @Element() el!: HTMLElement;

  @Method()
  async getOption() {
    const id = this.el.getAttribute('id') || '';
    const label = this.el.getAttribute('label') || this.el.textContent?.trim() || '';
    const value = this.el.getAttribute('value') || label;
    const href = this.el.getAttribute('href') || '';
    const disabled = this.el.hasAttribute('disabled');
    const selected = this.el.hasAttribute('selected');
    const checked = this.el.hasAttribute('checked');
    const open = this.el.hasAttribute('open');
    const icon = this.el.getAttribute('icon') || '';
    const iconStart = this.el.getAttribute('icon-start') || '';
    const iconEnd = this.el.getAttribute('icon-end') || '';
    const description = this.el.getAttribute('description') || '';
    const children = Array.from(this.el.children).filter(
      child => child.tagName.toLowerCase() === 'le-item',
    );
    const group = this.el.getAttribute('group') || '';
    const separator = this.el.hasAttribute('separator');
    return {
      id,
      label,
      value,
      href,
      disabled,
      selected,
      checked,
      open,
      icon,
      iconStart,
      iconEnd,
      description,
      children,
      group,
      separator,
    };
  }

  render() {
    return null;
  }
}
