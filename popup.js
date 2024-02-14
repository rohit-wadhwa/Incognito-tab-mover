document.addEventListener('DOMContentLoaded', function () {
    const shortcutInfoElement = document.getElementById('shortcutInfo');
    if (shortcutInfoElement) {
        const osInfo = navigator.platform.toUpperCase();
        if (osInfo.indexOf('MAC') >= 0) {
            shortcutInfoElement.textContent = 'Use Option+M to move tabs';
        } else {
            shortcutInfoElement.textContent = 'Use Alt+M to move tabs';
        }
    }
});
