import L from 'leaflet'

export * from './webmap'
export * from './types'

import { Map, FileLayerPathGetter, BaseLayers } from './types'

export function getLayerFolder(
  mapName: string,
  levelName: string,
  layerName: string
): string {
  return `${mapName}-${levelName}-${layerName}`
}

export function getLayerImage(
  mapName: string,
  levelName: string,
  layerName: string
): string {
  return `${getLayerFolder(mapName, levelName, layerName)}.png`
}

export function getBaseLayersForMap(
  mapName: string,
  map: Map,
  pathGetter?: FileLayerPathGetter
): BaseLayers {
  pathGetter = pathGetter || getLayerFolder
  let layers: BaseLayers = {}

  for (const levelName in map.levels) {
    const level = map.levels[levelName]
    const underlays: L.ImageOverlay[] = []

    if (level.underlays) {
      for (const underlayName of level.underlays) {
        underlays.push(
          L.imageOverlay(
            pathGetter(mapName, underlayName, map.layers[0]),
            map.bounds,
            {
              className: 'UnderlayLayer',
            }
          )
        )
      }
    }

    layers[levelName] = L.layerGroup(underlays).addLayer(
      L.imageOverlay(pathGetter(mapName, levelName, map.layers[0]), map.bounds)
    )
  }

  return layers
}
