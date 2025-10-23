const axios = require('axios');
const { expect } = require('chai');

describe('端到端系统测试', function() {
    this.timeout(30000);
    
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
    const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';
    
    before(async function() {
        console.log('等待所有服务启动...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    });
    
    describe('系统健康检查', function() {
        it('所有核心服务应该正常运行', async function() {
            const services = [
                { name: '前端服务', url: FRONTEND_URL },
                { name: '后端API', url: `${API_BASE_URL}/health` },
                { name: 'AI服务', url: `${AI_BASE_URL}/health` }
            ];
            
            for (const service of services) {
                try {
                    const response = await axios.get(service.url, { timeout: 5000 });
                    console.log(`✅ ${service.name}: ${response.status}`);
                    expect(response.status).to.be.oneOf([200, 404]); // 前端可能返回404
                } catch (error) {
                    console.log(`❌ ${service.name}: ${error.message}`);
                    throw new Error(`${service.name} 不可访问: ${error.message}`);
                }
            }
        });
    });
    
    describe('完整用户流程测试', function() {
        let authToken = null;
        let userId = null;
        let musicId = null;
        
        const testUser = {
            username: `e2e_user_${Date.now()}`,
            email: `e2e_${Date.now()}@example.com`,
            password: 'E2ETestPassword123!',
            walletAddress: `0x${Date.now().toString(16).padStart(40, '0')}`,
            role: 'artist'
        };
        
        it('用户注册 -> 登录 -> 创建音乐 -> AI分析流程', async function() {
            // 1. 用户注册
            console.log('1. 执行用户注册...');
            const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
            expect(registerResponse.status).to.equal(201);
            userId = registerResponse.data.data.user.id;
            console.log(`   用户ID: ${userId}`);
            
            // 2. 用户登录
            console.log('2. 执行用户登录...');
            const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            expect(loginResponse.status).to.equal(200);
            authToken = loginResponse.data.data.token;
            console.log('   登录成功，获取到token');
            
            // 3. 创建音乐
            console.log('3. 创建音乐...');
            const musicData = {
                title: 'E2E测试音乐',
                genre: 'Electronic',
                description: '端到端测试音乐',
                duration: 240
            };
            
            const musicResponse = await axios.post(`${API_BASE_URL}/api/music`, musicData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(musicResponse.status).to.equal(201);
            musicId = musicResponse.data.data.music._id;
            console.log(`   音乐ID: ${musicId}`);
            
            // 4. 测试AI服务连通性
            console.log('4. 测试AI服务...');
            const aiStatusResponse = await axios.get(`${AI_BASE_URL}/api/v1/status`);
            expect(aiStatusResponse.status).to.equal(200);
            console.log('   AI服务状态正常');
            
            // 5. 验证数据一致性
            console.log('5. 验证数据一致性...');
            const getUserResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(getUserResponse.data.data.user.email).to.equal(testUser.email);
            
            const getMusicResponse = await axios.get(`${API_BASE_URL}/api/music/${musicId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(getMusicResponse.data.data.music.title).to.equal(musicData.title);
            console.log('   数据一致性验证通过');
        });
        
        after(async function() {
            // 清理测试数据
            console.log('清理测试数据...');
            try {
                if (musicId && authToken) {
                    await axios.delete(`${API_BASE_URL}/api/music/${musicId}`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                }
                if (userId && authToken) {
                    await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                }
                console.log('测试数据清理完成');
            } catch (error) {
                console.log('清理测试数据时出错:', error.message);
            }
        });
    });
    
    describe('性能和负载测试', function() {
        it('API响应时间应该在合理范围内', async function() {
            const startTime = Date.now();
            await axios.get(`${API_BASE_URL}/health`);
            const responseTime = Date.now() - startTime;
            
            console.log(`API响应时间: ${responseTime}ms`);
            expect(responseTime).to.be.below(2000); // 2秒内响应
        });
        
        it('AI服务响应时间应该在合理范围内', async function() {
            const startTime = Date.now();
            await axios.get(`${AI_BASE_URL}/health`);
            const responseTime = Date.now() - startTime;
            
            console.log(`AI服务响应时间: ${responseTime}ms`);
            expect(responseTime).to.be.below(5000); // 5秒内响应
        });
        
        it('并发请求处理', async function() {
            const concurrentRequests = 10;
            const requests = Array(concurrentRequests).fill().map(() => 
                axios.get(`${API_BASE_URL}/health`)
            );
            
            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            console.log(`${concurrentRequests}个并发请求总时间: ${totalTime}ms`);
            responses.forEach(response => {
                expect(response.status).to.equal(200);
            });
            
            expect(totalTime).to.be.below(10000); // 10秒内完成
        });
    });
    
    describe('错误处理和恢复', function() {
        it('无效API请求应该返回适当的错误', async function() {
            try {
                await axios.get(`${API_BASE_URL}/api/nonexistent-endpoint`);
                throw new Error('应该返回404错误');
            } catch (error) {
                expect(error.response.status).to.equal(404);
            }
        });
        
        it('无效认证应该返回401错误', async function() {
            try {
                await axios.get(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: 'Bearer invalid-token' }
                });
                throw new Error('应该返回401错误');
            } catch (error) {
                expect(error.response.status).to.equal(401);
            }
        });
    });
});