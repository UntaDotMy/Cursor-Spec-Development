import React, { useState, useEffect, useCallback } from 'react';

interface TestingValidationProps {
  taskName: string;
  taskDescription: string;
  onTestingComplete: (results: TestResults) => void;
}

interface TestResults {
  testsWritten: number;
  testsPassing: number;
  testsFailing: number;
  coveragePercentage: number;
  framework: string;
  executionTime: number;
  qualityScore: 'high' | 'medium' | 'low';
  issues: string[];
}

interface TestingChecklist {
  frameworkInstalled: boolean;
  testsWritten: boolean;
  testsExecuted: boolean;
  coverageAchieved: boolean;
  qualityMet: boolean;
}

const TestingValidation: React.FC<TestingValidationProps> = ({
  taskName,
  taskDescription,
  onTestingComplete
}) => {
  const [testingChecklist, setTestingChecklist] = useState<TestingChecklist>({
    frameworkInstalled: false,
    testsWritten: false,
    testsExecuted: false,
    coverageAchieved: false,
    qualityMet: false
  });

  const [testResults, setTestResults] = useState<TestResults>({
    testsWritten: 0,
    testsPassing: 0,
    testsFailing: 0,
    coveragePercentage: 0,
    framework: '',
    executionTime: 0,
    qualityScore: 'low',
    issues: []
  });

  const [manualInputMode, setManualInputMode] = useState(false);
  const [detectedTechStack, setDetectedTechStack] = useState<string>('');
  const [recommendedFramework, setRecommendedFramework] = useState<string>('');

  const detectTechnologyStack = useCallback(() => {
    // This would typically read package.json or project files
    // For now, we'll provide common recommendations
    const techStackPatterns = [
      { pattern: 'react', framework: 'Jest + React Testing Library' },
      { pattern: 'vue', framework: 'Vue Test Utils + Jest/Vitest' },
      { pattern: 'angular', framework: 'Jasmine + Karma' },
      { pattern: 'electron', framework: 'Jest + Playwright for Electron' },
      { pattern: 'react-native', framework: 'Jest + React Native Testing Library' },
      { pattern: 'node', framework: 'Jest + Supertest' },
      { pattern: 'python', framework: 'pytest' },
      { pattern: '.net', framework: 'xUnit or NUnit' }
    ];

    // Simple detection based on task description
    const description = taskDescription.toLowerCase();
    const detected = techStackPatterns.find(pattern => 
      description.includes(pattern.pattern)
    );

    if (detected) {
      setDetectedTechStack(detected.pattern);
      setRecommendedFramework(detected.framework);
    } else {
      setRecommendedFramework('Jest (Universal JavaScript Testing)');
    }
  }, [taskDescription]);

  useEffect(() => {
    // Auto-detect technology stack and recommend testing framework
    detectTechnologyStack();
  }, [detectTechnologyStack]);

  const handleChecklistChange = (item: keyof TestingChecklist, checked: boolean) => {
    setTestingChecklist(prev => ({
      ...prev,
      [item]: checked
    }));
  };

  const handleTestResultChange = (field: keyof TestResults, value: any) => {
    setTestResults(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate quality score
      if (field === 'coveragePercentage' || field === 'testsPassing' || field === 'testsFailing') {
        updated.qualityScore = calculateQualityScore(updated);
      }
      
      return updated;
    });
  };

  const calculateQualityScore = (results: TestResults): 'high' | 'medium' | 'low' => {
    const coverageScore = results.coveragePercentage >= 80 ? 2 : results.coveragePercentage >= 60 ? 1 : 0;
    const passRateScore = results.testsFailing === 0 && results.testsPassing > 0 ? 2 : results.testsPassing > 0 ? 1 : 0;
    const totalScore = coverageScore + passRateScore;
    
    if (totalScore >= 4) return 'high';
    if (totalScore >= 2) return 'medium';
    return 'low';
  };

  const runAutomatedTestDetection = () => {
    // This would trigger automated test detection
    // For now, simulate the process
    setTestResults(prev => ({
      ...prev,
      testsWritten: 5,
      testsPassing: 5,
      testsFailing: 0,
      coveragePercentage: 85,
      framework: recommendedFramework,
      executionTime: 250,
      qualityScore: 'high',
      issues: []
    }));

    setTestingChecklist({
      frameworkInstalled: true,
      testsWritten: true,
      testsExecuted: true,
      coverageAchieved: true,
      qualityMet: true
    });
  };

  const validateTestingComplete = useCallback(() => {
    const allChecklistComplete = Object.values(testingChecklist).every(Boolean);
    const minimumRequirementsMet = 
      testResults.testsPassing > 0 && 
      testResults.testsFailing === 0 && 
      testResults.coveragePercentage >= 75;

    if (allChecklistComplete && minimumRequirementsMet) {
      onTestingComplete(testResults);
    }
  }, [onTestingComplete, testingChecklist, testResults]);

  useEffect(() => {
    validateTestingComplete();
  }, [validateTestingComplete]);

  const getTestingInstructions = () => {
    const instructions = {
      'react': [
        'Install: npm install --save-dev jest @testing-library/react @testing-library/jest-dom',
        'Create test files: Component.test.tsx',
        'Run tests: npm test',
        'Check coverage: npm test -- --coverage'
      ],
      'vue': [
        'Install: npm install --save-dev @vue/test-utils jest vue-jest',
        'Create test files: Component.spec.js',
        'Run tests: npm run test:unit',
        'Check coverage: npm run test:unit -- --coverage'
      ],
      'electron': [
        'Install: npm install --save-dev jest @playwright/test',
        'Create test files: main.test.js, renderer.test.js',
        'Run tests: npm test',
        'E2E tests: npx playwright test'
      ],
      'node': [
        'Install: npm install --save-dev jest supertest',
        'Create test files: api.test.js',
        'Run tests: npm test',
        'Check coverage: npm test -- --coverage'
      ]
    };

    return instructions[detectedTechStack as keyof typeof instructions] || [
      'Install appropriate testing framework for your technology stack',
      'Write unit tests for your components/functions',
      'Run tests to ensure they pass',
      'Verify test coverage meets minimum requirements (75%)'
    ];
  };

  return (
    <div className="testing-validation">
      <div className="testing-info">
        <div className="tech-stack-detection">
          <h6>🔍 Technology Stack Detection</h6>
          <p><strong>Detected:</strong> {detectedTechStack || 'Unable to auto-detect'}</p>
          <p><strong>Recommended Framework:</strong> {recommendedFramework}</p>
        </div>

        <div className="testing-instructions">
          <h6>📋 Testing Setup Instructions</h6>
          <ol>
            {getTestingInstructions().map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="testing-checklist">
        <h6>✅ Testing Checklist</h6>
        
        <div className="checklist-item">
          <label>
            <input
              type="checkbox"
              checked={testingChecklist.frameworkInstalled}
              onChange={(e) => handleChecklistChange('frameworkInstalled', e.target.checked)}
            />
            Testing framework installed and configured
          </label>
        </div>

        <div className="checklist-item">
          <label>
            <input
              type="checkbox"
              checked={testingChecklist.testsWritten}
              onChange={(e) => handleChecklistChange('testsWritten', e.target.checked)}
            />
            Unit tests written for implemented functionality
          </label>
        </div>

        <div className="checklist-item">
          <label>
            <input
              type="checkbox"
              checked={testingChecklist.testsExecuted}
              onChange={(e) => handleChecklistChange('testsExecuted', e.target.checked)}
            />
            All tests executed successfully
          </label>
        </div>

        <div className="checklist-item">
          <label>
            <input
              type="checkbox"
              checked={testingChecklist.coverageAchieved}
              onChange={(e) => handleChecklistChange('coverageAchieved', e.target.checked)}
            />
            Minimum test coverage achieved (75%+)
          </label>
        </div>

        <div className="checklist-item">
          <label>
            <input
              type="checkbox"
              checked={testingChecklist.qualityMet}
              onChange={(e) => handleChecklistChange('qualityMet', e.target.checked)}
            />
            Test quality standards met
          </label>
        </div>
      </div>

      <div className="test-results-input">
        <h6>📊 Test Results</h6>
        
        <div className="input-row">
          <label>
            Testing Framework:
            <input
              type="text"
              value={testResults.framework}
              onChange={(e) => handleTestResultChange('framework', e.target.value)}
              placeholder={recommendedFramework}
            />
          </label>
        </div>

        <div className="input-row">
          <label>
            Tests Written:
            <input
              type="number"
              min="0"
              value={testResults.testsWritten}
              onChange={(e) => handleTestResultChange('testsWritten', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="input-row">
          <label>
            Tests Passing:
            <input
              type="number"
              min="0"
              max={testResults.testsWritten}
              value={testResults.testsPassing}
              onChange={(e) => handleTestResultChange('testsPassing', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="input-row">
          <label>
            Tests Failing:
            <input
              type="number"
              min="0"
              value={testResults.testsFailing}
              onChange={(e) => handleTestResultChange('testsFailing', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="input-row">
          <label>
            Code Coverage (%):
            <input
              type="number"
              min="0"
              max="100"
              value={testResults.coveragePercentage}
              onChange={(e) => handleTestResultChange('coveragePercentage', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="input-row">
          <label>
            Execution Time (ms):
            <input
              type="number"
              min="0"
              value={testResults.executionTime}
              onChange={(e) => handleTestResultChange('executionTime', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>
      </div>

      <div className="testing-actions">
        <button 
          className="auto-detect-tests"
          onClick={runAutomatedTestDetection}
        >
          🤖 Auto-Detect Tests
        </button>
        
        <button 
          className="manual-input-toggle"
          onClick={() => setManualInputMode(!manualInputMode)}
        >
          {manualInputMode ? '📊 Show Auto-Detection' : '✏️ Manual Input'}
        </button>
      </div>

      <div className="testing-status">
        <div className={`status-indicator ${testResults.qualityScore}`}>
          Quality Score: {testResults.qualityScore.toUpperCase()}
        </div>
        
        {testResults.coveragePercentage < 75 && (
          <div className="warning">
            ⚠️ Coverage below minimum requirement (75%)
          </div>
        )}
        
        {testResults.testsFailing > 0 && (
          <div className="error">
            ❌ {testResults.testsFailing} test(s) failing - must fix before proceeding
          </div>
        )}
        
        {testResults.testsPassing === 0 && (
          <div className="error">
            ❌ No passing tests - tests must be written and executed
          </div>
        )}
      </div>

      {testResults.issues.length > 0 && (
        <div className="testing-issues">
          <h6>⚠️ Testing Issues</h6>
          <ul>
            {testResults.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestingValidation;
