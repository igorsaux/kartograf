export type Maybe<T> = T | undefined | null

export type Bounds = [[number, number], [number, number]]

export type MapWithName = [map: Map, name: string]

export type LayerWithName = [layer: L.ImageOverlay | L.LayerGroup, name: string]

export type Maps = {
  [key: string]: Map
}

export type Layers = {
  [key: string]: Layer
}

export type Selectors = {
  [key: string]: Selector
}

export type Levels = {
  [key: string]: Level
}

export type Level = {
  path: string
  underlays?: string[]
}

export type Layer = {
  display: string
  selectors: string[]
}

export type Map = {
  bounds: Bounds
  layers: string[]
  levels: Levels
  mainLevel?: string
}

export type ByPath = {
  exclude?: string[]
  include: string[]
  type: any
}

export type UseSelector = {
  name: string
  negate: boolean
}

export type Selector = {
  rules: Rule[]
}

export type Rule = ByPath | UseSelector

export type LayerSingleType = {
  type: 'Single'
}

export type LayerTilesType = {
  type: 'Tiles'
  tileSize: number
}

export type Config = {
  dme: string
  layers: Layers
  groups: Maps
  selectors: Selectors
  layerSettings?: LayerSingleType | LayerTilesType
}

export type FileLayerPathGetter = (
  mapName: string,
  levelName: string,
  layerName: string
) => string

export type BaseLayers = { [name: string]: L.LayerGroup }

export type Overlays = {
  [levelName: string]: {
    [name: string]: L.TileLayer | L.ImageOverlay
  }
}
