// Kakao Maps SDK Type Declarations
declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number, options?: { animate?: boolean }): void;
    getLevel(): number;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    getBounds(): LatLngBounds;
    panTo(latlng: LatLng): void;
    relayout(): void;
    addOverlayMapTypeId(mapTypeId: MapTypeId): void;
    removeOverlayMapTypeId(mapTypeId: MapTypeId): void;
    setMapTypeId(mapTypeId: MapTypeId): void;
    getMapTypeId(): MapTypeId;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    mapTypeId?: MapTypeId;
    draggable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClick?: boolean;
    disableDoubleClickZoom?: boolean;
    projectionId?: string;
    tileAnimation?: boolean;
    keyboardShortcuts?: boolean | KeyboardShortcuts;
  }

  interface KeyboardShortcuts {
    speed?: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
    equals(latlng: LatLng): boolean;
    toString(): string;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(latlng: LatLng): void;
    contain(latlng: LatLng): boolean;
    isEmpty(): boolean;
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    toString(): string;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
    setImage(image: MarkerImage): void;
    getImage(): MarkerImage;
    setTitle(title: string): void;
    getTitle(): string;
    setDraggable(draggable: boolean): void;
    getDraggable(): boolean;
    setClickable(clickable: boolean): void;
    getClickable(): boolean;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
    setVisible(visible: boolean): void;
    getVisible(): boolean;
    setOpacity(opacity: number): void;
    getOpacity(): number;
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    image?: MarkerImage;
    title?: string;
    draggable?: boolean;
    clickable?: boolean;
    zIndex?: number;
    opacity?: number;
    altitude?: number;
    range?: number;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  interface MarkerImageOptions {
    alt?: string;
    coords?: string;
    offset?: Point;
    shape?: string;
    spriteOrigin?: Point;
    spriteSize?: Size;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker?: Marker): void;
    close(): void;
    getMap(): Map | null;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
    setContent(content: string | HTMLElement): void;
    getContent(): string | HTMLElement;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
    setAltitude(altitude: number): void;
    getAltitude(): number;
    setRange(range: number): void;
    getRange(): number;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    disableAutoPan?: boolean;
    map?: Map;
    position?: LatLng;
    removable?: boolean;
    zIndex?: number;
    altitude?: number;
    range?: number;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
    setContent(content: string | HTMLElement): void;
    getContent(): string | HTMLElement;
    setVisible(visible: boolean): void;
    getVisible(): boolean;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
    setAltitude(altitude: number): void;
    getAltitude(): number;
    setRange(range: number): void;
    getRange(): number;
  }

  interface CustomOverlayOptions {
    clickable?: boolean;
    content?: string | HTMLElement;
    map?: Map;
    position?: LatLng;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setOptions(options: PolylineOptions): void;
    setPath(path: LatLng[]): void;
    getPath(): LatLng[];
    getLength(): number;
    setStrokeWeight(weight: number): void;
    getStrokeWeight(): number;
    setStrokeColor(color: string): void;
    getStrokeColor(): string;
    setStrokeOpacity(opacity: number): void;
    getStrokeOpacity(): number;
    setStrokeStyle(style: StrokeStyles): void;
    getStrokeStyle(): StrokeStyles;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
  }

  interface PolylineOptions {
    endArrow?: boolean;
    map?: Map;
    path?: LatLng[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: StrokeStyles;
    strokeWeight?: number;
    zIndex?: number;
  }

  type StrokeStyles = 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'shortdashdotdot' | 'dot' | 'dash' | 'dashdot' | 'longdash' | 'longdashdot' | 'longdashdotdot';

  // ============================================
  // MarkerClusterer (clusterer 라이브러리)
  // ============================================
  interface ClusterStyle {
    width?: string;
    height?: string;
    background?: string;
    borderRadius?: string;
    color?: string;
    textAlign?: string;
    fontWeight?: string;
    lineHeight?: string;
    fontSize?: string;
    boxShadow?: string;
  }

  interface MarkerClustererOptions {
    map?: Map;
    markers?: Marker[];
    gridSize?: number;
    averageCenter?: boolean;
    minLevel?: number;
    minClusterSize?: number;
    styles?: ClusterStyle[];
    texts?: string[] | ((count: number) => string);
    calculator?: number[] | ((count: number) => number);
    disableClickZoom?: boolean;
    clickable?: boolean;
    hoverable?: boolean;
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions);
    addMarker(marker: Marker, nodraw?: boolean): void;
    addMarkers(markers: Marker[], nodraw?: boolean): void;
    removeMarker(marker: Marker, nodraw?: boolean): void;
    removeMarkers(markers: Marker[], nodraw?: boolean): void;
    clear(): void;
    redraw(): void;
    getGridSize(): number;
    setGridSize(size: number): void;
    getMinClusterSize(): number;
    setMinClusterSize(size: number): void;
    getAverageCenter(): boolean;
    setAverageCenter(bool: boolean): void;
    getMinLevel(): number;
    setMinLevel(level: number): void;
    getTexts(): string[] | ((count: number) => string);
    setTexts(texts: string[] | ((count: number) => string)): void;
    getCalculator(): number[] | ((count: number) => number);
    setCalculator(calculator: number[] | ((count: number) => number)): void;
    getStyles(): ClusterStyle[];
    setStyles(styles: ClusterStyle[]): void;
  }

  class Size {
    constructor(width: number, height: number);
    equals(size: Size): boolean;
    toString(): string;
  }

  class Point {
    constructor(x: number, y: number);
    equals(point: Point): boolean;
    toString(): string;
  }

  enum MapTypeId {
    ROADMAP = 1,
    SKYVIEW = 2,
    HYBRID = 3,
    OVERLAY = 4,
    ROADVIEW = 5,
    TRAFFIC = 6,
    TERRAIN = 7,
    BICYCLE = 8,
    BICYCLE_HYBRID = 9,
    USE_DISTRICT = 10,
  }

  namespace event {
    interface MouseEvent {
      latLng: LatLng;
      point: Point;
    }

    function addListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
    function removeListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
    function trigger(target: object, type: string, data?: unknown): void;
  }

  namespace services {
    class Places {
      keywordSearch(keyword: string, callback: PlacesSearchCallback, options?: PlacesSearchOptions): void;
      categorySearch(code: string, callback: PlacesSearchCallback, options?: PlacesSearchOptions): void;
      setMap(map: Map): void;
    }

    interface PlacesSearchOptions {
      category_group_code?: string;
      location?: LatLng;
      x?: number;
      y?: number;
      radius?: number;
      bounds?: LatLngBounds;
      rect?: string;
      size?: number;
      page?: number;
      sort?: SortBy;
      useMapCenter?: boolean;
      useMapBounds?: boolean;
    }

    type PlacesSearchCallback = (
      result: PlacesSearchResult[],
      status: Status,
      pagination: Pagination
    ) => void;

    interface PlacesSearchResult {
      id: string;
      place_name: string;
      category_name: string;
      category_group_code: string;
      category_group_name: string;
      phone: string;
      address_name: string;
      road_address_name: string;
      x: string;
      y: string;
      place_url: string;
      distance: string;
    }

    interface Pagination {
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      current: number;
      first: number;
      last: number;
      perPage: number;
      gotoFirst(): void;
      gotoLast(): void;
      gotoPage(page: number): void;
      nextPage(): void;
      prevPage(): void;
    }

    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }

    enum SortBy {
      ACCURACY = 'accuracy',
      DISTANCE = 'distance',
    }

    class Geocoder {
      addressSearch(addr: string, callback: GeocoderCallback, options?: GeocoderOptions): void;
      coord2Address(x: number, y: number, callback: GeocoderCallback, options?: GeocoderOptions): void;
      coord2RegionCode(x: number, y: number, callback: GeocoderCallback, options?: GeocoderOptions): void;
      transCoord(x: number, y: number, callback: GeocoderCallback, options?: GeocoderOptions): void;
    }

    type GeocoderCallback = (result: GeocoderResult[], status: Status) => void;

    interface GeocoderResult {
      address_name: string;
      address_type: string;
      x: string;
      y: string;
      address?: Address;
      road_address?: RoadAddress;
    }

    interface Address {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      region_3depth_h_name: string;
      h_code: string;
      b_code: string;
      mountain_yn: string;
      main_address_no: string;
      sub_address_no: string;
      x: string;
      y: string;
    }

    interface RoadAddress {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      underground_yn: string;
      main_building_no: string;
      sub_building_no: string;
      building_name: string;
      zone_no: string;
      x: string;
      y: string;
    }

    interface GeocoderOptions {
      input_coord?: Coords;
      output_coord?: Coords;
    }

    enum Coords {
      WGS84 = 'WGS84',
      WCONGNAMUL = 'WCONGNAMUL',
      CONGNAMUL = 'CONGNAMUL',
      WTM = 'WTM',
      TM = 'TM',
    }
  }
}

// Make kakao available globally
declare global {
  const kakao: typeof kakao;
}
