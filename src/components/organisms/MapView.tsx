import React from 'react';
import Chart from 'react-google-charts';

import { GoogleChartsData } from '@/types/GoogleChartsData';

type Props = {
  region: string;
  resolution: string;
  data: GoogleChartsData[];
  onSelect: (chartWrapper: any) => void;
};

const MapView: React.FC<Props> = ({ region, resolution, data, onSelect }) => {
  const options = {
    region,
    resolution,
    legend: 'none',
    colorAxis: { colors: ['white', '#DBFFDB', '#CCEDD2', '#CCEDCC', '#BEEDBE'] },
    backgroundColor: '#90C0E0',
  };

  return (
    <Chart
      chartEvents={[
        {
          eventName: 'select',
          callback: onSelect,
        },
      ]}
      chartType='GeoChart'
      height={`${window.innerHeight - 30}px`}
      width={`${window.innerWidth - 300}px`}
      options={options}
      data={data}
    />
  );
};

export default MapView;
