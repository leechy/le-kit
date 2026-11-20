---
examples:
  - slot: ""
    title: Any markup in the label
    html: <le-button>Save <strong>draft</strong></le-button>
  - slot: icon-start
    title: A named icon
    html: <le-button><le-icon slot="icon-start" name="save"></le-icon>Save</le-button>
  - slot: icon-start
    title: An emoji
    html: <le-button><span slot="icon-start">🚀</span>Launch</le-button>
  - slot: icon-start
    title: Any element, e.g. an inline SVG
    html: |
      <le-button>
        <svg slot="icon-start" viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="5" fill="currentColor" />
        </svg>
        Record
      </le-button>
  - slot: icon-end
    title: A menu or a next step
    html: <le-button>Options<le-icon slot="icon-end" name="chevron-down"></le-icon></le-button>
  - slot: icon-only
    title: Give it a label for screen readers
    html: <le-button label="Copy"><le-icon slot="icon-only" name="copy"></le-icon></le-button>
---

## Properties or slots

A couple of properties can be set either as properties or as slots — the icons. In frameworks it is
often easier to pass them as properties; in plain HTML a slot is easier, and any element (or just an
emoji) works as an icon. Pick what works best for you. Everything that is not in one of the three icon
slots becomes the label of the button.
