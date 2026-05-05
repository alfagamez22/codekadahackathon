declare module 'leaflet.markercluster' {
  import type * as L from 'leaflet'

  export interface MarkerClusterGroupOptions extends L.LayerOptions {
    maxClusterRadius?: number
    showCoverageOnHover?: boolean
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon
  }

  export interface MarkerCluster extends L.Marker {
    getChildCount(): number
  }

  export interface MarkerClusterGroup extends L.LayerGroup {
    addLayer(layer: L.Layer): this
  }
}
