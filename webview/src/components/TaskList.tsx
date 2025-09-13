import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import TaskValidation from './TaskValidation';

interface TaskListProps {
  content: string;
  onChange: (content: string) => void;
  onTaskComplete?: (taskName: string) => void;
  activeTaskIndex?: number;
  onStartNextTask?: (nextIndex: number) => void;
  onTaskValidation?: (taskName: string, validated: boolean, feedback?: string, errors?: string[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  content, 
  onChange, 
  onTaskComplete, 
  activeTaskIndex, 
  onStartNextTask, 
  onTaskValidation 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [completedTask, setCompletedTask] = useState<string | null>(null);
  const [showTaskValidation, setShowTaskValidation] = useState(false);
  const [validatingTask, setValidatingTask] = useState<{name: string, description: string, criteria: string[]} | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Debounced auto-save
  useEffect(() => {
    if (isEditing) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onChange(editContent);
      }, 800);
    }
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [editContent, isEditing, onChange]);

  const handleSave = () => {
    onChange(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  // Parse tasks and enforce only one active
  const parseTasks = () => {
    const lines = content.split('\n');
    return lines.map((line: string, idx: number) => {
      const isTask = line.match(/^- \[.\] (.+)/);
      return {
        line,
        isTask: !!isTask,
        taskName: isTask ? isTask[1] : '',
        checked: line.includes('- [x]'),
        index: idx
      };
    });
  };

  const tasks = parseTasks();
  const firstIncomplete = tasks.findIndex((t: any) => t.isTask && !t.checked);

  const toggleTask = (lineIndex: number) => {
    if (lineIndex !== firstIncomplete) return; // Only allow the first incomplete task
    
    const taskName = tasks[lineIndex].taskName;
    const taskDescription = tasks[lineIndex].line.replace(/^- \[ \] /, '');
    
    // Show validation dialog instead of immediately completing
    setValidatingTask({
      name: taskName,
      description: taskDescription,
      criteria: getValidationCriteria(taskName, taskDescription)
    });
    setShowTaskValidation(true);
  };

  const getValidationCriteria = (taskName: string, taskDescription: string): string[] => {
    // Generate validation criteria based on task content
    const criteria = [
      'Task implementation is complete and functional',
      'All tests pass (if applicable)',
      'Code follows project standards and best practices',
      'No console errors or warnings'
    ];

    // Add specific criteria based on task type
    if (taskDescription.toLowerCase().includes('test')) {
      criteria.push('Test coverage is adequate (>80% if measurable)');
    }
    
    if (taskDescription.toLowerCase().includes('api') || taskDescription.toLowerCase().includes('endpoint')) {
      criteria.push('API endpoints respond correctly with proper status codes');
      criteria.push('Input validation and error handling implemented');
    }
    
    if (taskDescription.toLowerCase().includes('ui') || taskDescription.toLowerCase().includes('component')) {
      criteria.push('UI component renders correctly across different screen sizes');
      criteria.push('User interactions work as expected');
    }
    
    if (taskDescription.toLowerCase().includes('database') || taskDescription.toLowerCase().includes('data')) {
      criteria.push('Data operations work correctly');
      criteria.push('Database constraints and validations are enforced');
    }

    return criteria;
  };

  const handleTaskValidation = (validated: boolean, feedback?: string, errors?: string[]) => {
    if (!validatingTask) return;
    
    const lines = content.split('\n');
    const taskIndex = tasks.findIndex((task: any) => task.taskName === validatingTask.name);
    
    if (taskIndex >= 0 && validated) {
      // Mark task as complete
      lines[taskIndex] = lines[taskIndex].replace('- [ ]', '- [x]');
      setCompletedTask(validatingTask.name);
      setShowNextPrompt(true);
      if (onTaskComplete) onTaskComplete(validatingTask.name);
      
      const newContent = lines.join('\n');
      onChange(newContent);
    }
    
    // Report validation results
    if (onTaskValidation) {
      onTaskValidation(validatingTask.name, validated, feedback, errors);
    }
    
    // Close validation dialog
    setShowTaskValidation(false);
    setValidatingTask(null);
  };

  const cancelTaskValidation = () => {
    setShowTaskValidation(false);
    setValidatingTask(null);
  };

  const handleStartNext = () => {
    setShowNextPrompt(false);
    setCompletedTask(null);
    if (onStartNextTask && firstIncomplete + 1 < tasks.length) {
      onStartNextTask(firstIncomplete + 1);
    }
  };

  const TaskCheckbox = ({ checked, lineIndex }: { checked: boolean; lineIndex: number }) => (
    <input
      type="checkbox"
      checked={checked}
      disabled={lineIndex !== firstIncomplete}
      onChange={() => toggleTask(lineIndex)}
      className={lineIndex === firstIncomplete ? 'task-checkbox active' : 'task-checkbox'}
    />
  );

  const renderTaskContent = () => {
    const lines = content.split('\n');
    let currentLineIndex = 0;
    return (
      <ReactMarkdown
        components={{
          li: ({ node, className, children, ...props }: any) => {
            const lineContent = lines[currentLineIndex] || '';
            const isTask = lineContent.includes('- [ ]') || lineContent.includes('- [x]');
            const isChecked = lineContent.includes('- [x]');
            const isActive = currentLineIndex === firstIncomplete;
            currentLineIndex++;
            if (isTask) {
              return (
                <li className={`task-item ${isChecked ? 'completed' : ''} ${isActive ? 'active-task' : ''}`} {...props}>
                  <TaskCheckbox checked={isChecked} lineIndex={currentLineIndex - 1} />
                  <span className="task-content">{children}</span>
                </li>
              );
            }
            return <li className={className} {...props}>{children}</li>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="task-list">
      {showTaskValidation && validatingTask && (
        <TaskValidation
          taskName={validatingTask.name}
          taskDescription={validatingTask.description}
          validationCriteria={validatingTask.criteria}
          onValidationComplete={handleTaskValidation}
          onCancel={cancelTaskValidation}
        />
      )}
      
      {showNextPrompt && completedTask && (
        <div className="task-next-banner">
          <span>Task "{completedTask}" is complete. Should I start the next task?</span>
          <button onClick={handleStartNext}>Y</button>
          <button onClick={() => setShowNextPrompt(false)}>N</button>
        </div>
      )}
      
      <div className="editor-toolbar">
        {!isEditing ? (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : (
          <div className="edit-controls">
            <button 
              className="save-button"
              onClick={handleSave}
            >
              Save
            </button>
            <button 
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      <div className="task-content">
        {isEditing ? (
          <textarea
            className="task-textarea"
            value={editContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
            placeholder="Enter task list in markdown format..."
          />
        ) : (
          <div className="task-preview">
            {renderTaskContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
