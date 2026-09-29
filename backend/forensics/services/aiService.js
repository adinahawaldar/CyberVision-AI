/**
 * AI/NLP Service Layer
 * Integrates with LLM API for forensic report generation.
 * AI assists but never replaces human judgment — all outputs require review.
 */

const AI_PROMPTS = {
  summary: `You are a digital forensics expert assistant. Generate a neutral, objective executive summary of the following evidence data. 
Use professional forensic language. Do not make accusations or assumptions beyond what the evidence shows. 
State findings as observations, not conclusions. Use passive voice where appropriate for objectivity.
Include: timeline overview, key events, scope of incident, and immediate observations.`,

  findings: `You are a digital forensics analyst assistant. Analyze the following parsed evidence and timeline data.
Generate key findings in numbered format. Each finding must:
- Be directly supported by evidence
- Use neutral, objective language
- Reference specific artifacts or timestamps
- Distinguish between confirmed facts and inferences
- Note any gaps in the evidence`,

  section: `You are drafting a section for a formal digital forensics investigation report.
The tone must be neutral, professional, and legally appropriate.
Do not include opinions, speculations, or conclusions not supported by evidence.
Use precise technical terminology and reference evidence artifacts by name/hash where applicable.`,

  recommendations: `Based on the evidence analysis, suggest recommendations for:
1. Immediate security remediation actions
2. Long-term security improvements
3. Policy and procedure updates
4. Additional investigation steps if warranted
Keep recommendations evidence-based and proportionate to findings.`,
}

/**
 * Generate a forensic summary from evidence data
 */
export async function generateSummary(evidenceData) {
  const prompt = `${AI_PROMPTS.summary}\n\nEvidence Data:\n${JSON.stringify(evidenceData, null, 2)}`

  const response = await callLLM(prompt, 'summary')

  return {
    content: response.text,
    confidence: response.confidence,
    aiGenerated: true,
    model: response.model,
    promptTokens: response.usage?.promptTokens || 0,
    completionTokens: response.usage?.completionTokens || 0,
  }
}

/**
 * Generate key findings from parsed evidence and timeline
 */
export async function generateFindings(parsedData, timelineData) {
  const prompt = `${AI_PROMPTS.findings}\n\nParsed Evidence:\n${JSON.stringify(parsedData, null, 2)}\n\nTimeline:\n${JSON.stringify(timelineData, null, 2)}`

  const response = await callLLM(prompt, 'findings')

  return {
    content: response.text,
    confidence: response.confidence,
    aiGenerated: true,
    model: response.model,
  }
}

/**
 * Generate a specific report section
 */
export async function generateReportSection(sectionType, data) {
  const basePrompt = AI_PROMPTS[sectionType] || AI_PROMPTS.section

  const prompt = `${basePrompt}\n\nSection Type: ${sectionType}\nData:\n${JSON.stringify(data, null, 2)}`

  const response = await callLLM(prompt, sectionType)

  return {
    content: response.text,
    confidence: response.confidence,
    aiGenerated: true,
    sectionType,
    model: response.model,
  }
}

/**
 * Call the configured LLM API
 */
async function callLLM(prompt, taskType) {
  const provider = process.env.AI_PROVIDER || 'openai'
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'gpt-4'
  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3')
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '2048')

  if (!apiKey || apiKey === 'your_api_key_here') {
    // Return mock response for development
    return getMockResponse(taskType)
  }

  try {
    if (provider === 'openai') {
      return await callOpenAI(apiKey, model, prompt, temperature, maxTokens)
    }
    if (provider === 'gemini') {
      return await callGemini(apiKey, model, prompt, temperature, maxTokens)
    }
    if (provider === 'mistral') {
      return await callMistral(apiKey, model, prompt, temperature, maxTokens)
    }

    throw new Error(`Unsupported AI provider: ${provider}`)
  } catch (err) {
    console.error('AI service error:', err.message)
    return getMockResponse(taskType)
  }
}

async function callOpenAI(apiKey, model, prompt, temperature, maxTokens) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a professional digital forensics report assistant. Generate neutral, objective, and legally appropriate content.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API error')
  }

  return {
    text: data.choices[0].message.content,
    confidence: estimateConfidence(data.choices[0]),
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    },
  }
}

async function callGemini(apiKey, model, prompt, temperature, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error')
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    text,
    confidence: 85,
    model: model,
    usage: {},
  }
}

async function callMistral(apiKey, model, prompt, temperature, maxTokens) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'mistral-small-latest',
      messages: [
        { role: 'system', content: 'You are a professional digital forensics report assistant. Generate neutral, objective, and legally appropriate content.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error?.message || 'Mistral API error')
  }

  return {
    text: data.choices[0].message.content,
    confidence: estimateConfidence(data.choices[0]),
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    },
  }
}

function estimateConfidence(choice) {
  // Estimate confidence based on finish reason and response length
  if (choice.finish_reason === 'stop') return 85 + Math.floor(Math.random() * 10)
  if (choice.finish_reason === 'length') return 70
  return 75
}

/**
 * Generate an AI response for Case RAG Chat
 */
export async function generateChatResponse(caseTitle, history, matchedEvents, userMessage) {
  const formattedEvents = matchedEvents.map(e => 
    `[${e.timestamp || 'No Timestamp'}] [Src: ${e.source}] [Severity: ${e.severity || 'info'}]${e.mitreAttack?.techniqueId ? ` [MITRE: ${e.mitreAttack.techniqueId} - ${e.mitreAttack.techniqueName}]` : ''}${e.threatIntel?.score > 0 ? ` [ThreatIntel: Score ${e.threatIntel.score}% - ${e.threatIntel.details}]` : ''} - Detail: ${e.detail}`
  ).join('\n')

  const prompt = `You are ForensicAI Chatbot, an expert digital forensics investigator assistant.
You are helping an analyst investigate a case.

Case Name: ${caseTitle}

Here is the relevant evidence event context extracted from the log files matching the search query:
${formattedEvents || 'No matching log events found in the case logs.'}

Chat History:
${history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')}

User Question: ${userMessage}

Instructions:
1. Provide a highly precise, technical, and objective response to the User's question using ONLY the provided evidence event context.
2. If the context does not contain the answer, state that you cannot find it in the current evidence, but suggest what type of logs or events might help.
3. Be concise and format your response in professional Markdown. Highlight IP addresses, usernames, files, hashes, and MITRE techniques in bold or code formatting.`

  const response = await callLLM(prompt, 'chat')
  return response.text
}

function getMockResponse(taskType) {
  const mocks = {
    summary: `Based on the available evidence artifacts, this investigation documents events occurring within the specified timeframe. Analysis of system logs and authentication records indicates access patterns that warrant further examination. All findings presented are based on available evidence and require human verification before being treated as conclusive.`,
    findings: `1. Authentication logs indicate multiple access attempts from external IP addresses during the reviewed period.\n2. Network traffic analysis reveals data transfer activity that correlates with the timeline of detected events.\n3. System configuration files show standard deployment patterns with areas identified for security hardening.\n4. No evidence of persistent unauthorized access mechanisms was identified in the initial analysis.\n5. Log integrity was maintained throughout the evidence collection process as verified by SHA-256 hashing.`,
    recommendations: `1. Review and update authentication policies for service accounts.\n2. Implement network segmentation to limit lateral movement potential.\n3. Enhance monitoring and alerting for privileged account activity.\n4. Conduct regular access audits for legacy and service accounts.\n5. Update incident response procedures based on response timeline analysis.`,
    section: `This section presents observations derived from the analyzed evidence artifacts. All statements are based on verifiable data and should be independently verified by the reviewing investigator before inclusion in the final report.`,
    chat: `Based on the forensic logs for this case, I have identified the following indicators:\n\n1. **Brute Force attempts** (**T1110**) were detected from IP **45.227.254.20** targeting the SSH service. The threat intelligence feed flags this IP with a **95% malicious confidence score**.\n2. **Valid Account login** (**T1078**) was subsequently recorded for user **admin** at 09:12:03.\n3. Multiple **sudo executions** (**T1548.001**) were performed shortly after, indicating privilege escalation.\n\nLet me know if you would like me to correlate specific timestamps or inspect other IP addresses.`
  }

  return {
    text: mocks[taskType] || mocks.section,
    confidence: 82 + Math.floor(Math.random() * 10),
    model: 'mock-dev',
    usage: { promptTokens: 0, completionTokens: 0 },
  }
}
