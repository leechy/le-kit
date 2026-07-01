# le-actions-sequence



<!-- Auto Generated Below -->


## Overview

A non-visual component that runs a sequence of timed actions on its children.
Designed for creating automated interaction loops and interactive demos.

## Properties

| Property             | Attribute              | Description                                                                                   | Type                                    | Default     |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- | ----------- |
| `debug`              | `debug`                | Output debug logs to console.                                                                 | `boolean`                               | `false`     |
| `direction`          | `direction`            | Playback direction.                                                                           | `"alternate" \| "forward" \| "reverse"` | `'forward'` |
| `inViewThreshold`    | `in-view-threshold`    | Visibility threshold ratio (0.0 to 1.0) before triggering in-view.                            | `number`                                | `0.5`       |
| `loop`               | `loop`                 | Repeat the sequence when finished.                                                            | `boolean`                               | `false`     |
| `loopDelay`          | `loop-delay`           | Loop delay in milliseconds before restarting the sequence.                                    | `number`                                | `0`         |
| `pauseOnHover`       | `pause-on-hover`       | Pause the sequence when the user hovers over the element. Resumes on mouseleave.              | `boolean`                               | `false`     |
| `pauseOnInteraction` | `pause-on-interaction` | Pause the sequence when the user interacts (click/focus/drag) inside the element.             | `boolean`                               | `false`     |
| `startOn`            | `start-on`             | Playback triggers: 'init' (starts immediately), 'in-view' (scrolled into viewport), 'manual'. | `"in-view" \| "init" \| "manual"`       | `'init'`    |
| `steps`              | `steps`                | Array of ActionStep objects or a JSON string representation.                                  | `ActionStep[] \| string`                | `[]`        |


## Events

| Event      | Description                              | Type                                                                     |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `leFinish` | Emitted when the sequence finishes       | `CustomEvent<void>`                                                      |
| `leStart`  | Emitted when the sequence starts playing | `CustomEvent<void>`                                                      |
| `leStep`   | Emitted when a step starts executing     | `CustomEvent<{ index: number; step: ActionStep; target: HTMLElement; }>` |


## Methods

### `getStatus() => Promise<{ isPlaying: boolean; currentStepIndex: number; currentStep: ActionStep; stepsCount: number; }>`

Returns status information of the runner.

#### Returns

Type: `Promise<{ isPlaying: boolean; currentStepIndex: number; currentStep: ActionStep; stepsCount: number; }>`



### `pause() => Promise<void>`

Pause playback at the current step.

#### Returns

Type: `Promise<void>`



### `play() => Promise<void>`

Start or resume playback of the sequence.

#### Returns

Type: `Promise<void>`



### `stop() => Promise<void>`

Stop playback and reset to the beginning.

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
