export function getLuminance(hex: string): number {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const sRGB = [r, g, b].map(val => {
        if (val <= 0.03928) {
            return val / 12.92;
        }
        return Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function getInverseColor(hex?: string): string {
    if (!hex || !hex.startsWith('#')) return '#ffffff';
    const lum = getLuminance(hex);
    // If background is bright, use black icon. If dark, use white icon.
    return lum > 0.5 ? '#000000' : '#ffffff';
}

export function getGlassOutlineColor(hex?: string): string {
    if (!hex || !hex.startsWith('#')) return 'rgba(128, 128, 128, 0.4)';
    const lum = getLuminance(hex);
    // If the font color is light (meaning the background is dark), use a lighter gray.
    // Actually, if the user explicitly wants it darker but gray-scaled, let's just make it a noticeable gray.
    return lum > 0.5 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';
}

export function getWaterColors(fontHex?: string) {
    if (!fontHex || !fontHex.startsWith('#')) {
        // Default light blues
        return {
            blueBase: '59 130 246', // blue-500
            blueLight: '96 165 250', // blue-400
            blueDark: '37 99 235', // blue-600
            cyanBase: '6 182 212', // cyan-500
            cyanLight: '34 211 238', // cyan-400
            cyanDark: '8 145 178', // cyan-600
        };
    }

    const lum = getLuminance(fontHex);

    if (lum < 0.2) {
        // Very dark font color -> Dark water
        return {
            blueBase: '30 58 138', // blue-900
            blueLight: '30 64 175', // blue-800
            blueDark: '23 37 84', // blue-950
            cyanBase: '22 78 99', // cyan-900
            cyanLight: '21 94 117', // cyan-800
            cyanDark: '8 51 68', // cyan-950
        };
    } else if (lum < 0.5) {
        // Medium dark font color -> Medium water
        return {
            blueBase: '29 78 216', // blue-700
            blueLight: '37 99 235', // blue-600
            blueDark: '30 64 175', // blue-800
            cyanBase: '14 116 144', // cyan-700
            cyanLight: '8 145 178', // cyan-600
            cyanDark: '21 94 117', // cyan-800
        };
    }

    // Light font color -> Default light water
    return {
        blueBase: '59 130 246', // blue-500
        blueLight: '96 165 250', // blue-400
        blueDark: '37 99 235', // blue-600
        cyanBase: '6 182 212', // cyan-500
        cyanLight: '34 211 238', // cyan-400
        cyanDark: '8 145 178', // cyan-600
    };
}
