import React, {forwardRef, useMemo, useCallback, useEffect, useState, Ref, FocusEventHandler, BaseSyntheticEvent} from 'react'
import {FormField} from '@sanity/base/components'
import {TextInput, Card, Stack, Select, Text, Label} from '@sanity/ui'
import {withDocument} from 'part:@sanity/form-builder'
import {useDocumentOperation} from '@sanity/react-hooks'
import {uuid} from '@sanity/uuid'
import blocksToHtml from '@sanity/block-content-to-html'
import {convertToBlock} from './htmlUtils'
import {compileBlockContentType, getBlockTypes, getBlockTypeByName, dummyBlockType, SchemaType, TypeType} from './schemaUtils'

export type Props = {
    type: SchemaType,
    readOnly?: boolean,
    markers?: any,
    presence?: any,
    compareValue?: any,
    onFocus: FocusEventHandler<HTMLInputElement>,
    onBlur: FocusEventHandler<HTMLInputElement>,
    document: any
}

const HtmlToPortableTextInput = forwardRef((props: Props, ref: Ref<HTMLInputElement> | undefined) => {
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

    let sanityBlockTypes: TypeType[] = useMemo(() => getBlockTypes(sanityDocument), [sanityDocument])
    const inputId: string = useMemo(() => uuid(), [])

    const [htmlInputValue, setHtmlInputValue] = useState('')

    const initialySelectedBlock: TypeType | undefined = type?.options?.refblockdefault ? getBlockTypeByName(sanityBlockTypes, type?.options?.refblockdefault) : sanityBlockTypes[0]
    console.log('initiallyselected', initialySelectedBlock)

    const [selectedBlockType, setSelectedBlockType] = useState<TypeType | undefined>(initialySelectedBlock)

    const [blockContentType, setBlockContentType] = useState()

    useEffect(() => {serializeReferencedBlockToHtml()}, [selectedBlockType])
    useEffect(() => {
        const blockContentType = compileBlockContentType(selectedBlockType || dummyBlockType)
        setBlockContentType(blockContentType)
    }, [selectedBlockType])

    const {patch: documentPatch} = useDocumentOperation(sanityDocument?._id?.replace('drafts.', '') || '0', sanityDocument?._type) as {patch: any}

    const serializeReferencedBlockToHtml = () => {
        if (selectedBlockType && sanityDocument.hasOwnProperty('_id') && sanityDocument.hasOwnProperty(selectedBlockType.name)) {
            setHtmlInputValue(blocksToHtml({
                blocks: sanityDocument[selectedBlockType.name],
            }))
            return htmlInputValue
        } else {
            return htmlInputValue
        }
    }

    const handleSelectChange = (event: BaseSyntheticEvent) => {
        const newSelectedBlockName = event.target.value.split(': ')[1]
        setSelectedBlockType(getBlockTypeByName(sanityBlockTypes, newSelectedBlockName))
    }

    const handleHtmlChange = useCallback((event: BaseSyntheticEvent): void => {
        const inputValue = event.currentTarget.value
        setHtmlInputValue(inputValue)
        if (selectedBlockType) convertAndSavelySetReferencedBlock(type, documentPatch, blockContentType, inputValue, selectedBlockType.name)
    }, [blockContentType, documentPatch, type, selectedBlockType])

    const FONT_SIZE = 2
    const PLACE_HOLDER = 'HTML-Input e.g. <h1>Hello World</h1>'
    const selectedValueFromBlockType = (blockType: TypeType | undefined): string => {
        return blockType ? `${blockType.title}: ${blockType.name}` : ''
    }

    return (
        <FormField
            title={type.title}
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
                        <Stack space={3}>
                            <Card marginTop={1} marginBottom={2}>
                                <Stack space={3}>
                                    <Text size={FONT_SIZE}>Block-Field</Text>
                                    <Select
                                        fontSize={FONT_SIZE}
                                        padding={3}
                                        space={3}
                                        onChange={handleSelectChange}
                                        disabled={sanityBlockTypes.length < 2}
                                        value={selectedValueFromBlockType(selectedBlockType)}
                                    >
                                        {sanityBlockTypes?.map(blockType => (
                                            <option key={uuid()} >{selectedValueFromBlockType(blockType)}
                                            </option>
                                        ))}
                                    </Select>
                                </Stack>
                            </Card>
                            <Card marginTop={1} marginBottom={2}>
                                <Stack space={3}>
                                    <Text size={FONT_SIZE}>HTML-Input</Text>
                                    <TextInput
                                        id={inputId}
                                        fontSize={FONT_SIZE}
                                        value={htmlInputValue}
                                        readOnly={readOnly}
                                        placeholder={PLACE_HOLDER}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                        onChange={handleHtmlChange}
                                        ref={ref}
                                    />
                                </Stack>
                            </Card>
                        </Stack>
                    </Card>
                    {!selectedBlockType ?
                        <p><i>Schema does not seem to specify a <b>block</b>-type. Please specify a valid <b>block</b>-type to see the output.</i></p>
                        : ''
                    }
                </> : <p><i>Waiting for document to be initiated...</i></p>
            }
        </FormField >
    )
})

export default withDocument(HtmlToPortableTextInput)

function convertAndSavelySetReferencedBlock(type: SchemaType, documentPatch: any, blockContentType: any, html: string, selectedBlockType: string): void {
    if (selectedBlockType && documentPatch && blockContentType) {
        const blocks = convertToBlock(blockContentType, html)
        // unset invalid html. This is necessary since the block-component sanitizes invalid html and hence overwrites invalid input field values. This leads to bad user experience
        blocks ? setBlock(blocks, documentPatch, selectedBlockType) : unsetBlock(documentPatch, selectedBlockType)
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
