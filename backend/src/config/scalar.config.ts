import { registerAs } from '@nestjs/config';


// Config registration function
export default registerAs('scalar', () => ({
  theme: process.env.SCALAR_THEME || 'purple',
  title: process.env.SCALAR_TITLE || 'Customer App Web API',
  description: process.env.SCALAR_DESCRIPTION || 'Empower coaches to manage clients, track progress, and deliver results — all in one simple, powerful tool.',
  showSidebar: process.env.SCALAR_SHOW_SIDEBAR !== 'false',
  hideDownloadButton: process.env.SCALAR_HIDE_DOWNLOAD === 'true',
  hideTryItPanel: process.env.SCALAR_HIDE_TRY_IT === 'true',
  layout: process.env.SCALAR_LAYOUT || 'modern',
}));
