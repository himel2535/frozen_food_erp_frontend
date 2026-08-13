'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar, CheckSquare, Square, User } from 'lucide-react';
import { PJ_INPUT_CLS, PJ_ADD_ITEM_BTN_CLS } from '@/components/modules/projects/project-form/project-form-styles';
import type { ProjectFormValues, ProjectTask } from '@/components/modules/projects/project-form/project-form-types';
import { listEmployees } from '@/lib/services/hrm-service';
import type { AppState } from '@/lib/state/types';

export function ProjectTasksSection({
  form,
  appState,
  onChange,
}: {
  form: ProjectFormValues;
  appState: AppState;
  onChange: (patch: Partial<ProjectFormValues>) => void;
}) {
  const tasks = form.tasks || [];
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskWorkerId, setNewTaskWorkerId] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const workers = listEmployees(appState)
    .filter((e) => String(e.status ?? 'active').toLowerCase() === 'active')
    .map((e) => ({
      id: String(e.id),
      name: String(e.name ?? 'Employee'),
    }));

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const worker = workers.find((w) => w.id === newTaskWorkerId);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newTaskText.trim(),
      deadline: newTaskDeadline || undefined,
      completed: false,
      assignedWorkerId: newTaskWorkerId || undefined,
      assignedWorkerName: worker ? worker.name : undefined,
    };
    onChange({ tasks: [...tasks, newTask] });
    setNewTaskText('');
    setNewTaskDeadline('');
    setNewTaskWorkerId('');
  };

  const removeTask = (id: string) => {
    onChange({ tasks: tasks.filter((t) => t.id !== id) });
  };

  const toggleTask = (id: string) => {
    onChange({
      tasks: tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${
                task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 focus:outline-none transition-colors ${
                    task.completed ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                  }`}
                >
                  {task.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {task.text}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[10px] font-semibold text-slate-500">
                    {task.assignedWorkerName && (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded">
                        <User className="w-3 h-3" />
                        {task.assignedWorkerName}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Deadline: {task.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-xs font-medium text-slate-500">No tasks added yet.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        <input
          type="text"
          placeholder="New task description..."
          className={`${PJ_INPUT_CLS} flex-1`}
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTask();
            }
          }}
        />
        <select
          value={newTaskWorkerId}
          onChange={(e) => setNewTaskWorkerId(e.target.value)}
          className={`${PJ_INPUT_CLS} w-full md:w-48`}
        >
          <option value="">Assign Worker (Optional)</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={`${PJ_INPUT_CLS} w-full md:w-40`}
          value={newTaskDeadline}
          onChange={(e) => setNewTaskDeadline(e.target.value)}
        />
        <button
          type="button"
          onClick={addTask}
          disabled={!newTaskText.trim()}
          className={`${PJ_ADD_ITEM_BTN_CLS} self-stretch md:self-auto disabled:opacity-50 disabled:cursor-not-allowed h-9 !mt-0`}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}
