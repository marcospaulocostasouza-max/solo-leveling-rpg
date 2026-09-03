"use strict";
function approvalSummary(workflow, stage) { const gate = workflow.tasks.find(t => t.type === "approval" && t.parameters.stage === stage); return { workflow_id: workflow.workflow_id, stage, risk: workflow.risk, tasks_authorized: gate ? workflow.tasks.filter(t => t.depends_on.includes(gate.id)).map(t => t.id) : [], critical_included: false }; }
module.exports = { approvalSummary };
