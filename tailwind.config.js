/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Pretendard-Bold'], // Default text is now Bold
                bold: ['Pretendard-ExtraBold'], // Bold text is now ExtraBold
                medium: ['Pretendard-SemiBold'], // Medium maps to SemiBold (need to ensure I have this or just use Bold) -> Let's stick to what we have:
                // Actually I don't have SemiBold downloaded. Let's use Bold for medium too or ExtraBold.
                // Let's assume:
                // sans -> Bold
                // bold -> ExtraBold
                // extrabold -> Black

                sans: ['Pretendard-Bold'],
                bold: ['Pretendard-ExtraBold'],
                medium: ['Pretendard-Bold'], // Bump medium to Bold
                extrabold: ['Pretendard-Black'],
                black: ['Pretendard-Black'],
            },
            colors: {
                clony: {
                    primary: '#00D182',
                    secondary: '#34D399',
                    dark: '#1F2937',
                    light: '#F3F4F6',
                }
            },
        },
    },
    plugins: [],
}
