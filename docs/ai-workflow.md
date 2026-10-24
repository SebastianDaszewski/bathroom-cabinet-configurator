# Working with an AI agent

The project was built with Claude Code as a pair programmer. The agent wrote
most of the code; the decisions, the review and every commit were mine. This
page shows how the agent was kept under control.

## Guardrails

- **Global rules** (`~/.claude/CLAUDE.md`, not in this repo): commit messages,
  PR titles and branch names in English; ask before using the design plugin.
- **Project rules** — [`CLAUDE.md`](../CLAUDE.md): what to read first,
  architecture rules, commands to run before finishing, no code comments, the UI
  in Polish.
- **Permissions** — [`.claude/settings.json`](../.claude/settings.json): the
  agent may run the project scripts and read the git history, but `git commit`,
  `push`, `merge`, `rebase`, `reset --hard` and `gh pr merge` are denied.
- **Automated checks the agent cannot argue with** — strict TypeScript, oxlint
  with enforced layer boundaries, Prettier, `knip` (no unused code), coverage
  thresholds, Playwright, all in CI on every PR.

## The loop, per milestone

1. **Plan.** The agent proposes the files, the decisions and the open questions
   with a recommendation; nothing is written until I approve or change it.
2. **Implement with tests.** Tests are part of the change, not a follow-up.
3. **Check.** Lint, types, `knip`, unit tests with coverage, e2e when the UI
   changed — and a look at the running app (browser, Playwright screenshots on
   desktop and 375 px).
4. **Document.** Rules and data go to [`spec.md`](spec.md), structure to
   [`architecture.md`](architecture.md), the reasoning to the PR description,
   so the next session starts from the docs, not from memory.
5. **Review and commit — by me.** I read the diff, commit, open the PR, wait
   for CI and merge. One milestone per PR.

## Pull requests

| PR                                                                               | Scope                                                    |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [#1](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/1) | Domain: config schema, catalogue, rules                  |
| [#2](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/2) | Panel builder and cut list with CSV                      |
| [#3](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/3) | Cost-based pricing                                       |
| [#4](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/4) | 3D scene from panels                                     |
| [#5](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/5) | Polish stepper UI, store, URL sync                       |
| [#6](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/6) | Cut-outs, handles, openable drawers                      |
| [#7](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/7) | Countertop                                               |
| [#8](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/8) | Textures, grain, lighting                                |
| [#9](https://github.com/SebastianDaszewski/bathroom-cabinet-configurator/pull/9) | Summary, CSV, mobile, Playwright, option prices, inquiry |

## Where review changed the result

The agent is fast and confident; the review is where the product got right.

- **Construction.** The first model had an HDF back panel and a siphon cut-out
  that closed the drawer behind the pipe. Both are wrong for a vanity under a
  basin: the back stays open for the pipes, the drawer back gets a gap and the
  bottom stays whole with a tray in front of the gap. It took three iterations,
  each caught by looking at the 3D model, not by a test.
- **Missing scope.** Comparing the result with real products showed that a
  vanity for a countertop basin needs a full top panel, not two rails — added
  as its own milestone with thickening and extensions.
- **Look.** Outlined boxes read as CAD. Textures with grain direction, rounded
  edges and studio lighting replaced them; a thickened top that rendered as two
  loose boards was merged into one block.
- **Details found by using it.** Dimension numbers missing from the saved
  picture, drawers that should open on click, a reset button too close to
  "copy link" (now confirmed in a dialog), the mobile layout putting the 3D
  view below the form.
- **Performance found by a flaky test.** An e2e test timed out because the
  canvas rendered 60 frames per second while idle. The fix — render on demand,
  compute the shadow once — made every e2e test about five times faster and
  saves battery for real users.
