import {
    BasicList,
    ListItem,
    Neovim,
    Position,
    Range,
    TextEdit,
    workspace,
} from 'coc.nvim'
import { MESSAGE } from './constants'
import {
    byteSlice,
    deleteYankyHistoryItem,
    fetchYankyHistory,
    isYankyEnabled,
    showErrorMessage,
    showWarningMessage,
} from './helpers'
import colors from 'colors'

export type HistoryItem = any

export default class YankList extends BasicList {
    public readonly name = 'yanky'
    public readonly description = 'list of yanky history'
    public defaultAction = 'append'

    constructor(nvim: Neovim) {
        super(nvim)

        this.addAction('append', async (item: ListItem) => {
            const { document, position } = await workspace.getCurrentState()
            const doc = workspace.getDocument(document.uri)
            if (!doc || !doc.attached) {
                showErrorMessage(MESSAGE.DOC_NOT_ATTACHED)
                return
            }
            const edits: TextEdit[] = []
            const { regtype, content } = item.data as HistoryItem
            const line = doc.getline(position.line)
            if (regtype == 'v') {
                const pos = Position.create(
                    position.line,
                    Math.min(position.character + 1, line.length)
                )
                edits.push({
                    range: Range.create(pos, pos),
                    newText: content.join('\n'),
                })
            } else if (regtype == 'V') {
                const pos = Position.create(position.line + 1, 0)
                edits.push({
                    range: Range.create(pos, pos),
                    newText: content.join('\n') + '\n',
                })
            } else {
                const col = (await nvim.call('col', ['.'])) as number
                for (
                    let i = position.line;
                    i < position.line + content.length;
                    i++
                ) {
                    const line = doc.getline(i)
                    const character = byteSlice(line, 0, col + 1).length
                    const pos = Position.create(i, character)
                    edits.push({
                        range: Range.create(pos, pos),
                        newText: content[i - position.line],
                    })
                }
            }
            await doc.applyEdits(edits)
        })

        this.addAction('preview', async (item: ListItem, context) => {
            const { filetype, content } = item.data as HistoryItem
            // showErrorMessage(JSON.stringify({ item }))
            this.preview(
                {
                    sketch: true,
                    filetype,
                    lines: content,
                },
                context
            )
        })

        this.addMultipleAction(
            'delete',
            async (items: ListItem[]) => {
                const arr = items.map((o) => o.data.index).sort((a, b) => a - b)
                // showErrorMessage(JSON.stringify({ arr }))
                let deleteCount = 0
                await arr.reduce((promise, currentIndex) => {
                    const idx = currentIndex - deleteCount++
                    return promise.then(() =>
                        deleteYankyHistoryItem(this.nvim, idx)
                    )
                }, Promise.resolve())
            },
            { persist: true, reload: true }
        )

        this.addAction('prepend', async (item: ListItem) => {
            const { document, position } = await workspace.getCurrentState()
            const doc = workspace.getDocument(document.uri)
            if (!doc || !doc.attached) {
                showErrorMessage(MESSAGE.DOC_NOT_ATTACHED)
                return
            }
            const edits: TextEdit[] = []
            const { regtype, content } = item.data as HistoryItem
            if (regtype == 'v') {
                const pos = Position.create(position.line, position.character)
                edits.push({
                    range: Range.create(pos, pos),
                    newText: content.join('\n'),
                })
            } else if (regtype == 'V') {
                const pos = Position.create(position.line, 0)
                edits.push({
                    range: Range.create(pos, pos),
                    newText: content.join('\n') + '\n',
                })
            } else {
                const col = (await nvim.call('col', ['.'])) as number
                for (
                    let i = position.line;
                    i < position.line + content.length;
                    i++
                ) {
                    const line = doc.getline(i)
                    const character = byteSlice(line, 0, col).length
                    const pos = Position.create(i, character)
                    edits.push({
                        range: Range.create(pos, pos),
                        newText: content[i - position.line],
                    })
                }
            }
            await doc.applyEdits(edits)
        })
    }

    public async loadItems(): Promise<ListItem[]> {
        const isYankedValid = await isYankyEnabled(this.nvim)
        if (!isYankedValid) {
            showErrorMessage(MESSAGE.YANKY_INVALID)
            return []
        }

        const arr = await fetchYankyHistory(this.nvim)

        if (!arr.length) {
            showWarningMessage(MESSAGE.EMPTY_YANKY_HISTORY)
        }

        const columns = (await this.nvim.getOption('columns')) as number
        const res: ListItem[] = []
        for (const item of arr) {
            let regtype: string
            if (item.regtype == 'v') {
                regtype = 'char '
            } else if (item.regtype == 'V') {
                regtype = 'line '
            } else {
                regtype = 'block'
            }
            const text = item.regcontents
            const abbr =
                text.length > columns - 15
                    ? text.slice(0, columns - 15) + colors.grey('...')
                    : text
            res.push({
                label: `${colors.yellow(regtype)} ${abbr}`,
                filterText: abbr,
                data: Object.assign(
                    {},
                    {
                        index: item.history_index,
                        regtype: item.regtype,
                        filetype: item.filetype,
                        content: item.regcontents
                            .replace(/\n$/, '')
                            .split('\n'),
                    }
                ),
            })
        }
        return res
    }
}
