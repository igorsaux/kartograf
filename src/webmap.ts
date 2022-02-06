import L from 'leaflet'
import {
  BaseLayers,
  Config,
  FileLayerPathGetter,
  getLayerFolder,
  getLayerImage,
  LayerWithName,
  Map,
  MapWithName,
  Maybe,
  Overlays,
} from '.'

type WebmapParameters = {
  webmap: L.Map
  config: Config
  map: MapWithName
  pathGetter?: FileLayerPathGetter
}

export class WebmapBuilder {
  private _instance: Webmap

  constructor(params: WebmapParameters) {
    this._instance = new Webmap(params)
  }

  static new(params: WebmapParameters): WebmapBuilder {
    return new WebmapBuilder(params)
  }

  andSetAttributionPrefix(prefix: string): WebmapBuilder {
    this._instance.webmap.attributionControl.setPrefix(prefix)

    return this
  }

  andAddLayer(layer: L.Layer): WebmapBuilder {
    this._instance.webmap.addLayer(layer)

    return this
  }

  andBuild(): Webmap {
    return this._instance
  }
}

class Webmap {
  private _webmap: L.Map
  private _map: MapWithName
  private _config: Config
  private _baseLayers: BaseLayers = {}
  private _overlays: Overlays = {}
  private _layersControl: L.Control.Layers
  private _pathGetter: FileLayerPathGetter
  private _mainBaseLayer: Maybe<LayerWithName>

  get webmap(): L.Map {
    return this._webmap
  }

  get map(): Map {
    return this._map[0]
  }

  get mapName(): string {
    return this._map[1]
  }

  get config(): Config {
    return this._config
  }

  constructor(params: WebmapParameters) {
    this._webmap = params.webmap
    this._config = params.config
    this._map = params.map
    this._layersControl = L.control.layers().addTo(this.webmap)

    if (!params.pathGetter) {
      if (this.config.layerSettings?.type === 'Tiles') {
        this._pathGetter = getLayerFolder
      } else {
        this._pathGetter = getLayerImage
      }
    } else {
      this._pathGetter = params.pathGetter
    }
  }

  initialize() {
    this.webmap.setMaxBounds(this.map.bounds)
    this.webmap.fitBounds(this.map.bounds)

    this._baseLayers = this._getBaseLayersForMap()
    this._addBaseLayersToControl()

    this._overlays = this._getOverlays()

    this._mainBaseLayer = this._findMainBaseLayer()

    if (this._mainBaseLayer) {
      this._updateOverlays(this._mainBaseLayer[1])
      this._mainBaseLayer[0].addTo(this.webmap)
    }

    this.webmap.on('baselayerchange', (event: L.LayersControlEvent) =>
      this._updateOverlays(event.name)
    )
  }

  private _findMainBaseLayer(): Maybe<LayerWithName> {
    for (const layerName in this._baseLayers) {
      if (layerName === this.map.mainLevel) {
        return [this._baseLayers[layerName], layerName]
      }
    }

    return undefined
  }

  private _addBaseLayersToControl() {
    for (const layerName in this._baseLayers) {
      const layer = this._baseLayers[layerName]
      this._layersControl.addBaseLayer(layer, layerName)
    }
  }

  private _getBaseLayersForMap(): BaseLayers {
    const baseLayers: BaseLayers = {}

    for (const levelName in this.map.levels) {
      const level = this.map.levels[levelName]
      const underlays: L.TileLayer[] | L.ImageOverlay[] = []

      if (level.underlays) {
        for (const underlayName of level.underlays) {
          let underlay

          if (this._config.layerSettings?.type === 'Tiles') {
            underlay = L.tileLayer(
              `${this._pathGetter(
                this.mapName,
                underlayName,
                this.map.layers[0]
              )}/{z}/{x}/{y}.png`,
              {
                className: 'UnderlayLayer',
                bounds: this.map.bounds,
                maxZoom: 4,
                maxNativeZoom: 4,
                tileSize: this._config.layerSettings.tileSize,
              }
            )
          } else {
            underlay = L.imageOverlay(
              this._pathGetter(this.mapName, underlayName, this.map.layers[0]),
              this.map.bounds,
              {
                className: 'UnderlayLayer',
              }
            )
          }

          underlays.push(underlay)
        }
      }

      let baseLayer

      if (this._config.layerSettings?.type === 'Tiles') {
        baseLayer = L.tileLayer(
          `${this._pathGetter(
            this.mapName,
            levelName,
            this.map.layers[0]
          )}/{z}/{x}/{y}.png`,
          {
            bounds: this.map.bounds,
            maxZoom: 4,
            maxNativeZoom: 4,
            tileSize: this._config.layerSettings.tileSize,
          }
        )
      } else {
        baseLayer = L.imageOverlay(
          this._pathGetter(this.mapName, levelName, this.map.layers[0]),
          this.map.bounds
        )
      }

      baseLayers[levelName] = L.layerGroup(underlays).addLayer(baseLayer)
    }

    return baseLayers
  }

  private _getOverlays(): Overlays {
    const overlays: Overlays = {}

    for (const levelName in this.map.levels) {
      const level = this.map.levels[levelName]

      overlays[levelName] = {}

      for (const layerName of this.map.layers.slice(1)) {
        const layer = this.config.layers[layerName]
        let overlay

        if (this._config.layerSettings?.type === 'Tiles') {
          overlay = L.tileLayer(
            `${this._pathGetter(
              this.mapName,
              levelName,
              layerName
            )}/{z}/{x}/{y}.png`,
            {
              bounds: this.map.bounds,
              maxZoom: 4,
              maxNativeZoom: 4,
              tileSize: 1024,
            }
          )
        } else {
          overlay = L.imageOverlay(
            this._pathGetter(this.mapName, levelName, layerName),
            this.map.bounds
          )
        }

        overlays[levelName][layer.display] = overlay
      }
    }

    return overlays
  }

  private _updateOverlays(targetLevel: string) {
    for (const levelName in this._overlays) {
      for (const overlayName in this._overlays[levelName]) {
        const overlay = this._overlays[levelName][overlayName]

        this._layersControl.removeLayer(overlay)
      }
    }

    for (const overlayName in this._overlays[targetLevel]) {
      const overlay = this._overlays[targetLevel][overlayName]

      this._layersControl.addOverlay(overlay, overlayName)
    }
  }
}
