import { calculateTicketMetadata } from '../lib/business-logic';
import assert from 'assert';

// Simple test runner since we might not have a full test harness set up
console.log('Running Business Logic Tests...');

const tests = [
  {
    name: 'Should handle blocked requests as High Severity',
    run: () => {
      const result = calculateTicketMetadata('disable logging', false, true);
      assert.strictEqual(result.severity, 'HIGH');
      assert.strictEqual(result.needsEscalation, true);
    }
  },
  {
    name: 'Should handle critical keywords as High Severity TIER_2',
    run: () => {
      const result = calculateTicketMetadata('my vm had a kernel panic', true, false);
      assert.strictEqual(result.severity, 'HIGH');
      assert.strictEqual(result.tier, 'TIER_2');
    }
  },
  {
    name: 'Should deflect standard queries with docs found',
    run: () => {
      const result = calculateTicketMetadata('how to reset password', true, false);
      assert.strictEqual(result.tier, 'TIER_1');
      assert.strictEqual(result.needsEscalation, false);
    }
  },
  {
    name: 'Should escalate if no docs found',
    run: () => {
      const result = calculateTicketMetadata('unknown weird error', false, false);
      assert.strictEqual(result.tier, 'TIER_2');
      assert.strictEqual(result.needsEscalation, true);
    }
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    test.run();
    console.log(`✅ ${test.name}`);
    passed++;
  } catch (e: any) {
    console.log(`❌ ${test.name}`);
    console.error(e.message);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
