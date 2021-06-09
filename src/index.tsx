import React from 'react'
import {FormField} from '@sanity/base/components'
import {TextInput} from '@sanity/ui'
import {withDocument} from 'part:@sanity/form-builder'
import {useDocumentOperation} from '@sanity/react-hooks'
import {uuid} from '@sanity/uuid'
import blocksToHtml from '@sanity/block-content-to-html'
import {convertToBlock} from './htmlUtils'
import {compileBlockContentType, SchemaType} from './schemaUtils'

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
        const refblock = type?.options?.refblock
        if (refblock && sanityDocument.hasOwnProperty('_id') && sanityDocument.hasOwnProperty(refblock)) {
            setHtmlInputValue(blocksToHtml({
                blocks: sanityDocument[refblock],
            }))
            return htmlInputValue
        } else {
            return htmlInputValue
        }
    }

    React.useEffect(() => {serializeReferencedBlockToHtml()}, [serializeReferencedBlockToHtml])

    const {patch: documentPatch} = useDocumentOperation(sanityDocument?._id?.replace('drafts.', '') || '0', sanityDocument?._type) as {patch: any}

    const handleHtmlChange = React.useCallback(
        (event: React.Event) => {
            const inputValue = event.currentTarget.value
            setHtmlInputValue(inputValue)
            convertAndSavelySetReferencedBlock(type, documentPatch, blockContentType, inputValue)
        },
        [blockContentType, documentPatch, type]
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
                    {!type?.options?.refblock ?
                        <p><i>Schema does not seem to specify a <b>refblock</b> in <b>options</b> on the <b>htmlToProtableText</b> field. Please specify a valid <b>refblock</b> to see the output.</i></p>
                        : ''
                    }
                </> : <p><i>Waiting for document to be initiated...</i></p>
            }
        </FormField >
    )
})

export default withDocument(HtmlToPortableTextInput)

function convertAndSavelySetReferencedBlock(type: SchemaType, documentPatch: any, blockContentType: any, html: string): void {
    const refblock = type?.options?.refblock
    if (refblock && documentPatch && blockContentType) {
        const blocks = convertToBlock(blockContentType, html)
        // unset invalid html. This is necessary since the block-component sanitizes invalid html and hence overwrites invalid input field values. This leads to bad user experience
        blocks ? setBlock(blocks, documentPatch, refblock) : unsetBlock(documentPatch, refblock)
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
