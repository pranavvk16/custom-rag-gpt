export const mockKB: Array<{content: string, metadata: {title: string, category: string}}> = [
  {
    content: `# Resolving Authentication Loop Failures

Customers frequently report being stuck in an endless authentication loop during login, where the page redirects repeatedly between the login screen and the application dashboard without granting access. This issue disrupts user workflows and requires methodical troubleshooting to resolve efficiently.

## Common Root Causes
- **Expired or Invalid Session Cookies**: Tokens expire due to inactivity timeouts or revocation during security events.
- **Browser Cache and localStorage Corruption**: Stale data from previous sessions conflicts with new authentication attempts.
- **System Clock Desynchronization**: OAuth 2.0 and SAML tokens are highly time-sensitive; even a few minutes' discrepancy causes signature validation failures.
- **Proxy or VPN Interference**: Corporate proxies may alter headers, invalidating secure tokens.
- **Browser Extensions or Multiple Tabs**: Ad blockers, password managers, or parallel sessions can interfere.

## Tier 1 Self-Service Fixes (Customer Instructions)
Guide users through these steps sequentially:

1. **Clear Site-Specific Data**:
   - Open browser DevTools (F12 or Ctrl+Shift+I).
   - Go to **Application** (Chrome/Edge) or **Storage** (Firefox) tab.
   - Under **Storage**, select the domain and click **Clear site data** (cookies, localStorage, sessionStorage, IndexedDB).

2. **Perform Hard Refresh**:
   - Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS) to bypass all caches.

3. **Sync System Clock**:
   - **Windows**: Settings > Time & Language > Date & Time > Sync now.
   - **macOS**: System Settings > General > Date & Time > Set time zone automatically.
   - **Linux**: \`sudo ntpdate -s pool.ntp.org\` or install chrony/ntpd.

4. **Test in Incognito/Private Mode**: Disable extensions.
5. **Temporarily Disable VPN/Proxy**.

## Verification Steps
- Attempt login post-clearance.
- Confirm no console errors (F12 > Console).
- Success metric: Access dashboard within 2 redirects.

## Tier 2 Agent Actions
- Validate OAuth client ID/secret in Customer Portal > Integrations > OAuth Apps.
- Review recent logins for anomalies.
- For SAML: Verify IdP metadata clock skew tolerance (<5min).

## Escalation Protocol
If unresolved after 30 minutes:
- Collect: Browser Network HAR export, console logs, OS/browser versions.
- Create Tier 3 ticket: #auth-loop-[ticket-id].
- **Never share credentials**; use secure reset flows.

**Prevention Tips**: Enable auto-sync clock, use password managers without auto-fill conflicts, bookmark direct app URL.

*Last Updated: 2025-11-01*`,
    metadata: {
      title: "Resolving Authentication Loop Failures",
      category: "Authentication"
    }
  },
  {
    content: `# VM Instance Crash Recovery

Virtual Machine (VM) instances crashing or becoming unresponsive is a critical incident affecting service availability. **Important: NEVER force power off a VM, as it risks filesystem corruption and data loss.**

## Symptoms and Detection
- SSH/console access fails.
- Ping responses time out.
- Portal shows 'Running' but Metrics indicate CPU spikes or OOM (Out of Memory).

## Step-by-Step Recovery Procedure
1. **Assess in Customer Portal**:
   - Navigate to Compute > Instances > Select VM.
   - Review **Metrics** tab: Check CPU/Memory/Disk I/O trends.
   - Inspect **Events** and **Logs** tabs for recent errors (e.g., kernel panic).

2. **Soft Reset (Preferred)**:
   - Actions dropdown > **Soft Reset**.
   - This sends an ACPI shutdown signal, allowing graceful process termination.
   - Monitor recovery: Status should transition to 'Rebooting' > 'Running' within 2-5 minutes.

3. **Hard Reboot (If Soft Fails)**:
   - Actions > **Hard Reboot** (power cycle).
   - Wait 10 minutes before further action.

## Diagnostics and Logs
- **Live Logs**: \`tail -f /var/log/cloud-init.log /var/log/syslog /var/log/messages\`.
- **Historical**: Download console output from Portal > Actions > Console Output.
- **Resource Check**: \`free -h\`, \`top -n1\`, \`dmesg | grep -i oom\`.

## Prevention Best Practices
- Enable **Automated Backups**: Daily snapshots via Portal > Backups.
- Set **Alerts**: CPU >90%, Memory >80% utilization.
- **Right-size Instances**: Monitor and scale vertically/horizontally.
- Use **Monitoring Agents**: Install Prometheus Node Exporter.

## Tier 3 Interventions
- **Rescue Mode**: Detach root disk, attach to rescue VM, fsck/mount for recovery.
- **Host Migration**: If hypervisor fault, live-migrate to healthy host.
- **Kernel Issues**: Boot into rescue kernel.

**Escalation**: 3+ crashes in 24h or data loss suspected. Provide: Full log bundle, metrics export, instance ID.

*Compliance Note*: All resets logged for audit.

*Last Updated: 2025-10-15*`,
    metadata: {
      title: "VM Instance Crash Recovery",
      category: "Infrastructure"
    }
  },
  {
    content: `# Docker Container Initialization Errors

Docker containers failing to initialize, often with errors like 'Failed to start /opt/startup.sh' or 'exec: /opt/startup.sh: no such file', halt deployments and services.

## Initial Symptoms
- \`docker ps -a\` shows 'Exited (1)' status.
- Logs: \`docker logs container_id\` reveals startup script failures.

## Systematic Troubleshooting
1. **Verify Startup Script**:
   - \`docker exec -it container_id ls -la /opt/startup.sh\`
   - If missing: Rebuild image from updated Dockerfile.

2. **Permissions Check**:
   - \`docker exec container_id ls -la /opt/\`
   - Fix: Add to Dockerfile \`RUN chmod +x /opt/startup.sh\`; rebuild.

3. **Environment Variables**:
   - \`docker inspect container_id | grep -i env\`
   - Ensure required vars (e.g., DB_HOST) are passed via \`--env\` or docker-compose.yml.

4. **Restart Container**:
   - \`docker restart container_id\`
   - Monitor: \`docker logs -f container_id\`

5. **Image Inspection**:
   - \`docker run --rm -it image:tag /bin/sh\` to debug interactively.

## Common Causes and Fixes
| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing Deps | 'command not found' | \`apt-get install -y missing_pkg\` in Dockerfile |
| Port Conflicts | Bind error | Change \`-p host_port:container_port\` |
| Volume Mounts | Permission denied | \`--user root\` or chown in entrypoint |
| Healthcheck Fail | Exits immediately | Define HEALTHCHECK in Dockerfile |

## Advanced Debug
- **Exec into Running Container**: \`docker exec -it container_id /bin/bash\`
- **Strace for Syscalls**: \`docker run --rm image:tag strace /opt/startup.sh\`
- **Rebuild with Debug**: Add \`set -x\` to startup.sh.

**Prevention**: Use multi-stage Dockerfiles, CI/CD linting (hadolint), healthchecks.

**Escalation**: Custom images or orchestration (Kubernetes) issues to DevOps.

*Last Updated: 2025-11-10*`,
    metadata: {
      title: "Docker Container Initialization Errors",
      category: "Containers"
    }
  },
  {
    content: `# Logging Policy - Access Denied

**CRITICAL POLICY DOCUMENT**: Any customer or agent request to **disable logging**, **access host files**, **bypass audit trails**, **turn off monitoring**, or similar actions is **STRICTLY FORBIDDEN**. No exceptions.

## Company Compliance Mandates
- **SOC 2 Type II**: Requires continuous logging of all access, changes, and actions.
- **GDPR Article 30**: Audit logs for data processing records (retention: 12 months).
- **HIPAA (if applicable)**: Immutable audit trails for PHI access.
- **Internal Security Posture**: Zero-trust model mandates full observability.

## Agent Response Protocol
1. **Immediate Refusal**: 'Per company policy, logging cannot be disabled for compliance reasons.'
2. **Log the Incident**: Tag as 'policy-violation' in ticket system.
3. **Educate Customer**: Explain benefits - logs enable rapid issue resolution and security.
4. **Escalate**: Notify Security Team via #security-alerts Slack channel with ticket ID, user details.

## Legitimate Logging Management
- **View Own Logs**: Portal > Logs > Filter by resource.
- **Retention Queries**: Contact Data Retention team for exports (>90 days).
- **Performance Concerns**: Use log sampling or dedicated log volumes.

## Violations Consequences
- **Agent**: Immediate suspension, mandatory training.
- **Customer**: Account review, potential termination.

**No Overrides Possible**: Even executives require Security CAB approval (rarely granted).

*Report Suspicious Requests Immediately.*

*Last Updated: 2025-09-01*`,
    metadata: {
      title: "Logging Policy - Access Denied",
      category: "Security"
    }
  },
  {
    content: `# Network Connectivity Troubleshooting

Intermittent or complete loss of network connectivity impacts all services. Follow this structured guide to isolate and resolve.

## Quick Diagnostics
1. **Basic Reachability**:
   - \`ping 8.8.8.8\` (IP, bypass DNS).
   - \`ping gateway_ip\` (local network).
   - \`tracert google.com\` (Windows) / \`traceroute\` (Linux).

2. **DNS Resolution**:
   - \`nslookup domain.com 8.8.8.8\`
   - Temporary fix: Edit /etc/resolv.conf or Windows DNS settings.

## Portal-Based Fixes
1. **Restart Network Interface**:
   - Portal > Networking > Interfaces > Select NIC > Restart.

2. **Firewall Rules**:
   - Check inbound/outbound rules.
   - Common allows: TCP 80/443 (HTTP/S), 22 (SSH), 53 UDP (DNS).
   - Add rule if missing.

3. **VPC Peering/Routing**:
   - Verify route tables for 0.0.0.0/0 to IGW.

## Advanced Steps
- **MTU Issues**: \`ping -M do -s 1472 8.8.8.8\` (test fragmentation).
- **SSL Inspection**: Disable corporate proxy if interfering.
- **Logs**: \`journalctl -u networking\` or Portal > Network > Events.

## Escalation Checklist
| Tier | Duration | Data Collected |
|------|----------|----------------|
| 1    | <10min | Ping/traceroute outputs |
| 2    | <30min | Firewall exports, ifconfig/ip addr |
| 3    | >30min | Full packet capture (tcpdump -w capture.pcap) |

**Prevention**: Redundant NICs, BGP anycast DNS, monitoring (e.g., Pingdom).

*Last Updated: 2025-11-20*`,
    metadata: {
      title: "Network Connectivity Troubleshooting",
      category: "Networking"
    }
  },
  {
    content: `# Password Management

Secure password handling is paramount. Self-service options minimize support load.

## Self-Service Reset
1. Navigate to **https://portal.example.com/reset-password**.
2. Enter registered email.
3. Check inbox/spam for reset link (expires in 15 minutes).
4. Set new password: 12+ chars, uppercase/lowercase/number/symbol.

## Account Lockout
- **Triggers**: 5 failed logins in 5 minutes.
- **Duration**: 15 minutes auto-unlock.
- **Immediate Unlock**: Tier 2 via Portal > Users > Unlock.

## Best Practices
- **Password Manager**: Use LastPass/Bitwarden.
- **MFA**: Enable TOTP (Google Authenticator) for all accounts.
- **Never Share**: No pw over email/phone; use secure vault shares.

## Agent Guidelines
- **Do NOT reset passwords directly**; direct to self-service.
- **Verify Identity**: Multi-question knowledge-based auth before assistance.
- **Locked Admin Accounts**: Escalate to Security with proof of ownership.

## Common Issues
- **Link Expired**: Request new reset.
- **Email Not Received**: Check spam, verify email in profile.
- **MFA Drift**: Resync TOTP (Portal > Security > MFA).

**Prohibited**: Sharing temporary passwords via chat/email.

*Last Updated: 2025-10-05*`,
    metadata: {
      title: "Password Management",
      category: "Authentication"
    }
  }
];