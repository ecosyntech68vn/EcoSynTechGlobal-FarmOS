const { google } = require('googleapis');
const axios = require('axios');

class OnlineTestSystemSkill {
  static name = 'online-test-system';
  static description = 'Hệ thống thi trực tuyến - Kết nối Google Drive lấy câu hỏi';

  constructor() {
    this.scopes = ['https://www.googleapis.com/auth/drive.readonly'];
    this.timeLimit = 30;
  }

  async execute(context) {
    const { 
      jobPosition = '', 
      accessToken = null,
      folderId = null,
      testConfig = {}
    } = context;

    let questions = [];
    
    if (accessToken && folderId) {
      questions = await this.fetchFromGoogleDrive(accessToken, folderId, jobPosition);
    } else {
      questions = this.getDefaultQuestions(jobPosition);
    }

    const test = this.createTest(questions, testConfig);
    const links = this.generateTestLinks(test);
    const gradingConfig = this.setupGrading(test);
    
    return {
      test,
      questions: test.questions,
      links,
      gradingConfig,
      results: this.calculateResultsStructure(),
      analytics: this.getAnalytics()
    };
  }

  async fetchFromGoogleDrive(accessToken, folderId, position) {
    try {
      const drive = google.drive({ version: 'v3', auth: accessToken });
      
      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains '${position}'`,
        fields: 'files(id, name, mimeType)',
        pageSize: 10
      });

      const questions = [];
      
      for (const file of response.data.files || []) {
        if (file.mimeType.includes('spreadsheet')) {
          const sheetData = await this.fetchSheetData(accessToken, file.id);
          questions.push(...sheetData);
        } else if (file.mimeType.includes('document')) {
          const docData = await this.fetchDocData(accessToken, file.id);
          questions.push(...docData);
        }
      }

      return questions;
    } catch (error) {
      console.error('Google Drive Error:', error.message);
      return this.getDefaultQuestions(position);
    }
  }

  async fetchSheetData(accessToken, fileId) {
    try {
      const drive = google.drive({ version: 'v3', auth: accessToken });
      const metadata = await drive.files.get({ fileId, fields: 'name' });
      
      return [
        {
          category: metadata.data.name,
          question: 'Câu hỏi từ Google Sheet',
          type: 'multiple_choice',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          difficulty: 'medium',
          points: 10
        }
      ];
    } catch (error) {
      return [];
    }
  }

  async fetchDocData(accessToken, fileId) {
    try {
      const drive = google.drive({ version: 'v3', auth: accessToken });
      const doc = await drive.files.get({ 
        fileId, 
        alt: 'media',
        fields: 'data'
      });
      
      return [
        {
          category: 'Google Doc',
          question: doc.data?.substring(0, 100) || 'Câu hỏi từ Google Doc',
          type: 'text',
          difficulty: 'medium',
          points: 10
        }
      ];
    } catch (error) {
      return [];
    }
  }

  getDefaultQuestions(position) {
    const questionBanks = {
      'software': [
        { id: 1, category: 'Programming', question: 'Giải thích thuật toán Quick Sort?', type: 'text', difficulty: 'hard', points: 20 },
        { id: 2, category: 'JavaScript', question: 'Khác biệt let, const, var?', type: 'multiple_choice', options: ['Scope', 'Hoisting', 'Both', 'None'], correctAnswer: 2, difficulty: 'medium', points: 15 },
        { id: 3, category: 'React', question: 'Lifecycle methods trong React?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 4, category: 'Database', question: 'Khác biệt SQL và NoSQL?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 5, category: 'API', question: 'RESTful API là gì?', type: 'text', difficulty: 'easy', points: 10 }
      ],
      'design': [
        { id: 1, category: 'UX Principles', question: 'Nguyên tắc UX cơ bản?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 2, category: 'Figma', question: 'Tạo component trong Figma?', type: 'text', difficulty: 'easy', points: 10 },
        { id: 3, category: 'Color Theory', question: 'Màu bổ sung của Xanh lam?', type: 'multiple_choice', options: ['Đỏ', 'Cam', 'Tím', 'Vàng'], correctAnswer: 0, difficulty: 'easy', points: 10 },
        { id: 4, category: 'Typography', question: 'Phân biệt Serif và Sans-serif?', type: 'text', difficulty: 'easy', points: 10 }
      ],
      'sales': [
        { id: 1, category: 'Sales Process', question: 'Các bước trong sales funnel?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 2, category: 'Negotiation', question: 'Kỹ thuật đàm phán?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 3, category: 'CRM', question: 'Chức năng chính của CRM?', type: 'multiple_choice', options: ['Quản lýKH', 'Bán hàng', 'Marketing', 'Tất cả'], correctAnswer: 3, difficulty: 'easy', points: 10 },
        { id: 4, category: 'Communication', question: 'Cách xử lý khách hàng khó tính?', type: 'text', difficulty: 'medium', points: 15 }
      ],
      'marketing': [
        { id: 1, category: 'Digital Marketing', question: 'Các kênh marketing online?', type: 'text', difficulty: 'easy', points: 10 },
        { id: 2, category: 'SEO', question: 'Các yếu tố xếp hạng SEO?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 3, category: 'Analytics', question: 'Metrics quan trọng trong marketing?', type: 'text', difficulty: 'medium', points: 15 },
        { id: 4, category: 'Content', question: 'Cách tạo content viral?', type: 'text', difficulty: 'hard', points: 20 }
      ],
      'default': [
        { id: 1, category: 'General', question: 'Giới thiệu về bản thân?', type: 'text', difficulty: 'easy', points: 10 },
        { id: 2, category: 'Experience', question: 'Kinh nghiệm làm việc?', type: 'text', difficulty: 'easy', points: 10 },
        { id: 3, category: 'Skills', question: 'Điểm mạnh của bạn?', type: 'text', difficulty: 'easy', points: 10 },
        { id: 4, category: 'Goals', question: 'Mục tiêu nghề nghiệp?', type: 'text', difficulty: 'easy', points: 10 }
      ]
    };

    const category = position.toLowerCase();
    for (const [key, questions] of Object.entries(questionBanks)) {
      if (category.includes(key)) return questions;
    }
    return questionBanks.default;
  }

  createTest(questions, config) {
    const timeLimit = config.timeLimit || this.timeLimit;
    const passingScore = config.passingScore || 60;
    const shuffled = this.shuffleArray([...questions]);
    
    return {
      id: this.generateTestId(),
      title: `Bài test: ${config.position || 'Ứng viên'}`,
      questions: shuffled.slice(0, config.maxQuestions || 20),
      timeLimit,
      passingScore,
      randomize: config.randomize || true,
      showResult: config.showResult || true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timeLimit * 60 * 1000).toISOString()
    };
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], [array[j]] = [array[j], array[i]];
    }
    return array;
  }

  generateTestId() {
    return 'TEST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  generateTestLinks(test) {
    return {
      testUrl: `/api/test/${test.id}/take`,
      resultUrl: `/api/test/${test.id}/result`,
      adminUrl: `/api/test/${test.id}/admin`,
      embedCode: `<iframe src="/test/${test.id}/embed" width="100%" height="600"></iframe>`
    };
  }

  setupGrading(test) {
    return {
      autoGrade: true,
      passingScore: test.passingScore,
      gradingRules: [
        { type: 'multiple_choice', autoGrade: true, pointsPerQuestion: 10 },
        { type: 'text', requireReview: true, pointsPerQuestion: 15 },
        { type: 'essay', requireReview: true, pointsPerQuestion: 20 }
      ],
      analytics: {
        trackTime: true,
        trackAttempts: true,
        generateReport: true
      }
    };
  }

  calculateResultsStructure() {
    return {
      score: { type: 'number', format: 'percentage' },
      timeTaken: { type: 'number', format: 'minutes' },
      correctAnswers: { type: 'number' },
      incorrectAnswers: { type: 'number' },
      detailedReport: {
        byCategory: true,
        byDifficulty: true,
        recommendations: true
      }
    };
  }

  getAnalytics() {
    return {
      trackMetrics: ['completion_rate', 'average_score', 'time_distribution'],
      dashboards: ['overall', 'by_position', 'by_difficulty'],
      exportFormats: ['PDF', 'Excel', 'CSV']
    };
  }
}

module.exports = OnlineTestSystemSkill;