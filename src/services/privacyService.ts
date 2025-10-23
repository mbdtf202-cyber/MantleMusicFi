import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

// URL参数替换辅助函数
function replaceUrlParams(url: string, params: Record<string, string>): string {
  let result = url;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
}

// 接口定义
export interface ZKVerification {
  status: 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
  level: string | null;
  expiryTime: number | null;
  isValid: boolean;
  verificationTime?: number;
  verifier?: string;
}

export interface SBTToken {
  tokenId: number;
  tokenType: string;
  score: number;
  isActive: boolean;
  issuedTime: number;
  expiryTime: number;
  metadataURI: string;
}

export interface ComplianceCheck {
  compliant: boolean;
  requirement: string;
  failureReasons: string[];
}

export interface KYCSubmission {
  address: string;
  level: string;
  commitmentHash: string;
  nullifierHash: string;
  proofHash: string;
}

export class PrivacyService {
  // 获取ZK-KYC验证状态
  static async getZKVerificationStatus(address: string): Promise<ZKVerification> {
    try {
      // 暂时返回模拟数据，跳过API调用
      console.log('Using mock ZK verification data for testing');
      return this.getMockZKVerification();
      
      // TODO: 恢复API调用当认证问题解决后
      // const url = replaceUrlParams(API_ENDPOINTS.PRIVACY.ZK_KYC_STATUS, { address });
      // const response = await fetch(`${API_BASE_URL}${url}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('ZK verification status received:', data);
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch ZK verification status:', error);
      return this.getMockZKVerification();
    }
  }

  // 提交ZK-KYC验证
  static async submitZKVerification(submission: KYCSubmission): Promise<{ success: boolean; message: string }> {
    try {
      // 暂时返回模拟响应
      console.log('Using mock ZK verification submission for testing');
      return { success: true, message: 'ZK-KYC verification submitted successfully!' };
      
      // TODO: 恢复API调用
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRIVACY.ZK_KYC_SUBMIT}`, {
      //   method: 'POST',
      //   headers: {
      //     ...getAuthHeaders(),
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(submission),
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data;
    } catch (error) {
      console.error('Failed to submit ZK verification:', error);
      return { success: false, message: 'Submission failed' };
    }
  }

  // 获取用户SBT代币
  static async getUserSBTTokens(address: string): Promise<SBTToken[]> {
    try {
      // 暂时返回模拟数据
      console.log('Using mock SBT tokens data for testing');
      return this.getMockSBTTokens();
      
      // TODO: 恢复API调用
      // const url = replaceUrlParams(API_ENDPOINTS.PRIVACY.SBT_USER, { address });
      // const response = await fetch(`${API_BASE_URL}${url}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data?.tokens || data.tokens || [];
    } catch (error) {
      console.error('Failed to fetch SBT tokens:', error);
      return this.getMockSBTTokens();
    }
  }

  // 检查合规状态
  static async checkCompliance(address: string, requirement: string): Promise<ComplianceCheck> {
    try {
      // 暂时返回模拟数据
      console.log('Using mock compliance data for testing');
      return this.getMockComplianceCheck(requirement);
      
      // TODO: 恢复API调用
      // const url = replaceUrlParams(API_ENDPOINTS.PRIVACY.COMPLIANCE_CHECK, { address });
      // const response = await fetch(`${API_BASE_URL}${url}?requirement=${requirement}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data || data;
    } catch (error) {
      console.error('Failed to check compliance:', error);
      return this.getMockComplianceCheck(requirement);
    }
  }

  // 获取多个合规要求的状态
  static async getComplianceStatus(address: string, requirements: string[]): Promise<ComplianceCheck[]> {
    try {
      const compliancePromises = requirements.map(req => this.checkCompliance(address, req));
      const results = await Promise.all(compliancePromises);
      return results.filter(Boolean);
    } catch (error) {
      console.error('Failed to get compliance status:', error);
      return requirements.map(req => this.getMockComplianceCheck(req));
    }
  }

  // 模拟数据方法
  private static getMockZKVerification(): ZKVerification {
    return {
      status: 'Verified',
      level: 'Standard',
      expiryTime: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1年后过期
      isValid: true,
      verificationTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30天前验证
      verifier: 'ZK-KYC Provider'
    };
  }

  private static getMockSBTTokens(): SBTToken[] {
    return [
      {
        tokenId: 1,
        tokenType: 'Accredited Investor',
        score: 95,
        isActive: true,
        issuedTime: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60天前发行
        expiryTime: Date.now() + 305 * 24 * 60 * 60 * 1000, // 305天后过期
        metadataURI: 'ipfs://QmAccreditedInvestorMetadata'
      },
      {
        tokenId: 2,
        tokenType: 'Music Industry Professional',
        score: 88,
        isActive: true,
        issuedTime: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45天前发行
        expiryTime: Date.now() + 320 * 24 * 60 * 60 * 1000, // 320天后过期
        metadataURI: 'ipfs://QmMusicProfessionalMetadata'
      },
      {
        tokenId: 3,
        tokenType: 'Platform Contributor',
        score: 76,
        isActive: true,
        issuedTime: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15天前发行
        expiryTime: Date.now() + 350 * 24 * 60 * 60 * 1000, // 350天后过期
        metadataURI: 'ipfs://QmPlatformContributorMetadata'
      }
    ];
  }

  private static getMockComplianceCheck(requirement: string): ComplianceCheck {
    const mockData: Record<string, ComplianceCheck> = {
      'invest': {
        compliant: true,
        requirement: 'Basic Investment Eligibility',
        failureReasons: []
      },
      'accredited_invest': {
        compliant: true,
        requirement: 'Accredited Investor Status',
        failureReasons: []
      },
      'high_value_invest': {
        compliant: false,
        requirement: 'High Value Investment Eligibility',
        failureReasons: ['Minimum net worth not verified', 'Income verification pending']
      },
      'institutional_invest': {
        compliant: false,
        requirement: 'Institutional Investor Status',
        failureReasons: ['Institution verification required']
      }
    };

    return mockData[requirement] || {
      compliant: false,
      requirement: requirement,
      failureReasons: ['Unknown requirement']
    };
  }
}

export default PrivacyService;