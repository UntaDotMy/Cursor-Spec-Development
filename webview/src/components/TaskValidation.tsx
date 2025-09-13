import React, { useState } from 'react';
import TestingValidation from './TestingValidation';

interface TaskValidationProps {
  taskName: string;
  taskDescription: string;
  validationCriteria: string[];
  onValidationComplete: (validated: boolean, feedback?: string, errors?: string[], testResults?: TestResults) => void;
  onCancel: () => void;
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

const TaskValidation: React.FC<TaskValidationProps> = ({
  taskName,
  taskDescription,
  validationCriteria,
  onValidationComplete,
  onCancel
}) => {
  const [validationResults, setValidationResults] = useState<{ [key: string]: boolean }>({});
  const [userFeedback, setUserFeedback] = useState('');
  const [encounteredErrors, setEncounteredErrors] = useState<string[]>(['']);
  const [showErrorSection, setShowErrorSection] = useState(false);
  const [showTestingSection, setShowTestingSection] = useState(true);
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
  const [testingComplete, setTestingComplete] = useState(false);

  const handleCriterionChange = (criterion: string, passed: boolean) => {
    setValidationResults((prev: { [key: string]: boolean }) => ({
      ...prev,
      [criterion]: passed
    }));
  };

  const handleErrorChange = (index: number, error: string) => {
    const newErrors = [...encounteredErrors];
    newErrors[index] = error;
    setEncounteredErrors(newErrors);
  };

  const addErrorField = () => {
    setEncounteredErrors([...encounteredErrors, '']);
  };

  const removeErrorField = (index: number) => {
    const newErrors = encounteredErrors.filter((_, i) => i !== index);
    setEncounteredErrors(newErrors.length > 0 ? newErrors : ['']);
  };

  const handleTestingComplete = (results: TestResults) => {
    setTestResults(results);
    setTestingComplete(true);
  };
  
  const handleSubmit = () => {
    const allCriteriaMet = validationCriteria.every(criterion => 
      validationResults[criterion] === true
    );
    
    const nonEmptyErrors = encounteredErrors.filter(error => error.trim() !== '');
    
    // Check if testing requirements are met
    const testingRequirementsMet = testingComplete && 
                                   testResults.testsPassing > 0 && 
                                   testResults.testsFailing === 0 &&
                                   testResults.coveragePercentage >= 75; // Minimum 75% coverage
    
    const validated = allCriteriaMet && testingRequirementsMet;
    
    onValidationComplete(
      validated,
      userFeedback.trim() || undefined,
      nonEmptyErrors.length > 0 ? nonEmptyErrors : undefined,
      testResults
    );
  };

  const allCriteriaChecked = validationCriteria.every(criterion => 
    validationResults[criterion] !== undefined
  );

  const allCriteriaPassed = validationCriteria.every(criterion => 
    validationResults[criterion] === true
  );
  
  const testingRequirementsMet = testingComplete && 
                                 testResults.testsPassing > 0 && 
                                 testResults.testsFailing === 0 &&
                                 testResults.coveragePercentage >= 75;
                                 
  const allRequirementsMet = allCriteriaPassed && testingRequirementsMet;

  return (
    <div className="task-validation-modal">
      <div className="modal-overlay" onClick={onCancel}></div>
      <div className="modal-content task-validation-content">
        <div className="task-validation-header">
          <h3>Task Validation</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="task-info">
          <h4>{taskName}</h4>
          <p className="task-description">{taskDescription}</p>
        </div>

        <div className="testing-section">
          <div className="testing-section-header">
            <h5>🧪 Mandatory Testing Requirements</h5>
            <button 
              className="toggle-testing"
              onClick={() => setShowTestingSection(!showTestingSection)}
            >
              {showTestingSection ? 'Hide' : 'Show'} Testing
            </button>
          </div>
          
          {showTestingSection && (
            <TestingValidation 
              taskName={taskName}
              taskDescription={taskDescription}
              onTestingComplete={handleTestingComplete}
            />
          )}
        </div>

        <div className="validation-section">
          <h5>Validation Criteria</h5>
          <p className="validation-instructions">
            Please verify that each criterion has been met:
          </p>
          
          <div className="criteria-list">
            {validationCriteria.map((criterion, index) => (
              <div key={index} className="criterion-item">
                <div className="criterion-text">{criterion}</div>
                <div className="criterion-controls">
                  <label className="criterion-option">
                    <input
                      type="radio"
                      name={`criterion-${index}`}
                      value="pass"
                      onChange={() => handleCriterionChange(criterion, true)}
                    />
                    <span className="checkmark pass">✓ Pass</span>
                  </label>
                  <label className="criterion-option">
                    <input
                      type="radio"
                      name={`criterion-${index}`}
                      value="fail"
                      onChange={() => handleCriterionChange(criterion, false)}
                    />
                    <span className="checkmark fail">✗ Fail</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="error-section">
          <div className="error-section-header">
            <h5>Error Tracking</h5>
            <button 
              className="toggle-errors"
              onClick={() => setShowErrorSection(!showErrorSection)}
            >
              {showErrorSection ? 'Hide' : 'Report'} Errors
            </button>
          </div>
          
          {showErrorSection && (
            <div className="error-inputs">
              <p className="error-instructions">
                Report any errors encountered during task execution:
              </p>
              
              {encounteredErrors.map((error, index) => (
                <div key={index} className="error-input-group">
                    <textarea
                      placeholder="Describe the error, including error message and context..."
                      value={error}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleErrorChange(index, e.target.value)}
                      rows={3}
                    />
                  {encounteredErrors.length > 1 && (
                    <button 
                      className="remove-error"
                      onClick={() => removeErrorField(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                className="add-error"
                onClick={addErrorField}
                type="button"
              >
                + Add Another Error
              </button>
            </div>
          )}
        </div>

        <div className="feedback-section">
          <h5>Additional Feedback</h5>
          <textarea
            placeholder="Any additional comments, suggestions, or observations about this task..."
            value={userFeedback}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserFeedback(e.target.value)}
            rows={3}
          />
        </div>

        <div className="validation-summary">
          {allCriteriaChecked && (
            <div className="summary-container">
              <div className={`summary-status ${allCriteriaPassed ? 'success' : 'warning'}`}>
                {allCriteriaPassed 
                  ? '✓ All validation criteria passed' 
                  : '⚠ Some validation criteria failed'
                }
              </div>
              
              <div className={`summary-status ${testingRequirementsMet ? 'success' : 'warning'}`}>
                {testingRequirementsMet 
                  ? '✅ Testing requirements met'
                  : '❌ Testing requirements not met'
                }
              </div>
              
              {testingComplete && (
                <div className="testing-summary">
                  <h6>Testing Summary:</h6>
                  <p>Tests: {testResults.testsPassing}/{testResults.testsWritten} passing</p>
                  <p>Coverage: {testResults.coveragePercentage}%</p>
                  <p>Framework: {testResults.framework}</p>
                  <p>Quality: {testResults.qualityScore}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="validation-actions">
          <button 
            className="cancel-validation"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="submit-validation"
            onClick={handleSubmit}
            disabled={!allCriteriaChecked || !testingComplete}
          >
            {allRequirementsMet ? 'All Requirements Met - Continue' : 'Requirements Not Met - Report Issues'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskValidation;
