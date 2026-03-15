# Working Copies Directory

## Purpose
This directory is used to store working copies of `.rmtree` RootsMagic database files during active editing sessions.

## Why This Exists
The RootsMagic database files (`.rmtree`) are SQLite databases that mutate every time they are opened, even if no genealogical changes are made. Without this workflow, every open-and-close cycle would trigger unnecessary git commits, cluttering the repository history.

## Workflow

1. **Development/Research**: Copy the current `Main3.rmtree` from the parent `/tree/` folder into this `working_copies/` directory
2. **Edit**: Open the working copy in RootsMagic and make your genealogical changes
3. **Save**: RootsMagic saves changes to the working copy file
4. **Commit Changes**: When you're satisfied with your edits:
   - Copy the updated working copy back to `/tree/Main3.rmtree`
   - Commit with a clear message describing what genealogical changes were made (e.g., "Add marriage record for John Young and Mary Carey")
5. **Clean Up**: Delete or archive the working copy file (or leave it for reference during the current session)

## Important Notes
- Files in this directory (`.rmtree`) are **excluded from git** - they are temporary and local-only
- Always copy back to `/tree/Main3.rmtree` before committing to preserve the authoritative tree
- Use descriptive commit messages to document what genealogical changes were actually made
- This keeps the repository history clean and meaningful
