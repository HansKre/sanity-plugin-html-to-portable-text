import Schema from '@sanity/schema'

const BLOCK_TYPE = 'blockType'
const BLOCK_FIELD = 'blockField'

export type SchemaType = {
    title: string,
    options: {
        refblock: string,
        styles?: Array<object>,
        lists?: Array<object>,
        marks?: object,
    }
}

export const compileBlockContentType = (type: SchemaType) => {
    const compiledSchema = Schema.compile({
        name: 'dummy',
        types: [
            {
                name: BLOCK_TYPE,
                type: 'document',
                fields: [
                    {
                        name: BLOCK_FIELD,
                        type: 'array',
                        of: [
                            {
                                type: 'block',
                                styles: type?.options?.styles,
                                lists: type?.options?.lists,
                                marks: type?.options?.marks,
                            }
                        ]
                    }
                ],
            }
        ]
    })
    const blockContentType = compiledSchema?.get(BLOCK_TYPE)?.fields?.find((field: {name: string}) => field.name === BLOCK_FIELD)?.type
    return blockContentType
}