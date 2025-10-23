// MongoDB初始化脚本
db = db.getSiblingDB('mantlemusic');

// 创建用户集合索引
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "walletAddress": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

// 创建音乐集合索引
db.music.createIndex({ "title": "text", "artist": "text", "description": "text" });
db.music.createIndex({ "artist": 1 });
db.music.createIndex({ "genre": 1 });
db.music.createIndex({ "createdAt": -1 });
db.music.createIndex({ "playCount": -1 });
db.music.createIndex({ "likes": -1 });
db.music.createIndex({ "tokenAddress": 1 }, { sparse: true });

// 创建播放列表集合索引
db.playlists.createIndex({ "owner": 1 });
db.playlists.createIndex({ "name": "text", "description": "text" });
db.playlists.createIndex({ "isPublic": 1 });
db.playlists.createIndex({ "createdAt": -1 });

// 创建交易集合索引
db.transactions.createIndex({ "user": 1 });
db.transactions.createIndex({ "tokenAddress": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "createdAt": -1 });
db.transactions.createIndex({ "status": 1 });

// 创建收益集合索引
db.earnings.createIndex({ "user": 1 });
db.earnings.createIndex({ "music": 1 });
db.earnings.createIndex({ "createdAt": -1 });
db.earnings.createIndex({ "type": 1 });

// 创建分析数据集合索引
db.analytics.createIndex({ "music": 1 });
db.analytics.createIndex({ "user": 1 });
db.analytics.createIndex({ "event": 1 });
db.analytics.createIndex({ "timestamp": -1 });

print('MongoDB初始化完成，索引创建成功');