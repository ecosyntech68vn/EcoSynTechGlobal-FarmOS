'use strict';

class KalmanFilter {
  constructor(R = 0.1, Q = 0.01) {
    this.R = R;
    this.Q = Q;
    this.x = null;
    this.P = null;
  }

  filter(z) {
    if (this.x === null) {
      this.x = z;
      this.P = 1;
      return this.x;
    }
    const x_pred = this.x;
    const P_pred = this.P + this.Q;
    const K = P_pred / (P_pred + this.R);
    this.x = x_pred + K * (z - x_pred);
    this.P = (1 - K) * P_pred;
    return this.x;
  }

  reset() {
    this.x = null;
    this.P = null;
  }

  getState() {
    return { x: this.x, P: this.P };
  }
}

module.exports = KalmanFilter;