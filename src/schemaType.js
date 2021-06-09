import HtmlToPortableTextInput from "./index";

export default {
    title: "HTML to Portable Text",
    name: "htmlToProtableText",
    type: "object",
    fields: [
        {
            name: 'notNeededButRequiredBySanity',
            description: 'We don not store the HTML in the schema',
            type: 'string',
        },
    ],
    inputComponent: HtmlToPortableTextInput,
};