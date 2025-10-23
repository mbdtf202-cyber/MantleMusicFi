const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class IPFSService {
  constructor() {
    // 使用 Pinata 作为 IPFS 服务提供商
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.pinataBaseUrl = 'https://api.pinata.cloud';
    
    // 备用：使用本地 IPFS 节点
    this.localIpfsUrl = process.env.IPFS_URL || 'http://localhost:5001';
  }

  // 上传文件到 IPFS
  async uploadFile(filePath, metadata = {}) {
    try {
      if (this.pinataApiKey && this.pinataSecretKey) {
        return await this.uploadToPinata(filePath, metadata);
      } else {
        return await this.uploadToLocalIPFS(filePath, metadata);
      }
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  // 上传到 Pinata
  async uploadToPinata(filePath, metadata) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const pinataMetadata = JSON.stringify({
      name: metadata.name || 'Mantle Music File',
      keyvalues: metadata
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post(
      `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      }
    );

    return {
      hash: response.data.IpfsHash,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
      gateway: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  }

  // 上传到本地 IPFS 节点
  async uploadToLocalIPFS(filePath, metadata) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(
      `${this.localIpfsUrl}/api/v0/add`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const result = response.data;
    return {
      hash: result.Hash,
      size: result.Size,
      gateway: `${this.localIpfsUrl}/ipfs/${result.Hash}`
    };
  }

  // 上传 JSON 数据到 IPFS
  async uploadJSON(data, metadata = {}) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      if (this.pinataApiKey && this.pinataSecretKey) {
        return await this.uploadJSONToPinata(jsonString, metadata);
      } else {
        return await this.uploadJSONToLocalIPFS(jsonString, metadata);
      }
    } catch (error) {
      console.error('IPFS JSON upload failed:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  // 上传 JSON 到 Pinata
  async uploadJSONToPinata(jsonString, metadata) {
    const pinataMetadata = {
      name: metadata.name || 'Mantle Music JSON',
      keyvalues: metadata
    };

    const response = await axios.post(
      `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
      {
        pinataContent: JSON.parse(jsonString),
        pinataMetadata
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      }
    );

    return {
      hash: response.data.IpfsHash,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
      gateway: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  }

  // 上传 JSON 到本地 IPFS
  async uploadJSONToLocalIPFS(jsonString, metadata) {
    const response = await axios.post(
      `${this.localIpfsUrl}/api/v0/add`,
      jsonString,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;
    return {
      hash: result.Hash,
      size: result.Size,
      gateway: `${this.localIpfsUrl}/ipfs/${result.Hash}`
    };
  }

  // 从 IPFS 获取文件
  async getFile(hash) {
    try {
      let url;
      if (this.pinataApiKey) {
        url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      } else {
        url = `${this.localIpfsUrl}/ipfs/${hash}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('IPFS get file failed:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  // 检查 IPFS 连接状态
  async checkConnection() {
    try {
      if (this.pinataApiKey && this.pinataSecretKey) {
        const response = await axios.get(
          `${this.pinataBaseUrl}/data/testAuthentication`,
          {
            headers: {
              'pinata_api_key': this.pinataApiKey,
              'pinata_secret_api_key': this.pinataSecretKey
            }
          }
        );
        return { connected: true, service: 'Pinata', message: response.data.message };
      } else {
        const response = await axios.get(`${this.localIpfsUrl}/api/v0/version`);
        return { connected: true, service: 'Local IPFS', version: response.data.Version };
      }
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  // 获取文件信息
  async getFileInfo(hash) {
    try {
      if (this.pinataApiKey && this.pinataSecretKey) {
        const response = await axios.get(
          `${this.pinataBaseUrl}/data/pinList?hashContains=${hash}`,
          {
            headers: {
              'pinata_api_key': this.pinataApiKey,
              'pinata_secret_api_key': this.pinataSecretKey
            }
          }
        );
        
        const pin = response.data.rows[0];
        if (pin) {
          return {
            hash: pin.ipfs_pin_hash,
            size: pin.size,
            timestamp: pin.date_pinned,
            metadata: pin.metadata
          };
        }
      }
      
      return { hash, message: 'File info not available' };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return { hash, error: error.message };
    }
  }

  // Mock 方法 - 当 IPFS 不可用时使用
  async mockUpload(data, metadata = {}) {
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    return {
      hash: mockHash,
      size: JSON.stringify(data).length,
      timestamp: new Date().toISOString(),
      gateway: `https://ipfs.io/ipfs/${mockHash}`,
      mock: true
    };
  }
}

module.exports = new IPFSService();