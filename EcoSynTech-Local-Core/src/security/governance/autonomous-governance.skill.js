module.exports = {
  id: 'autonomous-governance',
  name: 'Autonomous Governance System',
  category: 'governance',
  triggers: ['schedule:30m'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'Tự quản lý hệ thống với AI governance, policy enforcement, và decision making',
  governanceFramework: {
    autonomyLevel: 0.85,
    humanOversight: true,
    policyRefreshInterval: 24,
    decisionDocumentation: true
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const governanceStatus = {
      policies: [],
      violations: [],
      decisions: [],
      autonomousActions: 0,
      humanEscalations: 0
    };
    
    try {
      logger.info('[Governance] Running autonomous governance...');
      
      const policies = await loadPolicies(db, logger);
      governanceStatus.policies = policies;
      
      const violations = await detectViolations(policies, db, logger);
      governanceStatus.violations = violations;
      
      for (const violation of violations) {
        const decision = await makeGovernanceDecision(violation, db, logger);
        governanceStatus.decisions.push(decision);
        
        if (decision.autonomous) {
          governanceStatus.autonomousActions++;
          await executeDecision(decision, db, logger);
        } else {
          governanceStatus.humanEscalations++;
          await escalateToHuman(decision, db, logger);
        }
      }
      
      const policyUpdates = await checkPolicyUpdates(policies, db, logger);
      governanceStatus.policies = policyUpdates;
      
      await documentDecisions(governanceStatus.decisions, db, logger);
      
      return {
        ok: governanceStatus.violations.length < 10,
        governanceStatus: governanceStatus,
        violationsCount: governanceStatus.violations.length,
        autonomousActions: governanceStatus.autonomousActions,
        humanEscalations: governanceStatus.humanEscalations,
        recommendations: governanceStatus.violations.length > 0
          ? governanceStatus.violations.length + ' violations need attention'
          : 'All policies enforced',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[Governance] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function loadPolicies(db, logger) {
      try {
        const policies = await db.query('SELECT * FROM governance_policies WHERE active = 1');
        return policies.length > 0 ? policies : getDefaultPolicies();
      } catch {
        return getDefaultPolicies();
      }
    }
    
    function getDefaultPolicies() {
      return [
        { id: 'p1', name: 'Data Retention', rule: 'max_age_days = 90', severity: 'high' },
        { id: 'p2', name: 'Access Control', rule: 'max_failed_login = 5', severity: 'critical' },
        { id: 'p3', name: 'Encryption', rule: 'require_encryption = true', severity: 'critical' },
        { id: 'p4', name: 'Audit Logging', rule: 'log_all_access = true', severity: 'high' },
        { id: 'p5', name: 'Backup Frequency', rule: 'backup_interval_hours = 24', severity: 'high' }
      ];
    }
    
    async function detectViolations(policies, db, logger) {
      const violations = [];
      
      try {
        const failedLogins = await db.query(
          'SELECT ip, COUNT(*) as attempts FROM events WHERE type = "login.failed" AND timestamp > datetime("now", "-1 hour") GROUP BY ip HAVING attempts > 5'
        );
        
        if (failedLogins.length > 0) {
          violations.push({
            policyId: 'p2',
            policyName: 'Access Control',
            severity: 'critical',
            description: failedLogins.length + ' IPs exceeded failed login limit',
            data: failedLogins
          });
        }
      } catch {}
      
      try {
        const unencrypted = await db.query(
          'SELECT COUNT(*) as count FROM data_transmissions WHERE encrypted = 0'
        );
        
        if (unencrypted[0]?.count > 0) {
          violations.push({
            policyId: 'p3',
            policyName: 'Encryption',
            severity: 'critical',
            description: unencrypted[0].count + ' unencrypted transmissions detected'
          });
        }
      } catch {}
      
      return violations;
    }
    
    async function makeGovernanceDecision(violation, db, logger) {
      const decision = {
        violation: violation,
        action: null,
        autonomous: false,
        confidence: 0,
        reasoning: []
      };
      
      if (violation.severity === 'critical') {
        if (this.governanceFramework.autonomyLevel >= 0.8) {
          decision.autonomous = true;
          decision.confidence = 0.95;
          
          if (violation.policyId === 'p2') {
            decision.action = 'block-ip';
            decision.reasoning.push('Critical: Auto-blocking due to repeated failed logins');
          } else if (violation.policyId === 'p3') {
            decision.action = 'encrypt-stream';
            decision.reasoning.push('Critical: Auto-encrypting unencrypted transmissions');
          } else {
            decision.action = 'auto-remediate';
            decision.reasoning.push('Auto-remEDIATE based on policy');
          }
        } else {
          decision.autonomous = false;
          decision.confidence = 0.5;
          decision.action = 'escalate';
          decision.reasoning.push('Severity requires human review');
        }
      } else if (violation.severity === 'high') {
        decision.autonomous = true;
        decision.confidence = 0.85;
        decision.action = 'notify-and-log';
        decision.reasoning.push('High severity - autonomous with notification');
      } else {
        decision.autonomous = true;
        decision.confidence = 0.7;
        decision.action = 'log';
        decision.reasoning.push('Low severity - log and continue');
      }
      
      return decision;
    }
    
    async function executeDecision(decision, db, logger) {
      logger.info('[Governance] Executing: ' + decision.action);
      
      await db.query(
        'INSERT INTO governance_decisions (policy_id, action, autonomous, decision_data, timestamp) VALUES (?, ?, ?, ?, datetime("now"))',
        [decision.violation.policyId, decision.action, 1, JSON.stringify(decision)]
      );
      
      if (decision.action === 'block-ip' && decision.violation.data) {
        for (const ip of decision.violation.data) {
          await db.query(
            'INSERT OR REPLACE INTO ip_blacklist (ip, reason, blockedUntil) VALUES (?, ?, datetime("now", "+1 hour"))',
            [ip.ip, 'governance-violation']
          );
        }
      }
    }
    
    async function escalateToHuman(decision, db, logger) {
      logger.warn('[Governance] Escalating to human: ' + decision.violation.policyName);
      
      await db.query(
        'INSERT INTO governance_escalations (policy_id, decision, escalatedAt) VALUES (?, ?, datetime("now"))',
        [decision.violation.policyId, JSON.stringify(decision)]
      );
    }
    
    async function checkPolicyUpdates(policies, db, logger) {
      return policies;
    }
    
    async function documentDecisions(decisions, db, logger) {
      if (!this.governanceFramework.decisionDocumentation) return;
      
      for (const decision of decisions) {
        try {
          await db.query(
            'INSERT INTO governance_audit (policy_id, action, autonomous, timestamp) VALUES (?, ?, ?, datetime("now"))',
            [decision.violation.policyId, decision.action, decision.autonomous ? 1 : 0]
          );
        } catch {}
      }
    }
  }
};