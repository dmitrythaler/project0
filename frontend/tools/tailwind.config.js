// const Color = require('color');
// const theme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors')
const path = require('path');
const ROOTDIR = path.resolve(__dirname, '..');


module.exports = {
  theme: {
    fontFamily: {
      sans: [
        'Play',
        // 'Montserrat',
        'system-ui',
        'sans-serif'
      ]
    },
    extend: {
      colors: {
        accent: 'var(--color-accent)',
        'accent-dark': 'var(--color-accent-dark)',
        'accent-text': 'var(--color-accent-text)',
        'accent-contrast': 'var(--color-accent-contrast)',
        orange: colors.orange,
        teal: colors.teal
      },
      spacing: {
        '80': '20rem',
        '96': '24rem',
        '128': '32rem',
      },
    },
  },
  variants: {},
  plugins: [],
  safelist: [
    // 'pe-icon',
    // { pattern: /^pe-icon/ }
  ],
  content: [
    `${ROOTDIR}/src/**/*.ts`,
    `${ROOTDIR}/src/**/*.tsx`,
    `${ROOTDIR}/src/**/*.html`,
    `${ROOTDIR}/src/**/*.svg`
  ],
  // content: {
  //   // enabled: false,
  //   preserveHtmlElements: false,
  //   options: {  //  own PurgeCSS options
  //     css: [
  //       `${ROOTDIR}/src/**/*.css`
  //     ],
  //     blocklist: [
  //       //  the selectors will be blocked from appearing in the final output CSS
  //       //  ['someClass', /^nav-/]
  //     ],
  //     fontFace: false,
  //     keyframes: true,
  //     variables: true,
  //     // rejected: true,
  //   }
  // }
}
