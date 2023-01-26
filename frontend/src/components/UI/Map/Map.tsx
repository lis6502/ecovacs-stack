import { Box } from '@mui/material';
import { Map as OlMap, View } from 'ol';
import { getCenter } from 'ol/extent';
import { Projection } from 'ol/proj';
import { Children, cloneElement, FC, isValidElement, ReactNode, useEffect, useRef, useState } from 'react';
import { getNotificationDrawer } from '../../../store/menu/menuSlice';

import { LayerProps } from '../../VacuumMap/Layers/Layer.type';
import { MapContext } from './MapContex';

interface MapProps {
  children?: ReactNode;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  projection: Projection;
}

const Map: FC<MapProps> = ({ children, zoom, minZoom, maxZoom, projection }) => {
  const mapRef = useRef<HTMLDivElement>();
  const [map, setMap] = useState<OlMap>();

  const { isOpen } = getNotificationDrawer();

  const getZIndex = (index: number) => Children.count(children) - 1 - index;

  useEffect(() => {
    if (!map) return;

    setTimeout(() => {
      map.updateSize();
    }, 200);
  }, [isOpen]);

  useEffect(() => {
    const initialMap = new OlMap({
      layers: [],
      view: new View({
        projection,
        center: getCenter(projection.getExtent()),
        zoom,
        minZoom,
        maxZoom,
      }),
    });

    initialMap.setTarget(mapRef.current);
    setMap(initialMap);
    initialMap.getView().fit(projection.getExtent());
    return () => initialMap.setTarget(undefined);
  }, []);

  return (
    <>
      <MapContext.Provider value={map}>
        <Box
          sx={{ top: 0, left: 0, width: '100%', height: '100%', position: 'absolute', overflow: 'hidden' }}
          ref={mapRef}
        >
          {Children.map(children, (child, index) => {
            if (isValidElement<LayerProps>(child)) {
              return cloneElement<LayerProps>(child, {
                projection,
                ZIndex: getZIndex(index),
              });
            }
          })}
        </Box>
      </MapContext.Provider>
    </>
  );
};

export default Map;
