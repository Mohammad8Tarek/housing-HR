#!/usr/bin/env node
/**
 * Sunrise AI Engineering - Pre-Tool Safety Hook
 * Inspects commands before execution to prevent accidental data destruction.
 * Enforces Zero Data Loss and production safety rules.
 * Adheres strictly to the Antigravity PreToolUse Contract: { "decision": "allow" | "deny", "reason": "..." }
 */

import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    let payload = {};
    if (inputData.trim()) {
      payload = JSON.parse(inputData);
    }

    const command = payload?.toolCall?.args?.CommandLine || payload?.command || '';
    
    // Dangerous destructive patterns that violate Rule 1 (Zero Data Loss)
    const destructivePatterns = [
      /\bdrop\s+database\b/i,
      /\brm\s+-rf\s+[\/\\]/i,
      /\bformat\s+[c-z]:/i,
      /\btruncate\s+table\b/i
    ];

    for (const pattern of destructivePatterns) {
      if (pattern.test(command)) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: `Execution blocked: Destructive command pattern detected (${pattern}). Zero Data Loss policy is strictly enforced.`
        }));
        process.exit(0);
      }
    }

    // Command is safe, allow execution
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  } catch (err) {
    // If parse error or unexpected, default to allow
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
});
