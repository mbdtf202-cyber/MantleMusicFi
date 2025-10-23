const axios = require('axios');
const { expect } = require('chai');

describe('API集成测试', function() {
    this.timeout(10000);
    
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
    const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';
    
    let authToken = null;
    let testUserId = null;
    
    before(async function() {
        // 等待服务启动
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
    
    describe('健康检查', function() {
        it('后端API健康检查应该返回成功', async function() {
            const response = await axios.get(`${API_BASE_URL}/health`);
            expect(response.status).to.equal(200);
            expect(response.data.status).to.equal('OK');
        });
        
        it('AI服务健康检查应该返回成功', async function() {
            const response = await axios.get(`${AI_BASE_URL}/health`);
            expect(response.status).to.equal(200);
            expect(response.data.status).to.equal('healthy');
        });
    });
    
    describe('用户认证流程', function() {
        const timestamp = Date.now();
        const testUser = {
            username: `testuser_${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password: 'TestPassword123!',
            walletAddress: `0x${timestamp.toString(16).padStart(40, '0')}`
        };
        
        it('用户注册应该成功', async function() {
            const userData = {
            ...testUser,
            role: 'artist'
        };
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
            expect(response.status).to.equal(201);
            expect(response.data.success).to.be.true;
            expect(response.data.data.user).to.have.property('id');
            expect(response.data.data).to.have.property('token');
            testUserId = response.data.data.user.id;
            authToken = response.data.data.token; // 从注册响应中获取token
        });
        
        it('用户登录应该成功', async function() {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            expect(response.status).to.equal(200);
            expect(response.data.success).to.be.true;
            expect(response.data.data).to.have.property('token');
            authToken = response.data.data.token;
        });
        
        it('获取用户信息应该成功', async function() {
            const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(response.status).to.equal(200);
            expect(response.data.success).to.be.true;
            expect(response.data.data.user.email).to.equal(testUser.email);
        });
    });
    
    describe('音乐管理流程', function() {
        let testMusicId = null;
        
        it('创建音乐应该成功', async function() {
            const musicData = {
                title: '测试音乐',
                genre: 'Electronic',
                description: '这是一首测试音乐',
                duration: 180
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/music`, musicData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(response.status).to.equal(201);
            expect(response.data.success).to.be.true;
            expect(response.data.data.music).to.have.property('_id');
            testMusicId = response.data.data.music._id;
        });
        
        it('获取音乐列表应该成功', async function() {
            const response = await axios.get(`${API_BASE_URL}/api/music`);
            expect(response.status).to.equal(200);
            expect(response.data.success).to.be.true;
            expect(response.data.data.music).to.be.an('array');
        });
        
        it('获取单个音乐应该成功', async function() {
            if (!testMusicId) {
                this.skip();
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/music/${testMusicId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            expect(response.status).to.equal(200);
            expect(response.data.success).to.be.true;
            expect(response.data.data.music.title).to.equal('测试音乐');
        });
    });
    
    describe('AI服务集成', function() {
        it('AI服务状态检查应该成功', async function() {
            const response = await axios.get(`${AI_BASE_URL}/api/v1/status`);
            expect(response.status).to.equal(200);
            expect(response.data.success).to.be.true;
        });
        
        it('音乐推荐API应该可访问', async function() {
            try {
                const response = await axios.get(`${AI_BASE_URL}/api/v1/recommendations`);
                // AI服务可能返回不同的状态码，这里主要测试连通性
                expect([200, 422, 404]).to.include(response.status);
            } catch (error) {
                // 如果是422或404错误，说明服务是可达的
                expect([422, 404]).to.include(error.response?.status);
            }
        });
    });
    
    describe('服务间通信', function() {
        it('后端应该能够调用AI服务', async function() {
            // 这里可以测试后端调用AI服务的接口
            // 由于我们还没有实现具体的集成接口，这里先跳过
            this.skip();
        });
    });
    
    after(async function() {
        // 清理测试数据
        if (testUserId && authToken) {
            try {
                // 删除测试用户创建的数据
                await axios.delete(`${API_BASE_URL}/api/users/${testUserId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
            } catch (error) {
                console.log('清理测试数据时出错:', error.message);
            }
        }
    });
});