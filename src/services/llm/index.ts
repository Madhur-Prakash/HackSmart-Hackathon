import Groq from 'groq-sdk';
import { config } from '../../config';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { round, retry } from '../../utils/helpers';
import { RankedStation, RecommendationRequest, StationScore } from '../../types';

const logger = createLogger('llm-service');

// Initialize Groq client
const groq = new Groq({
  apiKey: config.groq.apiKey,
});

/**
 * Context for generating explanations
 */
export interface ExplanationContext {
  userRequest: RecommendationRequest;
  topStation: RankedStation;
  alternatives: RankedStation[];
  totalCandidates: number;
}

/**
 * Prompt template for station recommendation explanation
 */
function buildExplanationPrompt(context: ExplanationContext): string {
  const { userRequest, topStation, alternatives, totalCandidates } = context;
  
  if (!topStation) {
    return `No stations found matching the criteria. Please try adjusting your search parameters.`;
  }

  const waitTimeImprovement = alternatives.length > 0 
    ? round(((alternatives[0]?.estimatedWaitTime || 0) - topStation.estimatedWaitTime) / (alternatives[0]?.estimatedWaitTime || 1) * 100, 0)
    : 0;

  return `You are an AI assistant helping EV drivers find the best charging stations.

Based on the analysis of ${totalCandidates} stations, generate a concise, helpful explanation for why the recommended station is the best choice.

USER REQUEST:
- Location: ${userRequest.location.latitude}, ${userRequest.location.longitude}
- Vehicle Type: ${userRequest.vehicleType || 'Not specified'}
- Battery Level: ${userRequest.batteryLevel || 'Not specified'}%
- Preferred Charger: ${userRequest.preferredChargerType || 'Any'}
- Max Wait Time: ${userRequest.maxWaitTime || 'No limit'} minutes
- Max Distance: ${userRequest.maxDistance || 'No limit'} km

TOP RECOMMENDATION:
- Station: ${topStation.stationName}
- Score: ${round(topStation.score * 100, 1)}%
- Distance: ${topStation.estimatedDistance} km
- Wait Time: ${topStation.estimatedWaitTime} minutes
- Available Chargers: ${topStation.availableChargers}
- Charger Types: ${topStation.chargerTypes.join(', ')}

ALTERNATIVES:
${alternatives.map((alt, i) => 
  `${i + 2}. ${alt.stationName} - Score: ${round(alt.score * 100, 1)}%, Distance: ${alt.estimatedDistance} km, Wait: ${alt.estimatedWaitTime} min`
).join('\n')}

KEY METRICS:
- Wait time advantage: ${waitTimeImprovement > 0 ? `${waitTimeImprovement}% lower than next best option` : 'Competitive'}
- Reliability Score: ${topStation.features?.stationReliabilityScore ? round(topStation.features.stationReliabilityScore * 100, 0) + '%' : 'Good'}
- Energy Stability: ${topStation.features?.energyStabilityIndex ? round(topStation.features.energyStabilityIndex * 100, 0) + '%' : 'Stable'}

Generate a 2-3 sentence explanation that:
1. States why this station is recommended (be specific about metrics)
2. Mentions any notable advantages
3. Is conversational and helpful

Do NOT mention internal scores or technical details. Focus on practical benefits for the driver.`;
}

/**
 * Prompt template for admin summary
 */
function buildAdminSummaryPrompt(data: {
  totalStations: number;
  operationalStations: number;
  degradedStations: number;
  avgScore: number;
  topStations: Array<{ stationId: string; name: string; score: number }>;
  alertCount: number;
}): string {
  return `You are an AI assistant generating a system health summary for EV charging network administrators.

SYSTEM STATUS:
- Total Stations: ${data.totalStations}
- Operational: ${data.operationalStations}
- Degraded: ${data.degradedStations}
- Offline: ${data.totalStations - data.operationalStations - data.degradedStations}
- Average Station Score: ${round(data.avgScore * 100, 1)}%
- Active Alerts: ${data.alertCount}

TOP PERFORMING STATIONS:
${data.topStations.slice(0, 5).map((s, i) => 
  `${i + 1}. ${s.name} (${s.stationId}) - Score: ${round(s.score * 100, 1)}%`
).join('\n')}

Generate a brief (3-4 sentence) executive summary that:
1. Summarizes overall network health
2. Highlights any concerns if degraded/offline stations > 10%
3. Mentions top performers
4. Is professional and actionable`;
}

/**
 * Generate explanation for recommendation using LLM
 */
export async function generateExplanation(context: ExplanationContext): Promise<string> {
  const startTime = Date.now();

  // If no Groq key, use fallback
  if (!config.groq.apiKey || config.groq.apiKey === 'your-groq-api-key-here') {
    return generateFallbackExplanation(context);
  }

  try {
    const prompt = buildExplanationPrompt(context);

    const response = await retry(
      async () => {
        return groq.chat.completions.create({
          model: config.groq.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that explains EV charging station recommendations in a clear, concise manner.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        });
      },
      { maxRetries: 3, baseDelay: 1000 }
    );

    const explanation = response.choices[0]?.message?.content || generateFallbackExplanation(context);

    const duration = Date.now() - startTime;
    logMetrics(logger, 'llm.explanation.latency', duration);
    logEvent(logger, 'explanation_generated', { 
      method: 'groq',
      tokens: response.usage?.total_tokens 
    });

    return explanation;

  } catch (error) {
    logger.error('LLM explanation failed, using fallback', { error });
    return generateFallbackExplanation(context);
  }
}

/**
 * Generate fallback explanation without LLM
 */
function generateFallbackExplanation(context: ExplanationContext): string {
  const { topStation, alternatives } = context;

  if (!topStation) {
    return 'No charging stations found matching your criteria. Please try expanding your search radius or adjusting your preferences.';
  }

  const parts: string[] = [];

  // Main recommendation
  parts.push(`${topStation.stationName} is recommended`);

  // Distance
  if (topStation.estimatedDistance < 5) {
    parts.push(`because it's only ${topStation.estimatedDistance} km away`);
  } else {
    parts.push(`at ${topStation.estimatedDistance} km distance`);
  }

  // Wait time
  if (topStation.estimatedWaitTime < 5) {
    parts.push(`with minimal wait time (${topStation.estimatedWaitTime} minutes)`);
  } else if (topStation.estimatedWaitTime < 15) {
    parts.push(`with a ${topStation.estimatedWaitTime} minute estimated wait`);
  }

  // Availability
  if (topStation.availableChargers > 3) {
    parts.push(`and has ${topStation.availableChargers} chargers available`);
  }

  // Comparison with alternatives
  if (alternatives.length > 0 && topStation.estimatedWaitTime < alternatives[0].estimatedWaitTime) {
    const timeSaved = alternatives[0].estimatedWaitTime - topStation.estimatedWaitTime;
    parts.push(`. This saves you approximately ${round(timeSaved, 0)} minutes compared to the next option`);
  }

  // Reliability mention if high
  if (topStation.features?.stationReliabilityScore && topStation.features.stationReliabilityScore > 0.95) {
    parts.push('. The station has excellent reliability');
  }

  return parts.join(' ') + '.';
}

/**
 * Generate admin summary using LLM
 */
export async function generateAdminSummary(data: {
  totalStations: number;
  operationalStations: number;
  degradedStations: number;
  avgScore: number;
  topStations: Array<{ stationId: string; name: string; score: number }>;
  alertCount: number;
}): Promise<string> {
  // If no Groq key, use fallback
  if (!config.groq.apiKey || config.groq.apiKey === 'your-groq-api-key-here') {
    return generateFallbackAdminSummary(data);
  }

  try {
    const prompt = buildAdminSummaryPrompt(data);

    const response = await groq.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant generating system health summaries for infrastructure administrators.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 250,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || generateFallbackAdminSummary(data);

  } catch (error) {
    logger.error('LLM admin summary failed, using fallback', { error });
    return generateFallbackAdminSummary(data);
  }
}

/**
 * Generate fallback admin summary without LLM
 */
function generateFallbackAdminSummary(data: {
  totalStations: number;
  operationalStations: number;
  degradedStations: number;
  avgScore: number;
  topStations: Array<{ stationId: string; name: string; score: number }>;
  alertCount: number;
}): string {
  const operationalPercent = round((data.operationalStations / data.totalStations) * 100, 1);
  const healthStatus = operationalPercent >= 90 ? 'healthy' : operationalPercent >= 70 ? 'acceptable' : 'concerning';

  let summary = `Network status is ${healthStatus} with ${operationalPercent}% of stations operational. `;
  
  if (data.degradedStations > 0) {
    summary += `${data.degradedStations} stations are in degraded status and may need attention. `;
  }

  if (data.alertCount > 0) {
    summary += `There are ${data.alertCount} active alerts requiring review. `;
  }

  if (data.topStations.length > 0) {
    summary += `Top performing station is ${data.topStations[0].name} with a ${round(data.topStations[0].score * 100, 1)}% efficiency score.`;
  }

  return summary;
}

/**
 * Explain a specific station's score breakdown
 */
export function explainScoreBreakdown(score: StationScore): string {
  const { componentScores } = score;

  const factors: string[] = [];

  if (componentScores.waitTimeScore > 0.8) {
    factors.push('excellent wait times');
  } else if (componentScores.waitTimeScore < 0.4) {
    factors.push('longer wait times');
  }

  if (componentScores.availabilityScore > 0.8) {
    factors.push('high charger availability');
  } else if (componentScores.availabilityScore < 0.4) {
    factors.push('limited charger availability');
  }

  if (componentScores.reliabilityScore > 0.9) {
    factors.push('excellent reliability');
  }

  if (componentScores.energyStabilityScore > 0.8) {
    factors.push('stable energy supply');
  }

  if (factors.length === 0) {
    return `This station has an overall score of ${round(score.overallScore * 100, 1)}% based on balanced performance across all metrics.`;
  }

  return `This station scores ${round(score.overallScore * 100, 1)}% overall, featuring ${factors.join(', ')}.`;
}
