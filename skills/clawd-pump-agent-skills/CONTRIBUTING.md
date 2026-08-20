# Contributing to ClawPump Community Skills

Thanks for contributing! Here's how to add your skill to the registry.

## Steps

### 1. Create your skill directory

Pick a URL-safe slug (lowercase, hyphens only):

```bash
mkdir skills/my-cool-skill
```

### 2. Write your SKILL.md

This is the content that gets injected into the agent's system prompt. Write it as instructions for an AI agent.

```markdown
# My Cool Skill

You are an expert at [specific task].

## Rules
- Rule 1
- Rule 2

## How to [task]
1. Step one
2. Step two
```

**Guidelines:**
- Be specific and actionable — the agent will follow these literally
- Use `##` headings to organize sections
- Include examples when possible
- Don't include sensitive data or API keys
- Keep it under 2000 words for optimal performance

### 3. Add metadata.json

```json
{
  "name": "My Cool Skill",
  "description": "One sentence describing what this skill does",
  "author": "your-github-username",
  "tags": ["relevant", "tags"],
  "version": "1.0.0"
}
```

**Tags** — use existing tags when possible:
`defi`, `trading`, `analysis`, `social`, `portfolio`, `risk`, `meme`, `nft`, `governance`, `utility`

### 4. Add to registry.json

Add your skill entry to the `skills` array in `registry.json`:

```json
{
  "slug": "my-cool-skill",
  "name": "My Cool Skill",
  "description": "One sentence describing what this skill does",
  "author": "your-github-username",
  "tags": ["relevant", "tags"],
  "path": "skills/my-cool-skill"
}
```

### 5. Open a PR

- Title: `Add skill: My Cool Skill`
- Include a brief description of what the skill does
- One skill per PR

## Review Criteria

PRs are reviewed for:
- **Quality**: Clear, well-structured instructions
- **Safety**: No harmful, malicious, or deceptive content
- **Originality**: Not a duplicate of an existing skill
- **Completeness**: Has both `SKILL.md` and `metadata.json`

## Updating an Existing Skill

To update a skill you authored:
1. Edit the `SKILL.md` and/or `metadata.json`
2. Bump the `version` in `metadata.json`
3. Update the entry in `registry.json` if name/description changed
4. Open a PR
