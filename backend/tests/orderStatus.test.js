import { describe, expect, it } from '@jest/globals';
import { ORDER_STATUS, canTransition, nextStatus, isFinalStatus } from '../utils/orderStatus.js';

describe('order status state machine', () => {
  it('allows the happy path step by step', () => {
    expect(canTransition('RECEIVED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
  });

  it('blocks skipping steps and going backwards', () => {
    expect(canTransition('RECEIVED', 'DELIVERED')).toBe(false);
    expect(canTransition('PREPARING', 'RECEIVED')).toBe(false);
    expect(canTransition('DELIVERED', 'PREPARING')).toBe(false);
  });

  it('allows cancelling only from RECEIVED', () => {
    expect(canTransition('RECEIVED', 'CANCELLED')).toBe(true);
    expect(canTransition('PREPARING', 'CANCELLED')).toBe(false);
  });

  it('nextStatus follows the flow and ends at null', () => {
    expect(nextStatus(ORDER_STATUS.RECEIVED)).toBe('PREPARING');
    expect(nextStatus(ORDER_STATUS.OUT_FOR_DELIVERY)).toBe('DELIVERED');
    expect(nextStatus(ORDER_STATUS.DELIVERED)).toBeNull();
    expect(nextStatus(ORDER_STATUS.CANCELLED)).toBeNull();
  });

  it('knows final statuses', () => {
    expect(isFinalStatus('DELIVERED')).toBe(true);
    expect(isFinalStatus('CANCELLED')).toBe(true);
    expect(isFinalStatus('PREPARING')).toBe(false);
  });
});
