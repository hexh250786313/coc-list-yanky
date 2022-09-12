import type { HistoryItem } from './list'
import { window, Neovim } from 'coc.nvim'

export async function fetchYankyHistory(
    nvim: Neovim
): Promise<Array<HistoryItem>> {
    const arr = await nvim.lua(`
        local history = {}
        for index, value in pairs(require("yanky.history").all()) do
            value.history_index = index
            history[index] = value
        end
        return history
    `)
    return (arr || []) as Array<any>
}

export async function deleteYankyHistoryItem(
    nvim: Neovim,
    index: number
): Promise<void> {
    await nvim.lua(`
        require("yanky.history").delete(${index})
    `)
}

export async function isYankyEnabled(nvim: Neovim): Promise<boolean> {
    // :h exists()
    const res = await nvim.call('exists', [':YankyRingHistory'])
    if (res !== 2) {
        return false
    }
    return true
}

export function showErrorMessage(message: string): void {
    window.showErrorMessage(message)
    window.showNotification({
        kind: 'error',
        content: message,
    })
}

export function showWarningMessage(message: string): void {
    window.showWarningMessage(message)
    window.showNotification({
        kind: 'warning',
        content: message,
    })
}

export function byteSlice(
    content: string,
    start: number,
    end?: number
): string {
    const buf = Buffer.from(content, 'utf8')
    return buf.slice(start, end).toString('utf8')
}
