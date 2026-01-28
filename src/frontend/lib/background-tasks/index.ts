// Components
export { TaskBadge, TasksDropdownSection, TaskStatusBadge } from "./components";

// Task store hooks
export { useActiveTaskCount, useBackgroundTasks, useTaskStartedAt } from "./hooks";

// Task store
export {
  addTask,
  type BackgroundTask,
  type BackgroundTaskMetadata,
  type BackgroundTaskStatus,
  type BackgroundTaskType,
  clearCompletedTasks,
  getAllTasks,
  getTask,
  removeTask,
  updateTask,
  useTaskStore,
} from "./task-store";
