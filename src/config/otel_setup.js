"use strict";

// Lightweight, optional OpenTelemetry integration for observability.
// This module attempts to start OTEL tracing/metrics if dependencies are present
// and OTEL is enabled via environment variable. If anything fails, it fails
// gracefully without impacting the app startup.

(async () => {
  if (process.env.NODE_ENV === 'test') {
    console.info('[OTEL] Test env: skipping OpenTelemetry setup');
    return;
  }
  const enable = (process.env.OTEL_ENABLED || 'true').toLowerCase() === 'true';
  if (!enable) {
    console.info('[OTEL] Telemetry disabled (OTEL_ENABLED=false)');
    return;
  }
  try {
    // Lazy require; if not installed, fallback without crashing
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
    // Build a minimal, safe instrumentation set to reduce overhead
    const instrumentations = [
      new HttpInstrumentation(),
      new ExpressInstrumentation()
    ];
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
    // Support optional collector host (for production) and OTLP endpoint
    const collectorHost = process.env.OTEL_COLLECTOR_HOST || 'localhost';
    const otlpUrl = process.env.OTLP_URL || `http://${collectorHost}:4318/v1/traces`;

    // Optional sampling (ratio based). Default to no explicit sampler if not available.
    let sampler;
    try {
      const { TraceIdRatioBasedSampler } = require('@opentelemetry/sdk-trace-base');
      const ratio = parseFloat(process.env.OTEL_SAMPLER_RATIO || '0.2');
      sampler = new TraceIdRatioBasedSampler(ratio);
    } catch (e) {
      sampler = undefined;
    }
    const sdk = new NodeSDK({
      sampler,
      traceExporter: new OTLPTraceExporter({ url: otlpUrl }),
      metricExporter: new OTLPMetricExporter({ url: otlpUrl }),
      serviceName: process.env.OTEL_SERVICE_NAME || 'ecosyntech-iot-backend',
      instrumentations: instrumentations,
    });

    await sdk.start();
    console.info('[OTEL] OpenTelemetry started successfully');
  } catch (err) {
    // Do not block startup if OTEL packages are unavailable
    console.warn('[OTEL] OpenTelemetry not started:', err?.message || err);
  }
})();

module.exports = true;
