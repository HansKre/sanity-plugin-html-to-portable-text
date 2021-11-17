
# Sanity Plugin `HTML to Portable Text`

This plugin is a custom input component which converts `HTML` into [Portable Text](https://github.com/portabletext/portabletext) on the fly.

`Sanity` is using the `Portable Text`-format whenever you use the `block`-type.

In `Sanity-Studio` there is a [`WYSIWYG`-Block Content Editor](https://www.sanity.io/docs/customization) which makes editing very convenient. But if you are just migrating to `sanity` and your source is `HTML`, this plugin may come in handy.

Your `schema` needs to define at least one `block`-type field to allow persisting to your `schema`.

![Demo](docs/demo-7fps.gif)

## Installation

Install the Sanity Plugin `HTML to Portable Text` with the [`sanity CLI`](https://www.sanity.io/docs/cli)

```bash
  sanity install sanity-plugin-html-to-portable-text
```

## Usage

Just add a field of `htmlPortableText`-type to your fields-array.

### Basic Usage

```js
fields: [
  {
    name: 'htmlToArticleBody',
    title: 'HTML to Article Body',
    type: 'htmlToPortableText',
  {
    name: 'articleBody',
    title: 'Article Body',
    type: 'array',
    of: [ { type: 'block' } ]
  }
]
```

### Example with pre-selected block

If you have multiple `block`-type fields, you may want to have one selected as the default.

### Parameters

```js
  options: { defaultrefblock: '<name>' },
```

| Parameter         | Type     | Description                            | Default                                      |
| :---------------- | :------- | :------------------------------------- | :------------------------------------------- |
| `defaultrefblock` | `string` | **Optional**. Name of referenced block | First `block`-type as defined in your schema |

```js
fields: [
  {
    name: 'htmlToArticleBody',
    title: 'HTML to Article Body',
    type: 'htmlToProtableText',
    options: { refblock: 'articleBody' },
  {
    name: 'articleBody',
    title: 'Article Body',
    type: 'array',
    of: [
      {
        type: 'block',
        styles: [
          // we only want couple of styles to be available
          { title: 'Unstyled', value: 'normal' },
          { title: 'H1', value: 'h1' },
          { title: 'H2', value: 'h2' },
        ]
      }
    ]
  }
]
```

### Advanced Example

This example show how you may radically limit the available styles in `Portable Text`.

```js
fields: [
  {
    name: 'htmlToArticleBody',
    title: 'HTML to Article Body',
    type: 'htmlToProtableText',
  },
  {
    name: 'articleBody',
    title: 'Article Body',
    type: 'array',
    of: [
      {
        type: 'block',
        // Disallow all styles
        styles: [],
          // Disallow all lists
        lists: [],
        marks: {
          // Only allow these decorators
          decorators: [
            { title: 'Bold', value: 'strong' },
              {
                title: 'Superscript',
                  value: 'sup',
                  // Define custom icon and renderer for the blockEditor
                  blockEditor: {
                    icon: () => <div>⤴</div>,
                      render: ({ children }) => <span><sup>{children}</sup></span>
                  }
              },
          ],
          // disallow links
          annotations: []
      }
    ]
  }
]
```

## Further reading

- [Introduction to Portable Text](https://www.sanity.io/guides/introduction-to-portable-text)
- [Using Portable Text in React](https://github.com/sanity-io/block-content-to-react)

## Features

- provides a custom input component
- converts `HTML` into [Portable Text](https://github.com/portabletext/portabletext) on the fly
- introspects the `schema` of the parent document and finds all `block`-type fields
- persist converted `HTML` to selected `block`-type field of your `schema`

## Roadmap

- Add `unit tests`, since this is a delicate functionality
