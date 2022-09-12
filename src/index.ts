import { ExtensionContext, workspace, listManager } from 'coc.nvim'
import YankyList from './list'

export async function activate(context: ExtensionContext): Promise<void> {
    const { subscriptions } = context
    subscriptions.push(listManager.registerList(new YankyList(workspace.nvim)))
}
