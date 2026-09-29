/**
 * MITRE ATT&CK Mapping & Rule Mapper
 * Maps forensic events to specific adversary Tactics & Techniques
 */

const RULES = [
  // ── Initial Access ──
  {
    pattern: /failed\s+password|authentication\s+failure|login\s+failed|invalid\s+user|logon\s+failure|incorrect\s+password|event\s*id\s*:\s*4625|event_id=4625|brute\s*force|credential\s+stuffing/i,
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    tactic: 'Credential Access'
  },
  {
    pattern: /accepted\s+password|session\s+opened|successful\s+logon|login\s+successful|event\s*id\s*:\s*4624|event_id=4624/i,
    techniqueId: 'T1078',
    techniqueName: 'Valid Accounts',
    tactic: 'Initial Access'
  },

  // ── Execution ──
  {
    pattern: /\/bin\/bash|\/bin\/sh|powershell\.exe|cmd\.exe|command.*interpreter|script.*execution/i,
    techniqueId: 'T1059',
    techniqueName: 'Command and Scripting Interpreter',
    tactic: 'Execution'
  },
  {
    pattern: /started\s+.*\.service|systemctl\s+start|service\s+.*started|unknown\s+service|systemd.*started/i,
    techniqueId: 'T1569',
    techniqueName: 'System Services',
    tactic: 'Execution'
  },

  // ── Persistence ──
  {
    pattern: /cron\s*job|crontab|scheduled\s+task|\/5\s+\*\s+\*|persistence.*cron|beacon/i,
    techniqueId: 'T1053',
    techniqueName: 'Scheduled Task/Job',
    tactic: 'Persistence'
  },
  {
    pattern: /rc\.local|autorun|boot\s+persistence|startup\s+script|init\.d|systemd.*enable/i,
    techniqueId: 'T1547',
    techniqueName: 'Boot or Logon Autostart Execution',
    tactic: 'Persistence'
  },
  {
    pattern: /useradd|adduser|backdoor.*admin|hidden.*account|new\s+user.*created/i,
    techniqueId: 'T1136',
    techniqueName: 'Create Account',
    tactic: 'Persistence'
  },

  // ── Privilege Escalation ──
  {
    pattern: /sudo\s+|su\s+-\s+|privilege\s+escalation|root\s+login|run\s+as\s+admin|elevated\s+privileges|\/etc\/shadow/i,
    techniqueId: 'T1548',
    techniqueName: 'Abuse Elevation Control Mechanism',
    tactic: 'Privilege Escalation'
  },

  // ── Defense Evasion ──
  {
    pattern: /log\s*(clear|truncat|delet|wipe|tamper)|anti[- ]forensic|bash_history\s+(clear|delet)|indicator\s+removal/i,
    techniqueId: 'T1070',
    techniqueName: 'Indicator Removal',
    tactic: 'Defense Evasion'
  },
  {
    pattern: /timestomp|modified\s+timestamp\s+changed|time\s+manipulation|touch\s+-t/i,
    techniqueId: 'T1070.006',
    techniqueName: 'Timestomp',
    tactic: 'Defense Evasion'
  },
  {
    pattern: /trojan|masquerad|disguise|modified.*binary|checksum\s+mismatch.*baseline/i,
    techniqueId: 'T1036',
    techniqueName: 'Masquerading',
    tactic: 'Defense Evasion'
  },

  // ── Discovery ──
  {
    pattern: /whoami|id\s+|cat\s+\/etc\/passwd|uname\s+-a|sysinfo|hostname/i,
    techniqueId: 'T1033',
    techniqueName: 'System Owner/User Discovery',
    tactic: 'Discovery'
  },
  {
    pattern: /nmap|port\s*scan|masscan|netstat|ifconfig|ipconfig|ping\s+|DPT=|SMB.*scan|RDP.*scan|WinRM.*scan|network.*reconnaissance/i,
    techniqueId: 'T1046',
    techniqueName: 'Network Service Discovery',
    tactic: 'Discovery'
  },

  // ── Lateral Movement ──
  {
    pattern: /lateral\s+movement|remote\s+desktop|rdp\s+session|psexec|ssh.*secondary|ssh.*lateral/i,
    techniqueId: 'T1021',
    techniqueName: 'Remote Services',
    tactic: 'Lateral Movement'
  },

  // ── Collection ──
  {
    pattern: /file\s+access.*database|unauthorized.*database|credit_card|users_pii|data\s+from\s+local|sensitive.*file\s+access/i,
    techniqueId: 'T1005',
    techniqueName: 'Data from Local System',
    tactic: 'Collection'
  },

  // ── Command and Control ──
  {
    pattern: /wget\s+|curl\s+|scp\s+|sftp\s+|ftp\s+|download\s+file|curl\s+-O|ingress.*tool|payload.*download/i,
    techniqueId: 'T1105',
    techniqueName: 'Ingress Tool Transfer',
    tactic: 'Command and Control'
  },
  {
    pattern: /c2\s+beacon|command.*control|callback|beacon.*connection|reverse\s+shell|netcat|\/bin\/nc/i,
    techniqueId: 'T1071',
    techniqueName: 'Application Layer Protocol',
    tactic: 'Command and Control'
  },
  {
    pattern: /dns\s+tunnel|suspicious\s+domain|dns.*exfil|darkops|c2-relay/i,
    techniqueId: 'T1071.004',
    techniqueName: 'DNS Tunneling',
    tactic: 'Command and Control'
  },

  // ── Exfiltration ──
  {
    pattern: /exfiltrat|large\s+data\s+transfer|upload.*MB|upload.*GB|data\s+transfer.*TLS/i,
    techniqueId: 'T1041',
    techniqueName: 'Exfiltration Over C2 Channel',
    tactic: 'Exfiltration'
  },

  // ── Impact ──
  {
    pattern: /ransomware|\.locked|encrypt.*files|ransom\s+note|DECRYPT_FILES|mass\s+file\s+rename/i,
    techniqueId: 'T1486',
    techniqueName: 'Data Encrypted for Impact',
    tactic: 'Impact'
  },
  {
    pattern: /filesystem\s+corruption|wipe|destroy|disk.*encrypt|boot\s+volume.*encrypt/i,
    techniqueId: 'T1561',
    techniqueName: 'Disk Wipe',
    tactic: 'Impact'
  },

  // ── Malware ──
  {
    pattern: /malware|virus|trojan|payload\s+activated|backdoor\.elf|hidden_svc|malicious.*execut/i,
    techniqueId: 'T1204',
    techniqueName: 'User Execution: Malicious File',
    tactic: 'Execution'
  },
]

/**
 * Maps standard log content to MITRE ATT&CK technique details
 */
export function mapLogToAttack(logText) {
  if (!logText) return null

  for (const rule of RULES) {
    if (rule.pattern.test(logText)) {
      return {
        techniqueId: rule.techniqueId,
        techniqueName: rule.techniqueName,
        tactic: rule.tactic
      }
    }
  }

  return null
}
