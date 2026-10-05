import { createApp } from 'vue';
import './style.css';
import App from './app.vue';
import i18n from './i18n.js';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Material from '@primeuix/themes/material';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import Tooltip from 'primevue/tooltip';
import Chart from 'primevue/chart';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    DatePicker,
    Dialog,
    DialogService,
    Divider,
    Drawer,
    FloatLabel,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    Message,
    Password,
    ProgressBar,
    Select,
    SelectButton,
    Skeleton,
    Tag,
    Textarea,
    Timeline,
    Toast,
    ToastService,
    ToggleSwitch,
    Toolbar
} from 'primevue';
import router from './router.js';
import pinia from './pinia.js';

/**
 * Destilatech PrimeVue preset.
 *
 * @remarks
 * Extends the Material theme with the brand palette defined in the Style Guidelines
 * (Deep Copper #7a3b2e as primary, Dark Copper #5c2b21 for hover/active states).
 */
const DestilatechPreset = definePreset(Material, {
    semantic: {
        primary: {
            50: '#fbf5f2',
            100: '#f5e6df',
            200: '#ebcbbd',
            300: '#dca792',
            400: '#c67d63',
            500: '#a85c3f',
            600: '#8f4a34',
            700: '#7a3b2e',
            800: '#5c2b21',
            900: '#45201a',
            950: '#2c140f'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.700}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.800}',
                    activeColor: '{primary.900}'
                },
                highlight: {
                    background: '{primary.100}',
                    focusBackground: '{primary.200}',
                    color: '{primary.800}',
                    focusColor: '{primary.900}'
                }
            }
        }
    }
});

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

// noinspection JSCheckFunctionSignatures
createApp(App)
    .use(i18n)
    .use(PrimeVue, {
        theme: { preset: DestilatechPreset, options: { darkModeSelector: false } },
        ripple: true,
        license: primeUiLicenseKey
    })
    .use(ConfirmationService)
    .use(DialogService)
    .use(ToastService)
    .component('pv-avatar', Avatar)
    .component('pv-badge', Badge)
    .component('pv-button', Button)
    .component('pv-card', Card)
    .component('pv-chart', Chart)
    .component('pv-column', Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table', DataTable)
    .component('pv-date-picker', DatePicker)
    .component('pv-dialog', Dialog)
    .component('pv-divider', Divider)
    .component('pv-drawer', Drawer)
    .component('pv-float-label', FloatLabel)
    .component('pv-icon-field', IconField)
    .component('pv-input-icon', InputIcon)
    .component('pv-input-number', InputNumber)
    .component('pv-input-text', InputText)
    .component('pv-menu', Menu)
    .component('pv-message', Message)
    .component('pv-password', Password)
    .component('pv-progress-bar', ProgressBar)
    .component('pv-select', Select)
    .component('pv-select-button', SelectButton)
    .component('pv-skeleton', Skeleton)
    .component('pv-tag', Tag)
    .component('pv-textarea', Textarea)
    .component('pv-timeline', Timeline)
    .component('pv-toast', Toast)
    .component('pv-toggle-switch', ToggleSwitch)
    .component('pv-toolbar', Toolbar)
    .directive('tooltip', Tooltip)
    .use(pinia)
    .use(router)
    .mount('#app');
