import handler from './pages/api/bot.js';

async function startLoop() {
    console.log("🚀 LTC Real-time Bot: Starting Loop (Every 10s)");

    while (true) {
        try {
            const mockReq = { method: 'GET' };
            const mockRes = {
                status: () => ({ json: (data) => data }),
                setHeader: () => {}
            };

            await handler(mockReq, mockRes);
            console.log(`✅ Update Success: ${new Date().toLocaleTimeString()}`);
        } catch (e) {
            console.error("❌ Loop Error:", e.message);
        }

        // รอ 10 วินาที
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

startLoop();