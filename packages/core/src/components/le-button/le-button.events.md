## The `click` event

`<le-button>` uses the name of the default DOM event — `click`. This is considered bad practice in
many articles and in the Stencil documentation itself (there is even a linter rule against it). But it
is the only way to react to the event with just an attribute, without subscribing in JavaScript. So the
experiments continue.

Subscribing in JavaScript:

```js
const button = document.getElementById('my-button');
button.addEventListener('click', (event) => {
  alert(`Here's the intercepted click: ${event.detail}`);
});
```
