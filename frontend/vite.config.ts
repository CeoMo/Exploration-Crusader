import { defineConfig } from 'vite';
export default defineConfig({server:{proxy:{'/api':'http://127.0.0.1:8001'}},build:{rollupOptions:{output:{manualChunks:(id:string)=>id.includes('node_modules/phaser')?'phaser':undefined}}}});
