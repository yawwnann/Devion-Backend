import { ToolDefinition } from '../chatbot.types';
import { getProjects } from './get-projects.tool';
import { getTodos } from './get-todos.tool';
import { getCalendarEvents } from './get-calendar.tool';
import { getGitHubStats } from './get-github.tool';

export { getProjects, getTodos, getCalendarEvents, getGitHubStats };

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'getProjects',
      description:
        'Get user projects with optional filtering by status. Use this when user asks about their projects, deadlines, or project status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description:
              'Filter projects by status: TODO, IN_PROGRESS, DONE, or all',
            enum: ['TODO', 'IN_PROGRESS', 'DONE', 'all'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of projects to return',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTodos',
      description:
        'Get user todos/tasks with optional filtering by status. Use this when user asks about their tasks, todos, or what they need to do.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description:
              'Filter todos by status: pending, in_progress, done, scheduled, or all',
            enum: ['pending', 'in_progress', 'done', 'scheduled', 'all'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of todos to return',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCalendarEvents',
      description:
        'Get user calendar events. Use this when user asks about their schedule, calendar, events, meetings, or upcoming deadlines.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of events to return',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGitHubStats',
      description:
        'Get user GitHub statistics including repositories, stars, commits, and language stats. Use this when user asks about their GitHub profile, repositories, or contributions.',
      parameters: {
        type: 'object',
        properties: {
          includeRepos: {
            type: 'boolean',
            description: 'Whether to include repository details',
          },
          includeCommits: {
            type: 'boolean',
            description: 'Whether to include recent commits',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of repositories to return',
          },
        },
        required: [],
      },
    },
  },
];
