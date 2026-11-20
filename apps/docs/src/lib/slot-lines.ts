/**
 * Which lines of a sample's source go into which slot of the component, so the
 * code under a live sample can be highlighted together with the element.
 *
 * Line-based on purpose: the sample is written with one slotted element per line.
 * Inside the component's tags, a line with `slot="name"` belongs to that slot; any
 * other non-blank line belongs to the default slot (`''`). The component's own
 * opening and closing lines belong to none.
 */
export function slotLines(source: string, tag: string): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  const open = new RegExp(`<${tag}[\\s>]`);
  const close = `</${tag}>`;
  let depth = 0;

  source.split('\n').forEach((line, index) => {
    const opens = open.test(line);
    const closes = line.includes(close);

    if (opens && closes) return; // the whole component on one line
    if (opens) {
      depth++;
      return;
    }
    if (closes) {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (depth === 0 || !line.trim()) return;

    const slot = /\bslot="([^"]*)"/.exec(line)?.[1] ?? '';
    (result[slot] ??= []).push(index);
  });

  return result;
}
