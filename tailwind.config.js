/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        p: { DEFAULT: '#0F5F57', dark: '#083F3A', light: '#17877B', mint: '#E8F5F2', mint2: '#CDEBE4', side: '#0A4A44', side2: '#06302C' },
        acc: { DEFAULT: '#FF6A3D', soft: '#FFE9E1' },
        ink: { DEFAULT: '#0E1B19', 2: '#334542' },
        mut: '#6B7C7A',
        line: '#E3EAE8',
        bg: '#F5F8F7',
        ok: { DEFAULT: '#129A4E', soft: '#E3F6EA' },
        bad: { DEFAULT: '#E5484D', soft: '#FDECEC' },
        warn: { DEFAULT: '#D98A06', soft: '#FFF4DC' },
        blue: { DEFAULT: '#2F6FEB', soft: '#E7EFFE' },
        vio: { DEFAULT: '#7C4DDB', soft: '#EFE8FD' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Inter Display"', 'Inter', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(14,27,25,.04), 0 8px 24px -12px rgba(8,63,58,.12)',
        pop: '0 24px 48px -20px rgba(8,63,58,.45)',
        btn: '0 8px 16px -8px rgba(15,95,87,.65)',
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};
