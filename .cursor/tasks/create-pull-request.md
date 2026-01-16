# Create Pull Request

Create a pull request description using the `.github/pull_request_template.md` template.

## Instructions

1. Read the `.github/pull_request_template.md` file to get the template structure

2. **Always compare the current branch to `origin/main`** - use `git diff origin/main...HEAD` and `git log origin/main..HEAD` to analyze changes

3. Analyze the git changes (use `git diff --stat origin/main...HEAD` to understand what files changed)

4. Look at commit messages in the branch (use `git log --oneline origin/main..HEAD`) to understand the context

5. Generate a pull request description that:
   - Follows the template structure exactly

   - Includes a meaningful description based on the changes

   - References the issue number if mentioned in commit messages or branch name

   - Fills out relevant sections based on the changes made

   - Does NOT include file counts or "Files Changed" statistics

   - Does NOT explicitly list localization keys/files unless it's a major localization refactor

   - Does NOT include a "Technical Changes" section for feature PRs - focus on user-facing features and functionality. However, for refactoring PRs with minimal user-facing changes, technical changes are appropriate to describe what was refactored and why

6. **Output the result as a markdown code block** that can be easily copied, using this format:

```markdown
[the complete PR description here]
```

## Example Output Format

The output should be a single markdown code block containing the filled-out template, ready to be copied into a GitHub pull request.

## Notes

- **Always compare against `origin/main`** - never use uncommitted changes or compare to other branches

- Always use the exact template structure from `.github/pull_request_template.md`

- Base the description on actual code changes between the current branch and `origin/main`, not assumptions

- If no issue number is found, leave it as `resolves #` for the user to fill in

- Be descriptive about what changed and why, based on the actual diff from `origin/main`

- **Do NOT include a "Files Changed" section** or file count statistics in the PR description

- **Do NOT mention localization keys or translation files explicitly** unless it's a major refactor of the localization system itself. For regular feature additions, just mention that translations were added/updated without listing specific keys or files

- **Do NOT include a "Technical Changes" section for feature PRs** - focus on what the feature does for users, not implementation details. However, for refactoring PRs with minimal user-facing changes, technical changes are appropriate to describe what was refactored and why
