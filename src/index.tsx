import React from 'react'
import {FormField} from '@sanity/base/components'
import {TextInput, Card, Stack, Select} from '@sanity/ui'
import {withDocument} from 'part:@sanity/form-builder'
import {useDocumentOperation} from '@sanity/react-hooks'
import {uuid} from '@sanity/uuid'
import blocksToHtml from '@sanity/block-content-to-html'
import {convertToBlock} from './htmlUtils'
import {compileBlockContentType, SchemaType} from './schemaUtils'
import schema from 'part:@sanity/base/schema'

export type Props = {
    type: SchemaType,
    readOnly?: boolean,
    markers?: any,
    presence?: any,
    compareValue?: any,
    onFocus: (id: string) => void,
    onBlur: (id: string) => void,
    document: any
}

const HtmlToPortableTextInput = React.forwardRef((props: Props, ref: React.ReactElement) => {
    const {
        type,                       // Schema information
        readOnly,                   // Boolean if field is not editable
        markers,                    // Markers including validation rules
        presence,                   // Presence information for collaborative avatars
        compareValue,               // Value to check for "edited" functionality
        onFocus,                    // Method to handle focus state
        onBlur,                     // Method to handle blur state
        document: sanityDocument    // The surrounding document
    } = props

    const inputId = uuid()

    const [blockContentType, setBlockContentType] = React.useState()
    const [htmlInputValue, setHtmlInputValue] = React.useState('')

    React.useEffect(() => {
        const blockContentType = compileBlockContentType(type)
        setBlockContentType(blockContentType)
    }, [type])

    const serializeReferencedBlockToHtml = () => {
        if (selectedBlock && sanityDocument.hasOwnProperty('_id') && sanityDocument.hasOwnProperty(selectedBlock)) {
            setHtmlInputValue(blocksToHtml({
                blocks: sanityDocument[selectedBlock],
            }))
            return htmlInputValue
        } else {
            return htmlInputValue
        }
    }

    React.useEffect(() => {serializeReferencedBlockToHtml()}, [serializeReferencedBlockToHtml])

    const {patch: documentPatch} = useDocumentOperation(sanityDocument?._id?.replace('drafts.', '') || '0', sanityDocument?._type) as {patch: any}

    interface TypeType {
        name: string;
        type: string;
        title?: string;
        of?: [];
    }

    const getBlockTypes = (): Array<TypeType> => {
        const types = schema._source.types
        const sanityDocSchema = types
            .filter((t: TypeType) => t.name === sanityDocument._type)[0]
        const sanityBlockTypes = sanityDocSchema.fields.filter((t: TypeType) => t.type === 'array' && t?.of?.find((elem: {type: string}) => elem.type === 'block'))
        console.log(sanityBlockTypes)
        return sanityBlockTypes
    }
    let sanityBlockTypes: Array<TypeType> = React.useMemo(getBlockTypes, [sanityDocument])

    const [selectedBlock, setSelectedBlock] = React.useState(type?.options?.refblockdefault || (sanityBlockTypes && sanityBlockTypes[0]))
    const [selectValue, setSelectValue] = React.useState()
    const handleSelectChange = (event: React.SyntheticEvent) => {
        const newSelectedBlockName = event.target.value.split(': ')[1]
        setSelectedBlock(newSelectedBlockName)
        setSelectValue(event.target.value)
    }

    const handleHtmlChange = React.useCallback(
        (event: React.Event) => {
            const inputValue = event.currentTarget.value
            setHtmlInputValue(inputValue)
            convertAndSavelySetReferencedBlock(type, documentPatch, blockContentType, inputValue, selectedBlock)
        },
        [blockContentType, documentPatch, type, selectedBlock, selectValue]
    )

    return (
        <FormField
            title={type.title}
            description='Your Html goes here'
            // Handles all markers including validation
            __unstable_markers={markers}
            // Handles presence avatars
            __unstable_presence={presence}
            // Handles "edited" status
            compareValue={compareValue}
            // Allows the label to connect to the input field
            inputId={inputId}
        >
            {sanityDocument.hasOwnProperty('_id') ?
                <>
                    <Card padding={0}>
                        <Stack>
                            <Select
                                fontSize={[2, 2, 3, 4]}
                                padding={[3, 3, 4]}
                                space={[3, 3, 4]}
                                onChange={handleSelectChange}
                                disabled={sanityBlockTypes.length < 2}
                                value={selectValue}
                            >
                                {sanityBlockTypes?.map(blocktype => (
                                    <option key={uuid()} >{
                                        `${blocktype.title}: ${blocktype.name}`}
                                    </option>
                                ))}
                            </Select>
                        </Stack>
                        <TextInput
                            id={inputId}
                            value={htmlInputValue}
                            readOnly={readOnly}
                            placeholder='<h1>Hello World</h1>'
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onChange={handleHtmlChange}
                            ref={ref}
                        />
                    </Card>
                    {!selectedBlock ?
                        <p><i>Schema does not seem to specify a <b>block</b>-type. Please specify a valid <b>block</b>-type to see the output.</i></p>
                        : ''
                    }
                </> : <p><i>Waiting for document to be initiated...</i></p>
            }
        </FormField >
    )
})

export default withDocument(HtmlToPortableTextInput)

function convertAndSavelySetReferencedBlock(type: SchemaType, documentPatch: any, blockContentType: any, html: string, selectedBlock: string): void {
    if (selectedBlock && documentPatch && blockContentType) {
        const blocks = convertToBlock(blockContentType, html)
        // unset invalid html. This is necessary since the block-component sanitizes invalid html and hence overwrites invalid input field values. This leads to bad user experience
        blocks ? setBlock(blocks, documentPatch, selectedBlock) : unsetBlock(documentPatch, selectedBlock)
    }
}

function unsetBlock(documentPatch: any, fieldName: string) {
    documentPatch?.execute([{unset: [fieldName]}])
}

function setBlock(blocks: any, documentPatch: any, fieldName: string) {
    if (blocks.length === 0) {
        // sanity backend requires empty blocks to be unset
        unsetBlock(documentPatch, fieldName)
    } else {
        documentPatch?.execute([{set: {[fieldName]: blocks}}])
    }
}
