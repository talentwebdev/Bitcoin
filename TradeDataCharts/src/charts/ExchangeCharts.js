import React from 'react';
import Chart from "react-apexcharts";
import exchange from "./../modules/exchange"

var  exchange_helper;

class ExchangeCharts extends React.Component{
    constructor(props)
    {
        super(props);

        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateNew = this.onUpdateNew.bind(this);

        exchange_helper = exchange("wss://api.exchange.bitcoin.com/api/2/ws",
        {
            symbol: "ETHBTC",
            period: "M30",
        },
        null, 
        this.onUpdate, 
        null);

        this.state = {
           
            series: [],
            options:{
                noData: {
                    text: 'Loading ... ',
                },
                chart: {
                    height: 350,
                    type: 'line'
                },
                title: {
                    text: "Exchange Chart CandleStick",
                    align: "left"
                },
                tooltip: {
                    shared: true,
                    custom: [ 
                        function({seriesIndex, dataPointIndex, w})
                        {
                            const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
                            const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
                            const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
                            const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
                            //console.log(w.globals.seriesCandleC[seriesIndex][w.globals.seriesCandleC.length - 1]);
                            return (
                                '<div class="apexcharts-tooltip-candlestick">' +
                                    '<div>Open: <span class="value">' +
                                    o +
                                    '</span></div>' +
                                    '<div>High: <span class="value">' +
                                    h +
                                    '</span></div>' +
                                    '<div>Low: <span class="value">' +
                                    l +
                                    '</span></div>' +
                                    '<div>Close: <span class="value">' +
                                    c +
                                    '</span></div>' +
                                '</div>'
                            );
                        }
                    ]
                },
                xaxis: {
                    type: 'datetime'
                },
                yaxis: [
                    {
                        seriesName: 'candle',
                        axisTicks: {
                            show: true
                        },                        
                        logarithmic: false,
                        forceNiceScale: false,
                        min: exchange.minData,
                        max: exchange.maxData,
                        title: {
                            text: "OHLC DATA",
                            style: {
                                color: "#FEB019",
                            }
                        }
                    }
                ]
            }
        };

        exchange_helper.connect();
    }

    onUpdate(data) {
        
        console.log(data[data.length - 1]);
        console.log(exchange_helper.minData, exchange_helper.maxData);
        
        //newOptions.yaxis[0].title.text = "New Text";
        let d = data.map(item => {
            return {x: item.x, y: [item.y[0], item.y[1], item.y[2], item.y[3]]};
        });

        this.setState({
            series: [{
                type: "candlestick",
                data: d
            }]
        });

        this.setState((state) => ({
            options: {
                ...state.options,
                yaxis: [
                    {
                        seriesName: 'candle',
                        axisTicks: {
                            show: true
                        },
                        min: exchange_helper.minData,
                        max: exchange_helper.maxData,
                        title: {
                            text: "OHLC DATA",
                            style: {
                                color: "#FEB019",
                            }
                        }
                    }
                ]
            }
        }))
        
    }

    onUpdateNew()
    {
        /*
        let newSeries = [];

        this.state.series.forEach(s => {
            let data = s.data.map((item, index) => {
                if(index == 2)
                    return {x: item.x, y: [item.y[0] + 1, item.y[1] + 1, item.y[2] + 1, item.y[3] + 1]};
                else 
                    return item;
              });
            newSeries.push({ data: data, type: s.type });
        });
        this.setState({ 
            series: newSeries
        });
        */
    }
    render()
    {
        return (
            <div>
                <div id="chart">
                <Chart options={this.state.options} series={this.state.series} type="line" height={350} />
                </div>
                <div id="html-dist"></div>
                <button onClick={this.onUpdateNew}>Update</button>
            </div>
            
        )
    }
}

export default ExchangeCharts;