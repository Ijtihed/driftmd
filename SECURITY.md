# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in driftmd, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainer directly or use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) feature on this repository.

Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

You should receive a response within 72 hours. We'll work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

driftmd is a static analysis tool that reads files from disk. It does not execute user code, make network requests during analysis, or require elevated permissions. The web package (`@driftmd/web`) does clone repositories via `simple-git` - vulnerabilities in that surface area are in scope.
