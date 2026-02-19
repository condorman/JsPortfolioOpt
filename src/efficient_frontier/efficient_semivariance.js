import { EfficientFrontier } from './efficient_frontier.js'

export class EfficientSemivariance extends EfficientFrontier {
  minSemivariance() {
    return this._notImplemented('min_semivariance')
  }

  // Python alias
  min_semivariance(...args) {
    return this.minSemivariance(...args)
  }
}
