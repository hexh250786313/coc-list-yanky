This plugin is a coc list implement for [yanky.nvim](https://github.com/gbprod/yanky.nvim). If you use coc.nvim and yanky.nvim while have no interest in Telescope like me. You can use it for listing the yanky.nvim yanky.

## Requirements

Make sure your neovim has these installed and enabled:

-   [coc.nvim](https://github.com/neoclide/coc.nvim)
-   [yanky.nvim](https://github.com/gbprod/yanky.nvim)

## Install

In your neovim, run command:

```shell
:CocInstall coc-list-yanky
```

Setup keymap to open yanky history list like:

```vimscript
nnoremap <silent> <space>y  :<C-u>CocList -A --normal yanky<cr>
```

## Inspiration

-   [coc-yank](https://github.com/neoclide/coc-yank)

## License

MIT
