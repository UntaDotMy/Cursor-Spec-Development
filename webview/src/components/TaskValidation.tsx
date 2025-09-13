import React, { useState } from 'react';

interface TaskValidationProps {
  taskName: string;
  taskDescription: string;
  validationCriteria: string[];
  onValidationComplete: (validated: boolean, feedback?: string, errors?: string[]) => void;
  onCancel: () => void;
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

  const handleSubmit = () => {
    const allCriteriaMet = validationCriteria.every(criterion => 
      validationResults[criterion] === true
    );
    
    const nonEmptyErrors = encounteredErrors.filter(error => error.trim() !== '');
    
    onValidationComplete(
      allCriteriaMet,
      userFeedback.trim() || undefined,
      nonEmptyErrors.length > 0 ? nonEmptyErrors : undefined
    );
  };

  const allCriteriaChecked = validationCriteria.every(criterion => 
    validationResults[criterion] !== undefined
  );

  const allCriteriaPassed = validationCriteria.every(criterion => 
    validationResults[criterion] === true
  );

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
            <div className={`summary-status ${allCriteriaPassed ? 'success' : 'warning'}`}>
              {allCriteriaPassed 
                ? '✓ All validation criteria passed' 
                : '⚠ Some validation criteria failed'
              }
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
            disabled={!allCriteriaChecked}
          >
            {allCriteriaPassed ? 'Confirm & Continue' : 'Report Issues & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskValidation;
