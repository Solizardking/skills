# ClawPump Community Skills

Open-source skill repository for [ClawPump](https://clawpump.com) AI agents. Anyone can contribute skills that get listed in the **Community Skills** section of the ClawPump dashboard.

## What is a Skill?

A skill is a markdown file (`SKILL.md`) that gets injected into your agent's system prompt. It defines instructions, rules, and context that shape how the agent behaves for a specific task — like analyzing meme tokens, managing risk, or running a trading strategy.

## Repository Structure

```
skills/
  your-skill-slug/
    SKILL.md          # The skill content (injected into agent prompt)
    metadata.json     # Name, description, author, tags
registry.json         # Auto-generated index of all skills
```

## Contributing a Skill

1. Fork this repo
2. Create a new directory under `skills/` with a URL-safe slug
3. Add your `SKILL.md` and `metadata.json`
4. Add an entry to `registry.json`
5. Open a PR

### metadata.json format

```json
{
  "name": "Your Skill Name",
  "description": "One-line description of what it does",
  "author": "your-github-username",
  "tags": ["defi", "trading"],
  "version": "1.0.0"
}
```

### SKILL.md tips

- Use clear markdown headings to organize instructions
- Define explicit rules and constraints
- Include examples of expected behavior
- Keep it focused — one skill, one purpose

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

## Using Community Skills

In the ClawPump dashboard, go to **Skills** and scroll to **Community Skills**. Browse, preview, and import any skill with one click. Imported skills become custom skills on your agent that you can edit or disable at any time.

## License

MIT
