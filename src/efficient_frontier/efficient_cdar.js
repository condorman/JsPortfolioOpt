import { EfficientFrontier } from './efficient_frontier.js'

export class EfficientCDaR extends EfficientFrontier {
  minCdar() {
    return this._notImplemented('min_cdar')
  }

  min_cdar(...args) {
    return this.minCdar(...args)
  }
}
