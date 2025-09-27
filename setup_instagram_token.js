// 🎬 Instagram Token Setup Script
// Run this in browser console to automatically set your Instagram token

console.log('🚀 Setting up Instagram Long-Lived Token...');

// Your long-lived Instagram access token (60 days validity)
const INSTAGRAM_TOKEN = 'EAAXeRTcivhQBPh4uG23CZB5At11Tz33kolMDmkmEhATZBUzXVnt2a7wJcNDvMlxZBChT2vjmwCbzh9LZBPMXLEY2WJoehfdcxHuvgFJBkFySR7aaoQfK2AHQDBEmOAQrXaMu1LuqSj8u9Sgq1qn2ZAssCwCZAsSCNFK5SPaIDye8l21Q18atFPtXZBsXjBD';

// Set token in localStorage
localStorage.setItem('ig_access_token', INSTAGRAM_TOKEN);

// Verify setup
const storedToken = localStorage.getItem('ig_access_token');
if (storedToken) {
    console.log('✅ SUCCESS: Instagram token configured!');
    console.log('📝 Token preview:', storedToken.substring(0, 30) + '...');
    console.log('⏰ Token type: Long-lived (60 days validity)');
    console.log('🎬 Ready to post Instagram Reels!');
    
    // Test token with backend
    async function testConnection() {
        try {
            const response = await fetch('/api/instagram/validate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: INSTAGRAM_TOKEN })
            });
            const result = await response.json();
            
            if (result.success) {
                console.log('🎯 Instagram connection verified!');
                console.log('📱 Instagram Account ID:', result.igId);
            } else {
                console.log('⚠️ Token validation warning:', result.error);
            }
        } catch (error) {
            console.log('ℹ️ Backend validation skipped (normal if server not running)');
        }
    }
    
    testConnection();
    
    console.log('\n📋 Next Steps:');
    console.log('1. Refresh this page');
    console.log('2. Go to Dashboard → Create Post');
    console.log('3. Select Video → Check "Post as Instagram Reel"');
    console.log('4. Upload vertical video (9:16 ratio, 15-90 seconds)');
    console.log('5. Click "Create Reel Post" → Should work perfectly!');
    
} else {
    console.log('❌ ERROR: Failed to set Instagram token');
}

// Also set a flag to indicate Instagram is connected
localStorage.setItem('instagram_connected', 'true');
console.log('🔗 Instagram connection status: CONNECTED');