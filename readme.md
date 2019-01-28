![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Le Kit
## Unusual Web Components

I'm creating a kit of web components built using [Stencil.js](https://stenciljs.com/).

The idea is not to have another set of inputs, checkboxes, buttons, tabs and unique grid, but some rarely met components like the first two initial ones:

## Le Round Progress

The round progress component is used more and more often after Apple announced the [Activity rings](https://www.apple.com/watch/close-your-rings/) for the Watch.

With this component you can create almost the same look and feel as Apples rings and even more:

**Circle Size** — the cirle size is taken from the elements width — you have to put the element inside a container with a fixed width to get the results

**Value** — the only attribute you can set is `value` it takes a value in percentage (0—100) and fills the progress accordingly.

```<le-round-progress value="66"></le-round-progress>```

**Content** — everything you put inside the component will be shown over the round progress, so be carefull.

**Colors and bar width** — you should color the progress using css variables:

  * `--progress-width` (default: `4px`) — width of the progress bar;
  * `--progress-color` (default: `#999`) — color of the progress bar (no gradients yet, sorry);
  * `--progress-linecap` (default: `round`): `butt | round | square` — shape of the progress bar's end (see [stroke-linecap](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap));
  * `--progress-shadow`: `x y spread color` — shadow of the progress bar.

**Additional paths** — you can set two more paths for the progress bar — a backgrounds, visible even when the progress is 0. It can help to build the bar you want to build:

  * `--progress-path-color` — color of the path, required to make the path visible;
  * `--progress-path-width` (default: `--progress-width`) — width of the path (can be wider than the progress bar);
  * `--progress-path-dasharray`: `dash length, space between` — settings if you want to have dotted of dashed stoke;
  * `--progress-path-linecap` (default: `round`) — if it's dashed stroke, which end to use for dashes.

  * `--progress-path2-color` — same as the above;
  * `--progress-path2-width`;
  * `--progress-path2-dasharray`;
  * `--progress-path2-linecap`.



## Le Turntable

Turntable component let's you turn the element initially, set the center point for the rotation and, most importantly, let's you... turn the element using mouse or fingers (on touch devices). And returns the new angle value.

Usage:
```
<le-turntable value="90" center="0 50%">
  Contents...
</le-turntable>
```

**Value** — `value`: `number` (0–360) initial degree to turn the component.

**Center point for rotation** — `center`: `horizontalValue verticalValue` same values as for the css-property `transformOrigin`.

The component is a Work In Progress yet.


# Usage

- Put a script tag similar to this `<script src='https://unpkg.com/le-kit@0.0.1/dist/le-kit.js'></script>` in the head of your index.html
- Then you can use the element anywhere in your template, JSX, html etc

### Node Modules
- Run `npm install le-kit --save`
- Put a script tag similar to this `<script src='node_modules/le-kit/dist/le-kit.js'></script>` in the head of your index.html
- Then you can use the element anywhere in your template, JSX, html etc

### In a stencil-starter app
- Run `npm install le-kit --save`
- Add an import to the npm packages `import le-kit;`
- Then you can use the element anywhere in your template, JSX, html etc
