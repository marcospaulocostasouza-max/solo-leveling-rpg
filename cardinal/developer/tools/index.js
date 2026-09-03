"use strict";
class DeveloperTools {
    constructor(parts) { Object.assign(this, parts); }
    search_code(query) { return this.search.search(query); }
    find_symbol(symbol) { return this.search.findSymbol(symbol); }
    read_source_file(file, start, lines) { return this.search.read(file, start, lines); }
    list_related_files(name) { return this.search.findFiles(name); }
    get_project_structure() { return this.projectMap.read(); }
    create_worktree(task) { return this.git.createIsolation(task); }
    edit_source_file(file, expected, replacement) { if (!this.editor) throw new Error("Edição exige worktree Cardinal isolado."); return this.editor.replace(file, expected, replacement); }
    create_source_file(file, content) { if (!this.editor) throw new Error("Criação exige worktree Cardinal isolado."); return this.editor.create(file, content); }
    rename_source_file(from, to) { if (!this.editor) throw new Error("Renomeação exige worktree Cardinal isolado."); return this.editor.rename(from, to); }
    run_tests(kind = "cardinal_test") { return this.runner.run(kind); }
    run_formatter() { throw new Error("Formatter não configurado no projeto."); }
    run_linter() { return this.runner.run("site_lint"); }
    run_typecheck() { return this.runner.run("site_build"); }
    run_build() { return this.runner.run("site_build"); }
    get_git_diff(worktree) { return this.git.diff(worktree); }
    get_git_status(worktree) { return this.git.status(worktree); }
    commit_changes(worktree, message) { return this.git.commit(worktree, message); }
}
module.exports = { DeveloperTools };
