# Studenthome emulator

## Features
- FilePanel: Able to place files together in a panel so that the user can use the program.
- Git: Git integration is done with the [github rest API](https://docs.github.com/en/rest?apiVersion=2022-11-28).
    - Push and pull are done through github Database manipulation
- FileSystem: File System frontend for OPFS. Manage filesystem to ensure that user created content is accessible through this interface.
- ModalDialog: Show modal dialog to user to prevent them from using the page in multiple tabs which can corrupt the file system state.


## API Usage
Do not use APIs directly. Everything is react coomponentized so you can simply use &lt;XTermComponent&gt;, &lt;Providers/&gt; and Editor.&lt; Everything must be contained within the providers element and if not, there might be errors thrown to console.

## Current integration and HOW-TO
Students are **NOT** recommended to access studenthome/editor directly as you will not be able to integrate a project with git in the editor. Slides are made for easy usage and usage instructions are also included on the studenthome page to avoid confusion and guide students in the right direction. 