import { EfficientFrontier } from './efficient_frontier.js'

export class EfficientCVaR extends EfficientFrontier {
  minCvar() {
    return this._notImplemented('min_cvar')
  }

  min_cvar(...args) {
    return this.minCvar(...args)
  }
}
