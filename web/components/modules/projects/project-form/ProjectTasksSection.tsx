'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Calendar, CheckSquare, Square, User } from 'lucide-react';
import { DateInput } from '@/components/shared/DateInput';
import { PJ_BTN_PRIMARY, PJ_CELL_INPUT_CLS } from '@/components/modules/projects/project-form/project-form-styles';
import type { ProjectTask } from '@/components/modules/projects/project-form/project-form-types';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { mapApiEmployeeRow } from '@/lib/services/entity-api-mappers';
import { listEmployees } from '@/lib/services/hrm-service';
import type { AppState } from '@/lib/state/types';

function workerOptions(appState: AppState, apiRows: Record<string, unknown>[]) {
  const fromState = listEmployees(appState);
  const rows = fromState.length > 0 ? fromState : apiRows;
  return rows
    .filter((e) => String(e.status ?? 'active').toLowerCase() === 'active')
    .map((e) => ({
      id: String(e.id),
      name: String(e.name ?? 'Employee'),
    }));
}

export function ProjectTasksSection({
  tasks: tasksProp,
  appState,
  onChange,
}: {
  tasks: ProjectTask[];
  appState: AppState;
  onChange: (tasks: ProjectTask[]) => void;
}) {
  const tasks = Array.isArray(tasksProp) ? tasksProp : [];
  const apiMode = isModuleApiMode('employees');
  const employeesStore = useApiResourceStore('employees', mapApiEmployeeRow, { pageOnly: true, lookupLimit: 200 });
  const workers = useMemo(
    () => workerOptions(appState, apiMode ? employeesStore.rows : []),
    [appState, apiMode, employeesStore.rows],
  );

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskWorkerId, setNewTaskWorkerId] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [error, setError] = useState('');

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) {
      setError('Enter a task description');
      return;
    }
    const worker = workers.find((w) => w.id === newTaskWorkerId);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      deadline: newTaskDeadline || undefined,
      completed: false,
      assignedWorkerId: newTaskWorkerId || undefined,
      assignedWorkerName: worker ? worker.name : undefined,
    };
    onChange([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskDeadline('');
    setNewTaskWorkerId('');
    setError('');
  };

  const removeTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const toggleTask = (id: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
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

        <div className="flex flex-col gap-1.5">
        <div
          className="flex flex-col md:flex-row gap-2 items-stretch md:items-center"
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        >
          <input
            type="text"
            placeholder="New task description..."
            className={`${PJ_CELL_INPUT_CLS} flex-1`}
            value={newTaskText}
            onChange={(e) => {
              setNewTaskText(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                addTask();
              }
            }}
          />
          <select
            value={newTaskWorkerId}
            onChange={(e) => setNewTaskWorkerId(e.target.value)}
            className={`${PJ_CELL_INPUT_CLS} w-full md:w-48`}
          >
            <option value="">Assign Worker (Optional)</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="w-full md:w-40">
            <DateInput
              value={newTaskDeadline}
              onChange={setNewTaskDeadline}
              placeholder="dd/mm/yyyy"
              className={PJ_CELL_INPUT_CLS}
              aria-label="Task deadline"
            />
          </div>
          <button
            type="button"
            onClick={addTask}
            className={`${PJ_BTN_PRIMARY} !px-3 !py-2 h-9 shrink-0 justify-center`}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {error ? <p className="text-[10px] font-semibold text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
