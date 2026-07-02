# Changelog

## [v2.2.0] - Move-all reliability fix

### 🐛 Fixed
- **"Move all tabs" moved only one tab.** The bulk move recreated tabs one-by-one and stalled if any single tab could not be recreated (chrome:// pages, extension pages, or memory-saver-discarded tabs with an empty URL), leaving the originals in place and only the first tab moved. Bulk move now opens one new window with all movable URLs at once and skips system pages gracefully (they stay put, with a note).

## [v2.1.0] - Bug Fixes Release

### 🐛 Critical Bugs Fixed

1. **Added Error Handling**
   - All Chrome API calls now have proper error handling
   - Users receive feedback when operations fail
   - Prevents silent failures

2. **Tab State Validation**
   - Extension now validates tabs are in incognito mode before attempting to move them
   - Keyboard shortcuts only work in incognito windows
   - Popup buttons are disabled when not in incognito mode

3. **Fixed Race Conditions**
   - Popup no longer closes before operations complete
   - Proper async callback handling
   - Better synchronization between popup and background scripts

4. **Improved User Experience**
   - Visual feedback messages (success/error/warning)
   - Button loading states
   - Clear error messages when things go wrong
   - Disabled button states with visual indicators

5. **Enhanced Communication**
   - Proper message passing between popup and background scripts
   - Response handling for async operations
   - Better error propagation

6. **UI Improvements**
   - Buttons show loading state during operations
   - Clear visual feedback for different states
   - Smooth animations for status messages
   - Better disabled button styling

### 🔧 Technical Improvements

- Added proper callback handling for all async operations
- Implemented comprehensive error checking
- Enhanced logging for debugging
- Improved code structure and reliability
- Better separation of concerns

### 🚀 What's Next

After these critical bug fixes, the next major feature will be **bidirectional functionality** - allowing users to move tabs from regular windows to incognito windows (the reverse of current functionality).

---

## [v2.0] - Previous Release
- Bulk tab movement functionality
- Improved tab group handling 