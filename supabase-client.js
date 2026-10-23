// ==================== Supabase 客户端初始化 ====================
const SUPABASE_URL = 'https://mynsjlquktwucqlmfmxf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bnNqbHF1a3R3dWNxbG1mbXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MTM0ODksImV4cCI6MjEwODI4OTQ4OX0.YeqozjbnSr6o8408mYbGFBRvTs5v7LkxoPiUNbKvWyo';

window.supabaseClient = null;

if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase SDK 未加载，请检查 script 标签顺序');
}
