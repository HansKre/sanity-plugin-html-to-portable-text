import DOMPurify from 'dompurify'
import blockTools from '@sanity/block-tools'

export const validationsPass = (html: string): boolean => {
    // if opening < exists, must end on >
    const mustEndOnClosingBracketIfOpeningBracketExists = (html.match(/</g) || []).length === 0 || html.endsWith('>')
    // must have same number of opening and closing brackets
    const numberOpeningMatchesClosing = (html.match(/</g) || []).length === (html.match(/>/g) || []).length
    console.log(mustEndOnClosingBracketIfOpeningBracketExists, numberOpeningMatchesClosing, (html.match(/</g) || []).length, (html.match(/>/g) || []).length)
    return mustEndOnClosingBracketIfOpeningBracketExists && numberOpeningMatchesClosing
}

export const isValidHTML = (html: string): boolean => {
    if (validationsPass(html)) {
        const doc = document.createElement('div')
        const htmlWithDoubleQuotes = html.replace(/'/g, '"')
        doc.innerHTML = htmlWithDoubleQuotes
        console.log(doc.innerHTML, htmlWithDoubleQuotes, doc.innerHTML === htmlWithDoubleQuotes)
        return doc.innerHTML === htmlWithDoubleQuotes
    }
    return false;
}

export function convertToBlock(blockContentType: any, inputValue: string, withoutValidation?: boolean): object | null {
    if (isValidHTML(inputValue) || withoutValidation) {
        // sanitize html
        const cleanHtmlString = sanitizeHtml(inputValue)
        // replace single backslash from html since input component escapes them already
        const cleanHtmlStringWithoutBackslash = cleanHtmlString?.replace(/(?<!\\)\\(?!\\)/, '')
        // convert
        const blocks = blockTools.htmlToBlocks(
            cleanHtmlStringWithoutBackslash,
            blockContentType
        )
        return blocks
    } else {
        return null
    }
}

function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {USE_PROFILES: {html: true}})
}
