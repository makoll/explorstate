import React, { useContext } from 'react';
import Chart from 'react-google-charts';

import { translateGoogleChartsData } from './data/Generator';

import { ActionType, AppContext } from '@/components/pages/Top';

const MapView: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { displayingAreaCode, resolution, records } = state;
  const googleChartsData = translateGoogleChartsData(displayingAreaCode, records);

  // TODO any消したい
  const selectAreaOnMapHandler = ({ chartWrapper }: Record<string, any>) => {
    const { lastGoogleChartsData, displayingAreaCode } = state;
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = lastGoogleChartsData[selectedAreaIndex][0];

    if (selectedAreaCode.startsWith(displayingAreaCode)) {
      dispatch({
        type: ActionType.CHOICE_SUBDIVISION,
        payload: { subdivisionCode: selectedAreaCode },
      });
      return;
    }

    dispatch({
      type: ActionType.CHOICE_COUNTRY,
      payload: { countryCode: selectedAreaCode },
    });
  };

  const options = {
    region: displayingAreaCode,
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
          callback: selectAreaOnMapHandler,
        },
      ]}
      chartType='GeoChart'
      height={`${window.innerHeight - 30}px`}
      width={`${window.innerWidth - 300}px`}
      options={options}
      data={googleChartsData}
    />
  );
};

export default MapView;
