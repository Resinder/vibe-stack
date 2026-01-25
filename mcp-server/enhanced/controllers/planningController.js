/**
 * ============================================================================
 * VIBE STACK - Planning Controller
 * ============================================================================
 * Handles planning-related MCP tool calls with validation and error handling
 * @version 2.0.0
 * ============================================================================
 */

import { Validator } from '../middleware/validation.js';
import { ErrorHandler, PlanningError } from '../middleware/errorHandler.js';

/**
 * Planning Controller - Planning operations
 * @class PlanningController
 * @description Handles plan generation and goal analysis
 */
export class PlanningController {
  /** @type {BoardService} Board service instance */
  #boardService;

  /** @type {TaskPlanningService} Planning service instance */
  #planningService;

  /**
   * Create a new PlanningController
   * @param {BoardService} boardService - Board service instance
   * @param {TaskPlanningService} planningService - Planning service instance
   */
  constructor(boardService, planningService) {
    this.#boardService = boardService;
    this.#planningService = planningService;
  }

  /**
   * Generate an intelligent task plan from a goal
   * @param {Object} args - Arguments with goal, context, targetLane
   * @returns {Object} MCP tool response
   */
  generatePlan(args) {
    try {
      // Validate inputs
      const goal = Validator.validateGoal(args.goal);
      const context = Validator.validateContext(args.context);
      const targetLane = args.targetLane ? Validator.validateLane(args.targetLane) : 'backlog';

      // Generate plan
      const tasks = this.#planningService.generatePlan(goal, context);

      // Add tasks to board
      const created = [];
      for (const task of tasks) {
        task.lane = targetLane;
        this.#boardService.addTask(task);
        created.push(task);
      }

      const totalHours = created.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

      return {
        content: [{
          type: 'text',
          text: `🎯 Generated ${created.length} tasks for: "${goal}"\n\n` +
                `📊 Summary:\n` +
                `  • Total tasks: ${created.length}\n` +
                `  • Estimated hours: ${totalHours}\n` +
                `  • High priority: ${created.filter(t => t.priority === 'high').length}\n` +
                `  • Medium priority: ${created.filter(t => t.priority === 'medium').length}\n` +
                `  • Low priority: ${created.filter(t => t.priority === 'low').length}\n\n` +
                `📋 Tasks:\n` +
                created.map((t, i) =>
                  `  ${i + 1}. ${t.title} (${t.estimatedHours}h, ${t.priority})`
                ).join('\n') +
                `\n\n✨ View in Vibe Kanban: http://localhost:4000`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Analyze a goal to detect patterns
   * @param {Object} args - Arguments with goal
   * @returns {Object} MCP tool response
   */
  analyzeGoal(args) {
    try {
      // Validate input
      const goal = Validator.validateGoal(args.goal);

      const patterns = this.#planningService.analyzeGoal(goal);

      const detected = patterns.map(p => p.name).join(', ') || 'generic';

      return {
        content: [{
          type: 'text',
          text: `🔍 Goal Analysis: "${goal}"\n\n` +
                `Detected Patterns: ${detected}\n` +
                `Suggested Tasks: ${patterns.reduce((sum, p) => sum + p.pattern.tasks.length, 0) || 5}\n\n` +
                `Use 'vibe_generate_plan' to create the tasks.`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}
