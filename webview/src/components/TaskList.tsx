import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import TaskValidation from './TaskValidation';
import './TaskStyles.css';

interface TaskListProps {
  content: string;
  onChange: (content: string) => void;
  onTaskComplete?: (taskName: string) => void;
  activeTaskIndex?: number;
  onStartNextTask?: (nextIndex: number) => void;
  onTaskValidation?: (taskName: string, validated: boolean, feedback?: string, errors?: string[]) => void;
}

interface TaskInfo {
  line: string;
  isTask: boolean;
  taskName: string;
  checked: boolean;
  index: number;
  level: number;
  parentTask?: number;
  isMainTask: boolean;
  subtasks: number[];
  hasStartButton: boolean;
  isStarted: boolean;
  canStart: boolean;
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
  const [startedTasks, setStartedTasks] = useState<Set<number>>(new Set());
  const [currentlyRunningTask, setCurrentlyRunningTask] = useState<number | null>(null);
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

  // Enhanced task parsing with Kiro-style hierarchy
  const parseTasks = (): TaskInfo[] => {
    const lines = content.split('\n');
    const tasks: TaskInfo[] = [];
    
    lines.forEach((line: string, idx: number) => {
      const isTask = line.match(/^(\s*)- \[(.?)\] (.+)/);
      if (isTask) {
        const indentLevel = Math.floor(isTask[1].length / 2); // 2 spaces per level
        const checked = isTask[2] === 'x';
        const taskName = isTask[3];
        
        // Find parent task (previous task with lower indent level)
        let parentTask: number | undefined;
        for (let i = tasks.length - 1; i >= 0; i--) {
          if (tasks[i].level < indentLevel) {
            parentTask = tasks[i].index;
            break;
          }
        }
        
        const taskInfo: TaskInfo = {
          line,
          isTask: true,
          taskName,
          checked,
          index: idx,
          level: indentLevel,
          parentTask,
          isMainTask: indentLevel === 0,
          subtasks: [],
          hasStartButton: indentLevel === 0, // Only main tasks have start buttons
          isStarted: startedTasks.has(idx),
          canStart: true // Will be calculated below
        };
        
        tasks.push(taskInfo);
        
        // Update parent's subtasks array
        if (parentTask !== undefined) {
          const parent = tasks.find(t => t.index === parentTask);
          if (parent) {
            parent.subtasks.push(idx);
          }
        }
      } else {
        // Non-task lines
        tasks.push({
          line,
          isTask: false,
          taskName: '',
          checked: false,
          index: idx,
          level: 0,
          isMainTask: false,
          subtasks: [],
          hasStartButton: false,
          isStarted: false,
          canStart: false
        });
      }
    });
    
    // Calculate which tasks can start
    tasks.forEach(task => {
      if (task.isTask && task.isMainTask) {
        // Main task can start if not already completed and no other main task is running
        task.canStart = !task.checked && 
                       (currentlyRunningTask === null || currentlyRunningTask === task.index) &&
                       !tasks.some(t => t.isMainTask && t.isStarted && !t.checked && t.index !== task.index);
      }
    });
    
    return tasks;
  };

  const tasks = parseTasks();
  const firstIncomplete = tasks.findIndex((t: TaskInfo) => t.isTask && !t.checked);
  
  // Start a main task and its subtasks
  const startTask = async (taskIndex: number) => {
    const task = tasks[taskIndex];
    if (!task.isMainTask || !task.canStart) return;
    
    setStartedTasks(prev => new Set([...Array.from(prev), taskIndex]));
    setCurrentlyRunningTask(taskIndex);
    
    // Notify parent component about task start
    if (onTaskComplete) {
      onTaskComplete(`Started: ${task.taskName}`);
    }
  };
  
  // Stop a task (in case of error or user decision)
  const stopTask = (taskIndex: number) => {
    const task = tasks[taskIndex];
    if (!task.isMainTask) return;
    
    setStartedTasks(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(taskIndex);
      return newSet;
    });
    
    if (currentlyRunningTask === taskIndex) {
      setCurrentlyRunningTask(null);
    }
  };

  const toggleTask = (lineIndex: number) => {
    const task = tasks[lineIndex];
    if (!task.isTask) return;
    
    // Check if this task can be toggled
    if (task.isMainTask) {
      // Main task: can only be toggled if started and it's the currently running task
      if (!task.isStarted || currentlyRunningTask !== lineIndex) return;
    } else {
      // Subtask: can only be toggled if parent task is started and previous subtasks are complete
      const parentTask = tasks.find(t => t.index === task.parentTask);
      if (!parentTask?.isStarted) return;
      
      // Check if previous subtasks in the same parent are completed
      const siblingSubtasks = tasks.filter(t => t.parentTask === task.parentTask && t.index < lineIndex);
      if (siblingSubtasks.some(t => !t.checked)) return;
    }
    
    const taskName = task.taskName;
    const taskDescription = task.line.replace(/^\s*- \[ \] /, '');
    
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
      'Unit tests written and passing (MANDATORY)',
      'Minimum 100% test coverage achieved',
      'Code follows project standards and best practices',
      'No console errors or warnings',
      'All edge cases and error scenarios tested'
    ];

    // Add specific criteria based on task type
    if (taskDescription.toLowerCase().includes('setup') || taskDescription.toLowerCase().includes('install')) {
      criteria.push('Installation/setup tests verify functionality');
      criteria.push('Configuration tests ensure proper setup');
    }
    
    if (taskDescription.toLowerCase().includes('component') || taskDescription.toLowerCase().includes('ui')) {
      criteria.push('Component rendering tests pass');
      criteria.push('User interaction tests pass');
      criteria.push('Props and state changes tested');
    }
    
    if (taskDescription.toLowerCase().includes('api') || taskDescription.toLowerCase().includes('endpoint')) {
      criteria.push('API endpoint tests pass');
      criteria.push('Request/response validation tests pass');
      criteria.push('Error handling tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('database') || taskDescription.toLowerCase().includes('data')) {
      criteria.push('Database integration tests pass');
      criteria.push('Data validation tests pass');
      criteria.push('Migration/schema tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('auth') || taskDescription.toLowerCase().includes('security')) {
      criteria.push('Security tests pass');
      criteria.push('Authentication/authorization tests pass');
      criteria.push('Input validation tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('integration')) {
      criteria.push('Integration tests pass between components');
      criteria.push('System interaction tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('performance')) {
      criteria.push('Performance benchmarks meet requirements');
      criteria.push('Load testing passes');
      criteria.push('Memory usage tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('mobile')) {
      criteria.push('Device-specific tests pass');
      criteria.push('Platform compatibility tests pass');
      criteria.push('Touch/gesture interaction tests pass');
    }
    
    if (taskDescription.toLowerCase().includes('desktop')) {
      criteria.push('Desktop application tests pass');
      criteria.push('Platform-specific functionality tested');
      criteria.push('Window management tests pass');
    }

    return criteria;
  };

  const handleTaskValidation = (validated: boolean, feedback?: string, errors?: string[], testResults?: any) => {
    if (!validatingTask) return;
    
    const lines = content.split('\n');
    const taskIndex = tasks.findIndex((task: TaskInfo) => task.taskName === validatingTask.name);
    const task = tasks[taskIndex];
    
    if (taskIndex >= 0 && validated) {
      // Mark task as complete
      lines[taskIndex] = lines[taskIndex].replace('- [ ]', '- [x]');
      setCompletedTask(validatingTask.name);
      
      // Check if this was the last subtask of a main task
      if (task.isMainTask) {
        // Main task completed, stop the task
        stopTask(taskIndex);
        setShowNextPrompt(true);
      } else if (task.parentTask !== undefined) {
        // Subtask completed, check if all subtasks of parent are done
        const parentTask = tasks.find(t => t.index === task.parentTask);
        if (parentTask) {
          const allSubtasksComplete = tasks
            .filter(t => t.parentTask === task.parentTask)
            .every((t, idx) => {
              if (t.index === taskIndex) return true; // Current task will be marked complete
              return t.checked;
            });
          
          if (allSubtasksComplete) {
            // Complete parent task as well
            const parentLineIndex = parentTask.index;
            lines[parentLineIndex] = lines[parentLineIndex].replace('- [ ]', '- [x]');
            stopTask(parentLineIndex);
            setShowNextPrompt(true);
          }
        }
      }
      
      if (onTaskComplete) onTaskComplete(validatingTask.name);
      
      const newContent = lines.join('\n');
      onChange(newContent);
    } else if (!validated) {
      // Task failed validation - check if it's testing-related
      const testingIssues = [];
      if (testResults) {
        if (testResults.testsPassing === 0) {
          testingIssues.push('No tests are passing - tests must be written and executed');
        }
        if (testResults.testsFailing > 0) {
          testingIssues.push(`${testResults.testsFailing} test(s) failing - must be fixed`);
        }
        if (testResults.coveragePercentage < 75) {
          testingIssues.push(`Coverage ${testResults.coveragePercentage}% below minimum 75%`);
        }
      }
      
      const allErrors = [...(errors || []), ...testingIssues];
      
      if (onTaskValidation) {
        onTaskValidation(validatingTask.name, false, feedback, allErrors);
      }
      // Don't close dialog yet - let user see the errors and decide
      return;
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

  const TaskCheckbox = ({ checked, lineIndex, task }: { checked: boolean; lineIndex: number; task: TaskInfo }) => {
    const canToggle = task.isTask && (
      (task.isMainTask && task.isStarted && currentlyRunningTask === lineIndex) ||
      (!task.isMainTask && tasks.find(t => t.index === task.parentTask)?.isStarted &&
       tasks.filter(t => t.parentTask === task.parentTask && t.index < lineIndex).every(t => t.checked))
    );
    
    return (
      <input
        type="checkbox"
        checked={checked}
        disabled={!canToggle}
        onChange={() => toggleTask(lineIndex)}
        className={`task-checkbox ${canToggle ? 'active' : ''} ${task.isMainTask ? 'main-task' : 'subtask'}`}
      />
    );
  };
  
  const TaskStartButton = ({ task }: { task: TaskInfo }) => {
    if (!task.hasStartButton) return null;
    
    return (
      <button
        className={`task-start-button ${task.canStart ? 'can-start' : 'disabled'} ${task.isStarted ? 'started' : ''}`}
        disabled={!task.canStart}
        onClick={() => task.canStart && !task.isStarted ? startTask(task.index) : stopTask(task.index)}
      >
        {task.isStarted ? '⏹ Stop' : '▶ Start'}
      </button>
    );
  };

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
              const task = tasks[currentLineIndex - 1];
              const isActive = task?.isStarted || (task?.isMainTask && task?.canStart);
              
              return (
                <li className={`task-item ${isChecked ? 'completed' : ''} ${isActive ? 'active-task' : ''} ${task?.isMainTask ? 'main-task' : 'subtask'}`} {...props}>
                  <div className="task-controls">
                    <TaskStartButton task={task} />
                    <TaskCheckbox checked={isChecked} lineIndex={currentLineIndex - 1} task={task} />
                  </div>
                  <span className="task-content">{children}</span>
                  {task?.isMainTask && task?.isStarted && (
                    <span className="task-status running">Running...</span>
                  )}
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
