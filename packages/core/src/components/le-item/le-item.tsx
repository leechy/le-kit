import { Component, Element, Method } from '@stencil/core';
import { LeOption } from '../../components';

@Component({
  tag: 'le-item',
  shadow: true,
})
export class LeItem {
  @Element() el!: HTMLElement;

  @Method()
  async getOption() {
    const id = this.el.getAttribute('id') || '';
    const label = this.el.getAttribute('label') || this.el.innerHTML.trim() || '';
    const value = this.el.getAttribute('value') || label;
    const href = this.el.getAttribute('href') || '';
    const target = this.el.getAttribute('target') || '';
    const part = this.el.getAttribute('part') || '';
    const className = this.el.getAttribute('class') || '';
    const disabled = this.el.hasAttribute('disabled');
    const selected = this.el.hasAttribute('selected');
    const checked = this.el.hasAttribute('checked');
    const open = this.el.hasAttribute('open');
    const icon = this.el.getAttribute('icon') || '';
    const iconStart = this.el.getAttribute('icon-start') || '';
    const iconEnd = this.el.getAttribute('icon-end') || '';
    const description = this.el.getAttribute('description') || '';
    const children = await Promise.all(
      Array.from(this.el.children)
        .filter(child => child.tagName.toLowerCase() === 'le-item')
        .map(child => (child as any).getOption()),
    );
    const group = this.el.getAttribute('group') || '';
    const separator = this.el.getAttribute('separator') as 'before' | 'after' | undefined;
    return {
      id,
      label,
      value,
      href,
      target,
      part,
      className,
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
    } as LeOption;
  }

  render() {
    return null;
  }
}
