const fs = require('fs');
const path = require('path');

const skills = {
  business: [
    { name: 'Strategic Planner AI', file: 'strategic-planner.skill.js' },
    { name: 'KPI Dashboard', file: 'kpi-dashboard.skill.js' },
    { name: 'Financial Forecasting', file: 'financial-forecasting.skill.js' },
    { name: 'Risk Assessment Engine', file: 'risk-assessment.skill.js' },
    { name: 'Competitive Intelligence', file: 'competitive-intelligence.skill.js' },
    { name: 'Profit Optimizer', file: 'profit-optimizer.skill.js' },
    { name: 'Business Scenario Simulator', file: 'business-scenario-simulator.skill.js' },
    { name: 'Business Report Generator', file: 'business-report-generator.skill.js' }
  ],
  sales: [
    { name: 'Sales Pipeline Manager', file: 'sales-pipeline-manager.skill.js' },
    { name: 'Lead Scoring AI', file: 'lead-scoring.skill.js' },
    { name: 'Price Optimization AI', file: 'price-optimization.skill.js' },
    { name: 'Customer Churn Predictor', file: 'customer-churn-predictor.skill.js' },
    { name: 'Upsell/Cross-sell Engine', file: 'upsell-crosssell-engine.skill.js' },
    { name: 'Sales Forecasting AI', file: 'sales-forecasting.skill.js' },
    { name: 'Deal Close Probability', file: 'deal-close-probability.skill.js' },
    { name: 'CRM Automation', file: 'crm-automation.skill.js' },
    { name: 'Sales Proposal Generator', file: 'sales-proposal-generator.skill.js' }
  ],
  hr: [
    { name: 'Resume Screening AI', file: 'resume-screening.skill.js' },
    { name: 'Candidate Matching', file: 'candidate-matching.skill.js' },
    { name: 'Employee Retention Predictor', file: 'employee-retention-predictor.skill.js' },
    { name: 'Performance Review Auto', file: 'performance-review-auto.skill.js' },
    { name: 'Skills Gap Analyzer', file: 'skills-gap-analyzer.skill.js' },
    { name: 'Attrition Risk Detector', file: 'attrition-risk-detector.skill.js' },
    { name: 'Workforce Planning AI', file: 'workforce-planning.skill.js' },
    { name: 'Online Test System', file: 'online-test-system.skill.js', description: 'Thi trực tuyến - Kết nối Google Drive' },
    { name: 'Interview Scheduler', file: 'interview-scheduler.skill.js', description: 'Lên lịch phỏng vấn tự động với Google Calendar' },
    { name: 'Salary Benchmarking', file: 'salary-benchmarking.skill.js', description: 'So sánh lương thị trường' },
    { name: 'Job Description Generator', file: 'job-description-generator.skill.js', description: 'Tạo JD tự động với AI' },
    { name: 'Employee Engagement Survey', file: 'employee-engagement-survey.skill.js', description: 'Khảo sát gắn kết nhân viên' }
  ],
marketing: [
    { name: 'Campaign Optimizer', file: 'campaign-optimizer.skill.js' },
    { name: 'Content Generator AI', file: 'content-generator.skill.js' },
    { name: 'Social Sentiment Analyzer', file: 'social-sentiment-analyzer.skill.js' },
    { name: 'SEO Auto Optimizer', file: 'seo-auto-optimizer.skill.js' },
    { name: 'Audience Persona Builder', file: 'audience-persona-builder.skill.js' },
    { name: 'Ad Spend Optimizer', file: 'ad-spend-optimizer.skill.js' },
    { name: 'Email Campaign Automation', file: 'email-campaign-automation.skill.js' },
    { name: 'Viral Trend Detector', file: 'viral-trend-detector.skill.js' }
  ],
  
  // NEW MARKETING AUTOMATION SKILLS
  marketingPublishing: [
    { name: 'Multi-Platform Publisher', file: 'publishing/multi-platform-publisher.skill.js' },
    { name: 'Content Calendar', file: 'publishing/content-calendar.skill.js' }
  ],
  marketingLeadGen: [
    { name: 'Facebook Lead Crawler', file: 'lead-gen/facebook-lead-crawler.skill.js' },
    { name: 'Sales Funnel Automation', file: 'lead-gen/sales-funnel-automation.skill.js' }
  ],
  marketingCustomerCare: [
    { name: 'Telegram Sales Bot', file: 'customer-care/telegram-sales-bot.skill.js' },
    { name: 'Zalo Marketing Automation', file: 'customer-care/zalo-marketing-automation.skill.js' },
    { name: 'Customer Care Hub', file: 'customer-care/customer-care-hub.skill.js' }
  ],
  marketingAds: [
    { name: 'Ad Campaign Manager', file: 'ads/ad-campaign-manager.skill.js' }
  ],
  marketingAnalytics: [
    { name: 'Marketing Analytics Dashboard', file: 'analytics/marketing-analytics.skill.js' },
    { name: 'Competitor Monitor', file: 'analytics/competitor-monitor.skill.js' }
  ]
};

module.exports = aiForManagersSkills;

if (require.main === module) {
  console.log('='.repeat(50));
  console.log('🎯 AI FOR MANAGERS - MARKETING AUTOMATION');
  console.log('='.repeat(50));
  console.log(`\n📊 Total Skills: ${aiForManagersSkills.metadata.totalSkills}`);

  Object.entries(skills).forEach(([category, skillList]) => {
    console.log(`\n📂 ${category.toUpperCase()} (${skillList.length} skills):`);
    skillList.forEach(s => console.log(`   • ${s.name}`));
  });

  // Marketing automation
  const marketingNew = [
    ...skills.marketingPublishing, ...skills.marketingLeadGen, 
    ...skills.marketingCustomerCare, ...skills.marketingAds, ...skills.marketingAnalytics
  ];
  console.log(`\n📢 MARKETING AUTOMATION (${marketingNew.length} skills):`);
  marketingNew.forEach(s => console.log(`   • ${s.name}`));

  console.log('\n' + '='.repeat(50));
  console.log('✅ All skills loaded successfully!');
  console.log('='.repeat(50));
}