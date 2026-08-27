# Security Policy

## Supported versions

Security fixes are provided for the current 2.x release line. AiEditor 1.x and earlier releases are no longer maintained by this repository.

| Version | Supported |
| --- | --- |
| 2.x | Yes |
| < 2.0 | No |

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue or discussion. Use GitHub's private vulnerability reporting page:

https://github.com/aieditor-team/aieditor/security/advisories/new

Include the affected version, impact, reproduction steps, and any suggested mitigation. Remove API keys, access tokens, private documents, and personal data from the report.

If private vulnerability reporting is unavailable, ask a repository maintainer for a private reporting channel without including vulnerability details in the public request.

## Scope

Reports about HTML or Markdown sanitization, pasted content, uploads, links, AI provider configuration, and dependency supply-chain risks are in scope. API keys must be protected by the host application; production applications should normally call AI providers through a server-side proxy rather than exposing credentials in browser code.
