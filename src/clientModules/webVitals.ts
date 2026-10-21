/**
 * Reports Core Web Vitals from real visitors to Google Analytics, with
 * attribution, so slow pages and interactions can be traced to an element or
 * script. Search Console only shows a site-wide INP figure from CrUX; these
 * events show which page, element and phase are responsible.
 *
 * Each metric is sent as a GA4 event named after it (LCP, INP, CLS, FCP, TTFB).
 * The debug_* parameters must be registered as event-scoped custom dimensions
 * in GA before they show up in reports.
 */
/// <reference types="gtag.js" />
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type MetricWithAttribution,
} from 'web-vitals/attribution';

// GA4 truncates event parameter values longer than 100 characters.
const MAX_PARAM_LENGTH = 100;

function truncate(value: string | undefined): string | undefined {
  return value?.slice(0, MAX_PARAM_LENGTH);
}

function attributionParams(metric: MetricWithAttribution) {
  switch (metric.name) {
    case 'INP': {
      const a = metric.attribution;
      const script = a.longestScript?.entry;
      return {
        debug_target: truncate(a.interactionTarget),
        debug_interaction_type: a.interactionType,
        debug_load_state: a.loadState,
        debug_input_delay: Math.round(a.inputDelay),
        debug_processing_duration: Math.round(a.processingDuration),
        debug_presentation_delay: Math.round(a.presentationDelay),
        debug_script: truncate(script && (script.invoker || script.sourceURL)),
      };
    }
    case 'LCP': {
      const a = metric.attribution;
      return {
        debug_target: truncate(a.target),
        debug_url: truncate(a.url),
        debug_ttfb: Math.round(a.timeToFirstByte),
        debug_resource_load_delay: Math.round(a.resourceLoadDelay),
        debug_resource_load_duration: Math.round(a.resourceLoadDuration),
        debug_render_delay: Math.round(a.elementRenderDelay),
      };
    }
    case 'CLS': {
      const a = metric.attribution;
      return {
        debug_target: truncate(a.largestShiftTarget),
        debug_load_state: a.loadState,
      };
    }
    default:
      return {};
  }
}

function sendToGoogleAnalytics(metric: MetricWithAttribution) {
  window.gtag('event', metric.name, {
    // GA4 sums `value`, so send the delta; CLS is scaled to keep it an integer.
    value: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: metric.rating,
    metric_navigation_type: metric.navigationType,
    ...attributionParams(metric),
  });
}

if (typeof window !== 'undefined') {
  onCLS(sendToGoogleAnalytics);
  onFCP(sendToGoogleAnalytics);
  onINP(sendToGoogleAnalytics);
  onLCP(sendToGoogleAnalytics);
  onTTFB(sendToGoogleAnalytics);
}

export {};
