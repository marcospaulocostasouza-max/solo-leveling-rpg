"use strict";
class LocalDeploymentAdapter { constructor(options) { Object.assign(this, options); } async deploy(task) { const commit = await this.git.merge(task.branch, task.mainBranch); return { commit, environment: "local", strategy: "git-no-ff" }; } async rollback(deployment) { const commit = await this.git.revertMerged(deployment.merge_commit, deployment.main_branch); return { commit, strategy: "git-revert" }; } }
module.exports = { LocalDeploymentAdapter };
