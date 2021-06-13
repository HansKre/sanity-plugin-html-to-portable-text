import Schema from '@sanity/schema'
import schema from 'part:@sanity/base/schema'

const BLOCK_TYPE = 'blockType'
const BLOCK_FIELD = 'blockField'

export type TypeType = {
    name: string;
    type: string;
    title?: string;
    of?: [
        {type?: string;}
    ];
}

export type SchemaType = {
    title: string,
    options: {
        refblockdefault: string,
        styles?: Array<object>,
        lists?: Array<object>,
        marks?: object,
    }
}

export const getBlockTypes = (sanityDocument: any): TypeType[] => {
    const types = schema._source.types
    const sanityDocSchema = types
        .filter((t: TypeType) => t.name === sanityDocument._type)[0]
    const sanityBlockTypes: TypeType[] = sanityDocSchema.fields.filter((t: TypeType) => t.type === 'array' && t?.of?.find((elem: {type: string}) => elem.type === 'block'))
    return sanityBlockTypes
}

export const getBlockTypeByName = (sanityBlockTypes: TypeType[], typeName: string): TypeType | undefined => {
    return sanityBlockTypes.find((blockType) => blockType.name === typeName)
}

export const dummyBlockType: TypeType = {name: 'dummy', type: 'array', of: [{type: 'block'}]}

export const compileBlockContentType = (type: TypeType) => {
    const compiledSchema = Schema.compile({
        name: 'dummy',
        types: [
            {
                name: BLOCK_TYPE,
                type: 'document',
                fields: [
                    {
                        ...type,
                        name: BLOCK_FIELD, // overwrite name for easy of access
                    }
                ],
            }
        ]
    })
    const blockContentType = compiledSchema?.get(BLOCK_TYPE)?.fields?.find((field: {name: string}) => field.name === BLOCK_FIELD)?.type
    return blockContentType
}